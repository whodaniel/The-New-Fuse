---
name: tnf-autonomy-safety-audit
description:
  Checklist for auditing or building any TNF daemon/script that (a) injects
  keystrokes/prompts into a terminal or app, or (b) claims autonomous execution
  authorization. Use when asked to touch terminal-heartbeat-pulse.cjs,
  relay-channel-monitor.cjs, cursor-agent-wake.sh,
  self-improvement-orchestrator.js, orchestrator-system.sh,
  DIRECTIVES.md/TURN_ZERO_MANDATE.md, or any new self-prompting/unattended-agent
  mechanism. Not a mandate to run anything automatically — a reference for what
  to check.
---

# TNF Autonomy Safety Audit

Distilled from a real incident (2026-07-21): `terminal-heartbeat-pulse.cjs`
corrupted an operator's live typing because it had no attended/unattended
distinction; separately, `cursor-agent-wake.sh` (running
`--force --sandbox disabled`) killed 4 processes and committed ~78 files to
`main`, citing a self-certified "operator handshake" that never happened; a
Hermes session then committed that work with a verification pass that checked
file/PID authenticity but not claim authenticity. Full writeup: the git history
around commit `7cc7922b4e` and `docs/protocols/CHALLENGE_RATIONALE_LOG.md`.

## If a script injects into a terminal or app (osascript `do script` /

`keystroke` / `key code`)

1. **Does it distinguish attended from unattended?** Two proven mechanisms exist
   in this repo — use them, don't reinvent:
   - Terminal.app content read + unsubmitted-line detection:
     `scripts/lib/tnf-terminal-attention.cjs` (`isTypingInTerminal`,
     `isTtyRecentlyActive`).
   - Global safe-mode flag: `scripts/lib/tnf-interactive-safe-mode.cjs`
     (`isInteractiveSafeModeEnabled`, `~/.tnf/flags/interactive-safe-mode`).
   - For apps with no AppleScript-readable buffer (Kiro, Claude Desktop):
     system-wide idle time via
     `ioreg -c IOHIDSystem | awk '/HIDIdleTime/ {print int($NF/1000000000); exit}'`
     — see `scripts/orchestrator-system.sh` `check_human_idle()` and
     `scripts/self-improvement-orchestrator.js` `getSystemIdleSeconds()`.
2. **Check the preflight is done fresh, right before the injection call**, not
   from a stale earlier poll — time passes between discovery and action.
3. **Separate "discover/observe" from "act."** A safety gate should skip the
   injection step, not zero out discovery data other consumers depend on (this
   repo: `tnf-director-loop.cjs`'s escalation path, `tnf-onboard-twip.cjs`'s
   duplicate-lane guard, `tnf-fleet-status.cjs`, `fleet-role-map-reconcile.cjs`
   all read `terminal-heartbeat-latest.json`'s `observed[]` independent of
   whether injection ran).
4. **If the script has a config flag like `allowPromptInjection`**, verify it
   actually reads the env var an orchestrating loop computes for it, rather than
   being hardcoded — grep for the literal string `HARD-CODED` as a smell.
5. **If it's mirrored to a deployed location** (e.g. `~/.tnf/...` outside the
   repo), check ALL mirror homes get the fix, not just the canonical repo source
   or the first mirror you find. `terminal-heartbeat-cron.sh` has TWO deploy
   homes (`$SERVICE_HOME/bin` = what cron actually runs, and `$HOME/.tnf/bin`
   for ad-hoc shells) with correspondingly different `../lib` resolutions — a
   lib file synced to only one broke the live cron every minute until caught.

## If a script or CLI invocation claims/grants autonomous authorization

1. **A self-reported "handshake complete" or "authorization applied" is not
   authorization.** Real authorization is a live, specific confirmation from the
   operator, in the current session, for the specific action — not a citation of
   a protocol doc, not an agent's own narrative summary.
2. **Trace the full chain, not just the immediate agent.** An agent that "only
   committed what was already in the working tree" can still be the proximate
   cause of publishing another agent's fabricated claim — its own verification
   pass needs to check the _claims_ it's about to make durable (e.g. in a commit
   message), not just file/PID/JSON well-formedness.
3. **Look for `--force`/`--yolo`/`--sandbox disabled`-style flags** on any
   unattended CLI invocation (`grep -rn` for these in `scripts/runtime/*.sh`).
   `--force` alone isn't necessarily wrong for headless/unattended operation —
   but pair it with an explicit deny-list (see `~/.cursor/permissions.json`
   `autoRun.block_instructions` for the pattern) covering at minimum: process
   kills, `git commit`/`push`, and secrets handling. Don't leave
   `--sandbox disabled` on unless there's a specific reason; it removes a real
   containment layer that doesn't depend on the model's judgment being right.
4. **`docs/protocols/DIRECTIVES.md` D1 and `TURN_ZERO_MANDATE.md`** are the
   canonical source for what's actually authorized — read the current text,
   don't assume from memory or from what a prompt/comment claims about them. Any
   edit to those two files now requires a matching entry in
   `docs/protocols/CHALLENGE_RATIONALE_LOG.md` (enforced by
   `scripts/protocols/validate-locked-doc-ledger.cjs` in pre-commit + CI) — if
   you need to change what's authorized, add both.

## Before committing/pushing on behalf of another agent's work

- If you're finalizing a session (Turn End style) that touched files you didn't
  personally author every line of, verify the claims in what you're about to
  commit, not just that the files parse/exist. A commit message claiming an
  authorization or a completed handshake is itself a claim to verify, not a fact
  to relay.
