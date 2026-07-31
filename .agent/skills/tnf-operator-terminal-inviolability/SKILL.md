---
name: tnf-operator-terminal-inviolability
description:
  Codifies the D24 hard rule that no cron-driven agent may reach into the
  operator's Terminal.app UI (no activate, no set frontmost, no auto-submit).
  Use whenever a new cron script touches Terminal.app, when adding a heartbeat,
  when reviewing a cron entry that simulates keystrokes, or when the operator
  reports focus-stealing.
---

# TNF Operator Terminal Inviolability Skill

Extracted from `docs/protocols/TNF_OPERATOR_TERMINAL_INVIOABILITY_PROTOCOL.md`
(D24, DIRECTIVES.md) after the 2026-07-28 operator audit found
`terminal-heartbeat-pulse.cjs` stealing Terminal.app focus every minute.

## When to use this skill

Load this skill whenever you are:

- **Writing or reviewing** any cron script that touches `Terminal.app`,
  `osascript`, `System Events` keystroke simulation, or `do script`.
- **Adding or modifying** a heartbeat, wake-up, or terminal-awareness loop.
- **Investigating operator reports** of focus-stealing or unexpected prompt
  submission.
- **Auditing** an existing cron for
  `TNF_TERMINAL_HEARTBEAT_ALLOW_PROMPT_INJECTION` or any AppleScript that
  touches the UI.

## The rule (D24, in one sentence)

No cron-driven agent may `tell application "Terminal" to activate`,
`set frontmost of window id N to true`, or auto-submit a prompt into a Terminal
tab unless the operator has explicitly opted in via
`TNF_TERMINAL_HEARTBEAT_ALLOW_PROMPT_INJECTION="true"` AND the crontab entry
carries a sibling `challenge_rationale` AND a corresponding entry exists in
`docs/protocols/CHALLENGE_RATIONALE_LOG.md`.

## How to apply

1. **Read** the protocol:
   - `docs/protocols/TNF_OPERATOR_TERMINAL_INVIOABILITY_PROTOCOL.md`
   - DIRECTIVES.md D24, D26 (four-tier authority gate), D27 (Self-Evolution
     Mandate)

2. **Run the CI guard** before merging:

   ```bash
   node scripts/protocols/check-operator-terminal-inviolability.cjs
   ```

   The guard fails on `tell application "Terminal" to activate`,
   `set frontmost of window id N to true`, or hardcoded opt-in flags without
   rationale.

3. **When writing a new heartbeat / wake-up**:
   - Use the canonical channel `tnf:heartbeat` (not `tnf:bus:heartbeat`).
   - Sign envelopes via `scripts/lib/tnf-message-auth.cjs`.
   - Add `canonicalEntityId` from the tty via the audit-canonical helper
     (`buildCanonicalEntityId({ category:'TERMINAL', provider:'LOCAL', name:'ttysNNN', instance:1 })`).
   - Carry an `mcid` envelope (`tnf/mcid/0.1`).
   - Skip frontmost windows.
   - Default `TNF_TERMINAL_HEARTBEAT_ALLOW_PROMPT_INJECTION="false"` in the
     crontab; read from env
     (`${TNF_TERMINAL_HEARTBEAT_ALLOW_PROMPT_INJECTION:-false}`) in the install
     script so re-provisioning does not silently flip.

4. **When the operator opts in to bulk wake-up**:
   - Add a one-line `challenge_rationale:` comment immediately above the crontab
     entry naming this skill and the protocol.
   - Append to `docs/protocols/CHALLENGE_RATIONALE_LOG.md` with `doc_hash` (not
     `git_blob_sha`).
   - The CI guard recognises the rationale comment and permits the line.

5. **When auditing an existing cron**:
   ```bash
   crontab -l | grep -B2 TNF_TERMINAL_HEARTBEAT_ALLOW_PROMPT_INJECTION
   rg -n 'tell application "Terminal" to activate' scripts/ packages/ apps/
   rg -n 'set frontmost of window' scripts/ packages/ apps/
   ```
   Any positive result without the rationale is a D24 violation.

## Anti-patterns (and why they fail)

| Anti-pattern                                                                          | Why it fails                                                        |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `osascript -e 'tell application "Terminal" to activate'`                              | D24 hard rule §1                                                    |
| `osascript -e 'tell application "Terminal" to set frontmost of window id 80 to true'` | D24 hard rule §1                                                    |
| Hardcoded `TNF_TERMINAL_HEARTBEAT_ALLOW_PROMPT_INJECTION="true"` in cron              | D24 hard rule §2                                                    |
| `do script "...\n"` in selected tab                                                   | Auto-submits prompt; needs opt-in                                   |
| `pressTerminalKey` with `activate` followed by keystroke                              | Same — focus-steal                                                  |
| Per-tty opt-out via `protected-sessions.json` instead of fixing the source            | Treats symptoms; the source must not focus-steal in the first place |
| Publishing to `tnf:bus:heartbeat` instead of `tnf:heartbeat`                          | Wrong channel; every loop subscribes to `tnf:heartbeat`             |
| Unsigned heartbeat envelope                                                           | Will be rejected at `TNF_MESSAGE_AUTH_MODE=enforce`                 |

## Related

- Protocol: `docs/protocols/TNF_OPERATOR_TERMINAL_INVIOABILITY_PROTOCOL.md`
- Directive: `DIRECTIVES.md` D24, D26, D27
- CI guard: `scripts/protocols/check-operator-terminal-inviolability.cjs`
- Federation context:
  `docs/protocols/reports/FEDERATION_ID_HEARTBEAT_STALL_AUDIT_2026-06-20.md`
- Canonical heartbeat consumers: `tnf-heartbeat-selfwake.py`,
  `tnf-agent-daemon.py`, `hermes-tnf-a2a-bridge.py`,
  `federation-sequence-checker.cjs`

## Self-test

Run from repo root:

```bash
node scripts/protocols/check-operator-terminal-inviolability.cjs
node scripts/protocols/check-artifacts-lifecycle.cjs --only=terminal-heartbeat-history-cap
crontab -l | grep -B1 tnf-terminal-heartbeat-pulse | head -10
```

A clean run plus a crontab line whose env shows
`TNF_TERMINAL_HEARTBEAT_ALLOW_PROMPT_INJECTION="false"` is the green light.
