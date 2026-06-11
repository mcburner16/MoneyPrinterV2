# Reddit Organic Growth Agent

This repository includes an approval-first Reddit assistant for DigitalDrop Co. It scans relevant subreddits, drafts helpful replies, stores candidates in SQLite, and only posts when you explicitly approve a saved draft.

## What it does

- Monitors `r/freelance`, `r/forhire`, `r/Entrepreneur`, `r/digitalnomad`, `r/sidehustle`, `r/freelancewriting`, and `r/copywriting` by default.
- Scores new posts against trigger keywords and help-seeking language.
- Skips posts that mention no-promo/no-advertising signals in the post or flair.
- Uses the OpenAI API to draft short, helpful comments with transparent store mentions.
- Logs every skipped post, draft, approved post, timestamp, post ID, subreddit, and comment score to SQLite.
- Enforces conservative safety limits: five approved comments per day, at least ten minutes between any two approved comments, thirty minutes between approved comments in the same subreddit, and a 24-hour pause when a posted comment drops below the configured downvote threshold.

## Setup

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Fill in `.env` with Reddit script-app credentials, your Reddit username/password, a descriptive `REDDIT_USER_AGENT`, and `OPENAI_API_KEY`.

## Run locally

Generate drafts once:

```bash
python3 agent.py --once
```

List pending drafts:

```bash
python3 agent.py --list-drafts
```

Approve and post one saved draft:

```bash
python3 agent.py --approve 1
```

Run continuously on the configured schedule:

```bash
python3 agent.py
```

## Run on iOS

Native iOS cannot run always-on background Python jobs reliably, so the recommended iPhone workflow is approval and monitoring rather than unattended automation.

1. Install a Python-capable iOS app such as Pythonista, a-Shell, or iSH.
2. Copy this repository to the app's local files area or clone it inside iSH.
3. Install the lightweight dependencies needed by this agent if your chosen app supports pip:

   ```bash
   pip install praw openai schedule
   ```

   The full `requirements.txt` is meant for the entire MoneyPrinter app and may be too heavy for some iOS Python environments.

4. Copy `.env.example` to `.env` and fill in the credentials.
5. Run `python3 agent.py --once` when you want to generate drafts.
6. Run `python3 agent.py --list-drafts` to review drafts on your phone.
7. Run `python3 agent.py --approve <draft-id>` only after manually checking that the subreddit rules and the specific thread allow the comment.

For true 24/7 scheduling, run `python3 agent.py` on a VPS, Mac, Raspberry Pi, or GitHub Actions runner, then use iOS only to review and approve drafts through SSH or a terminal app.

## Safety and compliance notes

- Keep subreddit rules stricter than the script's defaults. If a community bans promotion, do not approve a draft there.
- Do not use this to evade bans, rotate accounts, impersonate customers, or mass-post repetitive comments.
- If a generated draft is not genuinely useful without the link, delete it instead of approving it.
- Treat `.env` like a secret file and do not commit it.
