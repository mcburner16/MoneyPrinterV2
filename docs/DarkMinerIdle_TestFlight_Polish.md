# DarkMiner Idle — TestFlight Polish & Stabilization Plan

## Objective
Ship a stable, compliant iPhone TestFlight build focused on moment-to-moment UX quality, reliability, and guardrail regression prevention.

## Non-Negotiable Guardrails
- Do **not** position the product as “earn Bitcoin”.
- IAP must **never** directly grant **REWARD SATS**.
- Preserve all existing compliance hardening.
- Preserve interval/timer stability fixes.
- Preserve offline earnings correctness fixes.
- Preserve withdrawal safeguard behavior.

## Product Framing (Store + In-App)
Use language centered on gameplay progression and milestone unlocks:
- “Idle dark-fantasy mining RPG”
- “Milestone rewards”
- “Optional Lightning withdrawal for eligible milestones”

Avoid wording that implies guaranteed financial return.

## Release Scope for This TestFlight Cycle
### Gameplay polish
- Improve tap feedback (haptics + lightweight VFX budget).
- Tune early progression for first 10 minutes (reduced drop-off risk).
- Improve auto-mine upgrade readability and DPS delta clarity.
- Add explicit raid/boss telegraphs and result summaries.
- Ensure 4 biomes and 4 classes communicate distinct identity quickly.

### UX quality
- One-handed reachable controls on iPhone form factors.
- Consistent 60fps target under normal gameplay load.
- Clear loading/empty/error states for all network-dependent screens.
- Add explicit timestamps for last save sync and last reward checkpoint.

### Economy integrity
- Enforce hard separation:
  - **GAME SATS**: gameplay spend/progression.
  - **REWARD SATS**: milestone-only ledger, non-IAP source.
- Add audit logs for every transition touching reward balance.
- Build assertion checks to prevent cross-ledger contamination.

### ZBD withdrawal flow hardening
- Validate invoice format client-side and server-side.
- Require pre-withdraw sync and balance freshness checks.
- Add idempotency keys for withdraw requests.
- Add cooldown + duplicate-submit prevention UI.
- Show deterministic failure reasons and retry guidance.

### Save/recovery reliability
- Server-authoritative conflict policy with deterministic merge rules.
- Resume-from-background and cold-start save restoration checks.
- Offline queue for pending actions with replay ordering guarantees.

## Regression Checklist (Must Pass)
### Compliance
- No UI text, push text, onboarding text, or store metadata claims “earn Bitcoin”.
- Reward sats not purchasable via IAP in any path.

### Stability
- No reintroduction of timer/interval drift bugs.
- Offline earnings bounded and replay-safe after long sleep cycles.
- Withdraw safeguards intact (cooldown, validation, duplicate prevention).

### Functional smoke
- Tap mining, auto-mine, raids, bosses, class modifiers, and biome transitions all pass.
- Save sync survives airplane mode toggles and app restarts.

## Test Matrix (iPhone)
- iPhone SE (small-screen layout)
- iPhone 13/14 baseline
- iPhone 15 Pro / 16-class high refresh

Run each on:
- Fresh install
- Upgrade install
- Low battery mode
- Poor network and offline/online transitions

## Telemetry Required Before Wider Rollout
- Crash-free sessions
- ANR/hang rate
- Mean session length
- D1 return proxy from TestFlight cohorts
- Withdraw attempt success/failure funnel
- Save conflict and restore failure counts

## Exit Criteria for Wider External TestFlight
- Zero critical blockers in compliance and withdrawal categories.
- No high-severity regressions in interval/offline earnings.
- Crash-free rate at or above internal threshold for 72 hours.
- Economy integrity checks show no ledger crossover incidents.

## Suggested Implementation Order
1. Lock wording/compliance copy audit.
2. Add ledger and withdraw invariant assertions.
3. Validate save/restore/offline replay under adverse network scenarios.
4. Apply gameplay and UX polish tweaks.
5. Run full regression matrix and ship external TestFlight build.
