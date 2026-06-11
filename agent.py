#!/usr/bin/env python3
"""Reddit organic growth assistant for DigitalDrop Co.

This script monitors configured subreddits, finds posts where a helpful answer may
be appropriate, generates a short draft reply, and stores each candidate in
SQLite. It is approval-first by default: generated replies are not posted unless
an operator explicitly approves a saved draft with ``--approve``.
"""

from __future__ import annotations

import argparse
import os
import sqlite3
import time
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Iterable

import schedule

DEFAULT_SUBREDDITS = [
    "freelance",
    "forhire",
    "Entrepreneur",
    "digitalnomad",
    "sidehustle",
    "freelancewriting",
    "copywriting",
]

DEFAULT_TRIGGER_KEYWORDS = [
    "proposal template",
    "client contract",
    "invoice",
    "rate calculator",
    "onboarding",
    "cold email",
    "portfolio",
    "freelance tools",
    "freelance resources",
]

HELP_INTENT_TERMS = [
    "advice",
    "anyone know",
    "can someone",
    "help",
    "how do",
    "how should",
    "looking for",
    "need",
    "recommend",
    "resource",
    "suggest",
    "template",
    "tool",
    "what do you use",
    "where can i",
]

NO_PROMO_TERMS = [
    "no promotion",
    "no self-promotion",
    "no self promo",
    "no advertising",
    "no ads",
    "no solicitation",
]

DEFAULT_STORE_PRODUCTS = (
    "freelance proposal templates, client contracts, invoices, cold email kits, "
    "rate calculators, portfolio templates, and onboarding kits"
)

UTC = timezone.utc


@dataclass(frozen=True)
class AgentConfig:
    subreddits: list[str]
    trigger_keywords: list[str]
    scan_limit: int
    min_score: int
    scan_interval_hours: int
    max_comments_per_day: int
    min_minutes_between_comments: int
    min_minutes_between_subreddit_comments: int
    pause_downvote_threshold: int
    pause_hours_on_downvote: int
    store_name: str
    store_url: str
    store_products: str
    store_tone: str
    openai_model: str
    database_path: Path


@dataclass(frozen=True)
class CandidatePost:
    post_id: str
    subreddit: str
    title: str
    body: str
    permalink: str
    score: int


def parse_csv(value: str, defaults: list[str]) -> list[str]:
    items = [item.strip() for item in value.split(",") if item.strip()]
    return items or defaults


def load_env_file(path: Path | None = None) -> None:
    env_path = path or Path(__file__).resolve().parent / ".env"
    if not env_path.exists():
        return
    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip("\"").strip("'")
        os.environ.setdefault(key, value)


def load_config() -> AgentConfig:
    load_env_file()
    root = Path(__file__).resolve().parent
    return AgentConfig(
        subreddits=parse_csv(os.getenv("REDDIT_SUBREDDITS", ""), DEFAULT_SUBREDDITS),
        trigger_keywords=parse_csv(os.getenv("TRIGGER_KEYWORDS", ""), DEFAULT_TRIGGER_KEYWORDS),
        scan_limit=int(os.getenv("SCAN_LIMIT", "25")),
        min_score=int(os.getenv("MIN_MATCH_SCORE", "2")),
        scan_interval_hours=int(os.getenv("SCAN_INTERVAL_HOURS", "2")),
        max_comments_per_day=int(os.getenv("MAX_COMMENTS_PER_DAY", "5")),
        min_minutes_between_comments=int(os.getenv("MIN_MINUTES_BETWEEN_COMMENTS", "10")),
        min_minutes_between_subreddit_comments=int(os.getenv("MIN_MINUTES_BETWEEN_SUBREDDIT_COMMENTS", "30")),
        pause_downvote_threshold=int(os.getenv("PAUSE_DOWNVOTE_THRESHOLD", "-2")),
        pause_hours_on_downvote=int(os.getenv("PAUSE_HOURS_ON_DOWNVOTE", "24")),
        store_name=os.getenv("STORE_NAME", "DigitalDrop Co"),
        store_url=os.getenv("STORE_URL", "https://digitaldrop-co.madethis.app"),
        store_products=os.getenv("STORE_PRODUCTS", DEFAULT_STORE_PRODUCTS),
        store_tone=os.getenv("STORE_TONE", "helpful, peer-to-peer, not salesy"),
        openai_model=os.getenv("OPENAI_MODEL", "gpt-4o"),
        database_path=Path(os.getenv("DATABASE_PATH", str(root / "reddit_agent.sqlite3"))).expanduser(),
    )


def require_env(names: Iterable[str]) -> None:
    missing = [name for name in names if not os.getenv(name)]
    if missing:
        joined = ", ".join(missing)
        raise RuntimeError(f"Missing required environment variable(s): {joined}")


def get_reddit_client() -> Any:
    import praw

    require_env([
        "REDDIT_CLIENT_ID",
        "REDDIT_CLIENT_SECRET",
        "REDDIT_USERNAME",
        "REDDIT_PASSWORD",
        "REDDIT_USER_AGENT",
    ])
    return praw.Reddit(
        client_id=os.environ["REDDIT_CLIENT_ID"],
        client_secret=os.environ["REDDIT_CLIENT_SECRET"],
        username=os.environ["REDDIT_USERNAME"],
        password=os.environ["REDDIT_PASSWORD"],
        user_agent=os.environ["REDDIT_USER_AGENT"],
    )


def connect_database(path: Path) -> sqlite3.Connection:
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS interactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            post_id TEXT NOT NULL UNIQUE,
            subreddit TEXT NOT NULL,
            title TEXT NOT NULL,
            permalink TEXT NOT NULL,
            match_score INTEGER NOT NULL,
            draft_text TEXT,
            status TEXT NOT NULL DEFAULT 'drafted',
            reddit_comment_id TEXT,
            created_at TEXT NOT NULL,
            posted_at TEXT,
            last_checked_at TEXT,
            comment_score INTEGER
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS pauses (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            paused_until TEXT
        )
        """
    )
    conn.execute("INSERT OR IGNORE INTO pauses (id, paused_until) VALUES (1, NULL)")
    conn.commit()
    return conn


def utc_now() -> datetime:
    return datetime.now(UTC)


def to_iso(moment: datetime | None = None) -> str:
    return (moment or utc_now()).isoformat(timespec="seconds")


def from_iso(value: str | None) -> datetime | None:
    if not value:
        return None
    return datetime.fromisoformat(value)


def normalize_text(*parts: str) -> str:
    return "\n".join(part or "" for part in parts).lower()


def post_has_no_promo_signal(title: str, body: str, flair: str | None = None) -> bool:
    text = normalize_text(title, body, flair or "")
    return any(term in text for term in NO_PROMO_TERMS)


def score_post(title: str, body: str, keywords: list[str]) -> int:
    text = normalize_text(title, body)
    score = 0
    if any(keyword.lower() in text for keyword in keywords):
        score += 2
    if any(term in text for term in HELP_INTENT_TERMS):
        score += 1
    if "?" in title or "?" in body:
        score += 1
    return score


def already_seen(conn: sqlite3.Connection, post_id: str) -> bool:
    row = conn.execute("SELECT 1 FROM interactions WHERE post_id = ?", (post_id,)).fetchone()
    return row is not None


def is_paused(conn: sqlite3.Connection) -> bool:
    row = conn.execute("SELECT paused_until FROM pauses WHERE id = 1").fetchone()
    paused_until = from_iso(row["paused_until"]) if row else None
    return bool(paused_until and paused_until > utc_now())


def set_pause(conn: sqlite3.Connection, hours: int) -> None:
    paused_until = utc_now() + timedelta(hours=hours)
    conn.execute("UPDATE pauses SET paused_until = ? WHERE id = 1", (to_iso(paused_until),))
    conn.commit()


def find_candidates(reddit: Any, conn: sqlite3.Connection, config: AgentConfig) -> list[CandidatePost]:
    candidates: list[CandidatePost] = []
    for subreddit_name in config.subreddits:
        subreddit = reddit.subreddit(subreddit_name)
        for submission in subreddit.new(limit=config.scan_limit):
            post_id = submission.id
            if already_seen(conn, post_id):
                continue
            title = submission.title or ""
            body = submission.selftext or ""
            flair = getattr(submission, "link_flair_text", None)
            if post_has_no_promo_signal(title, body, flair):
                log_skipped(conn, post_id, subreddit_name, title, submission.permalink, "no-promo signal")
                continue
            match_score = score_post(title, body, config.trigger_keywords)
            if match_score >= config.min_score:
                candidates.append(
                    CandidatePost(
                        post_id=post_id,
                        subreddit=subreddit_name,
                        title=title,
                        body=body[:4000],
                        permalink=f"https://reddit.com{submission.permalink}",
                        score=match_score,
                    )
                )
    return candidates


def log_skipped(conn: sqlite3.Connection, post_id: str, subreddit: str, title: str, permalink: str, reason: str) -> None:
    conn.execute(
        """
        INSERT OR IGNORE INTO interactions
            (post_id, subreddit, title, permalink, match_score, draft_text, status, created_at)
        VALUES (?, ?, ?, ?, 0, ?, 'skipped', ?)
        """,
        (post_id, subreddit, title, permalink, reason, to_iso()),
    )
    conn.commit()


def build_reply_prompt(candidate: CandidatePost, config: AgentConfig) -> str:
    return f"""
You are drafting a Reddit reply for the owner of {config.store_name}.

Post subreddit: r/{candidate.subreddit}
Post title: {candidate.title}
Post body: {candidate.body}

Store context:
- URL: {config.store_url}
- Products: {config.store_products}
- Tone: {config.store_tone}

Write a Reddit comment that:
- Directly answers the user's question or adds genuine value first.
- Is 2-3 concise sentences plus, only if it fits naturally, one short final sentence mentioning {config.store_name} and {config.store_url}.
- Does not pressure the reader, overpromise, impersonate a customer, or hide that this is a store mention.
- Avoids spammy wording, hashtags, emojis, and repeated links.
""".strip()


def generate_reply(candidate: CandidatePost, config: AgentConfig) -> str:
    require_env(["OPENAI_API_KEY"])
    from openai import OpenAI

    client = OpenAI()
    response = client.chat.completions.create(
        model=config.openai_model,
        messages=[
            {
                "role": "system",
                "content": "You write helpful, transparent Reddit comments that respect community rules.",
            },
            {"role": "user", "content": build_reply_prompt(candidate, config)},
        ],
        temperature=0.7,
        max_tokens=180,
    )
    return response.choices[0].message.content.strip()


def save_draft(conn: sqlite3.Connection, candidate: CandidatePost, draft_text: str) -> None:
    conn.execute(
        """
        INSERT OR IGNORE INTO interactions
            (post_id, subreddit, title, permalink, match_score, draft_text, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 'drafted', ?)
        """,
        (
            candidate.post_id,
            candidate.subreddit,
            candidate.title,
            candidate.permalink,
            candidate.score,
            draft_text,
            to_iso(),
        ),
    )
    conn.commit()


def comments_today(conn: sqlite3.Connection) -> int:
    start = utc_now().replace(hour=0, minute=0, second=0, microsecond=0)
    row = conn.execute(
        "SELECT COUNT(*) AS count FROM interactions WHERE status = 'posted' AND posted_at >= ?",
        (to_iso(start),),
    ).fetchone()
    return int(row["count"])


def latest_posted_at(conn: sqlite3.Connection, subreddit: str | None = None) -> datetime | None:
    if subreddit:
        row = conn.execute(
            """
            SELECT posted_at FROM interactions
            WHERE status = 'posted' AND subreddit = ?
            ORDER BY posted_at DESC LIMIT 1
            """,
            (subreddit,),
        ).fetchone()
    else:
        row = conn.execute(
            """
            SELECT posted_at FROM interactions
            WHERE status = 'posted'
            ORDER BY posted_at DESC LIMIT 1
            """
        ).fetchone()
    return from_iso(row["posted_at"]) if row and row["posted_at"] else None


def can_post(conn: sqlite3.Connection, config: AgentConfig, subreddit: str) -> tuple[bool, str]:
    if is_paused(conn):
        return False, "agent is paused after a downvote safety trigger"
    if comments_today(conn) >= config.max_comments_per_day:
        return False, "daily comment limit reached"
    last_any = latest_posted_at(conn)
    if last_any and utc_now() - last_any < timedelta(minutes=config.min_minutes_between_comments):
        return False, "global comment cooldown is active"
    last_subreddit = latest_posted_at(conn, subreddit)
    if last_subreddit and utc_now() - last_subreddit < timedelta(minutes=config.min_minutes_between_subreddit_comments):
        return False, "subreddit comment cooldown is active"
    return True, "ok"


def approve_draft(reddit: Any, conn: sqlite3.Connection, config: AgentConfig, draft_id: int) -> None:
    row = conn.execute("SELECT * FROM interactions WHERE id = ?", (draft_id,)).fetchone()
    if not row:
        raise RuntimeError(f"No draft found with id {draft_id}")
    if row["status"] != "drafted":
        raise RuntimeError(f"Draft {draft_id} has status '{row['status']}', not 'drafted'")
    allowed, reason = can_post(conn, config, row["subreddit"])
    if not allowed:
        raise RuntimeError(f"Cannot post draft {draft_id}: {reason}")
    submission = reddit.submission(id=row["post_id"])
    comment = submission.reply(row["draft_text"])
    conn.execute(
        """
        UPDATE interactions
        SET status = 'posted', reddit_comment_id = ?, posted_at = ?
        WHERE id = ?
        """,
        (comment.id, to_iso(), draft_id),
    )
    conn.commit()
    print(f"Posted draft {draft_id} as Reddit comment {comment.id}")


def list_drafts(conn: sqlite3.Connection) -> None:
    rows = conn.execute(
        """
        SELECT id, subreddit, title, permalink, draft_text, created_at
        FROM interactions
        WHERE status = 'drafted'
        ORDER BY created_at DESC
        LIMIT 25
        """
    ).fetchall()
    if not rows:
        print("No pending drafts.")
        return
    for row in rows:
        print(f"\n[{row['id']}] r/{row['subreddit']} — {row['title']}")
        print(row["permalink"])
        print(row["draft_text"])


def refresh_comment_scores(reddit: Any, conn: sqlite3.Connection, config: AgentConfig) -> None:
    rows = conn.execute(
        """
        SELECT id, reddit_comment_id FROM interactions
        WHERE status = 'posted' AND reddit_comment_id IS NOT NULL
        """
    ).fetchall()
    for row in rows:
        comment = reddit.comment(id=row["reddit_comment_id"])
        score = int(comment.score)
        conn.execute(
            """
            UPDATE interactions
            SET comment_score = ?, last_checked_at = ?
            WHERE id = ?
            """,
            (score, to_iso(), row["id"]),
        )
        if score < config.pause_downvote_threshold:
            set_pause(conn, config.pause_hours_on_downvote)
            print(
                f"Paused for {config.pause_hours_on_downvote} hours because "
                f"comment {row['reddit_comment_id']} score is {score}."
            )
            break
    conn.commit()


def scan_once(reddit: Any, conn: sqlite3.Connection, config: AgentConfig) -> None:
    if is_paused(conn):
        print("Agent is paused; skipping scan.")
        return
    refresh_comment_scores(reddit, conn, config)
    candidates = find_candidates(reddit, conn, config)
    print(f"Found {len(candidates)} candidate post(s).")
    for candidate in candidates:
        draft = generate_reply(candidate, config)
        save_draft(conn, candidate, draft)
        print(f"Drafted reply for r/{candidate.subreddit}: {candidate.title}")


def run_forever(reddit: Any, conn: sqlite3.Connection, config: AgentConfig) -> None:
    scan_once(reddit, conn, config)
    schedule.every(config.scan_interval_hours).hours.do(scan_once, reddit, conn, config)
    while True:
        schedule.run_pending()
        time.sleep(30)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Reddit organic growth assistant")
    parser.add_argument("--once", action="store_true", help="Scan once, generate drafts, and exit.")
    parser.add_argument("--list-drafts", action="store_true", help="List pending drafts without scanning.")
    parser.add_argument("--approve", type=int, help="Post a saved draft by numeric draft id.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    config = load_config()
    conn = connect_database(config.database_path)

    if args.list_drafts:
        list_drafts(conn)
        return

    reddit = get_reddit_client()

    if args.approve:
        approve_draft(reddit, conn, config, args.approve)
        return

    if args.once:
        scan_once(reddit, conn, config)
        return

    run_forever(reddit, conn, config)


if __name__ == "__main__":
    main()
