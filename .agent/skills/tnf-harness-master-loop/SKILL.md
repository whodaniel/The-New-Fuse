---
name: tnf-harness-master-loop
description:
  Operate the TNF harness master loop (inspect → act → verify), autonomous
  interactive mode, handoff task queue, and live LLM loop verification. Use when
  running tnf harness, tnf tui --autonomous, /autonomous on, or iterating on
  harness reliability.
---

# TNF Harness Master Loop

Use this skill when operating the TNF terminal harness, autonomous interactive
lane, or closing a session with fresh handoff artifacts.

## Master Loop Contract

Every harness iteration follows **Inspect → Act → Verify**:

1. **Inspect** — protocol health, agent registration, handoff `next_actions`,
   harness module contract
2. **Act** — execute the top handoff action or harness improvement focus
3. **Verify** — re-run inspect checks; log cycle to
   `docs/operations/tnf-harness-cycle.jsonl`

## CLI Commands

```bash
# One full master loop pass (live LLM verification included)
tnf harness cycle

# Fast structural inspect (no live LLM call)
tnf harness inspect --skip-live-loop

# Full inspect with live LLM loop check
tnf harness inspect

# Single inspect-act-verify loop turn with configured TNF LLM
tnf harness loop --task "Next harness improvement focus"

# Boot relay monitor + heartbeat + director cron
tnf harness boot

# Refresh handoff at session close
tnf turn-end
```

## Interactive Slash Commands

From `tnf tui` or boot-attached agent session:

```text
/harness inspect
/harness cycle
/harness loop --task "Deploy API auth fix"
/harness boot
/cycle
/gate
/turn-end
/autonomous on
/tui --autonomous
/boot
```

## Autonomous Interactive Lane

Enable unattended multi-turn execution in the interactive agent:

```bash
tnf tui --autonomous
# or in-session:
/autonomous on
```

Autonomous mode behavior:

- Auto-continues after each LLM turn (no operator prompt required)
- Reads `SESSION_HANDOFF_LATEST.json` `next_actions` sequentially
- Caps shell blocks at 5 per turn; skips exploratory find/grep on `cli.ts`
- Runs verify gates after bash blocks (agent registration + living-state sync)
- Defaults stall defense to 120s when unset (`TNF_STALL_DEFENSE_TIMEOUT`)
- Stops after 50 turns (`TNF_AUTONOMOUS_MAX_TURNS`) and returns to prompt

Environment overrides:

```bash
export TNF_INTERACTIVE_EXEC=1
export TNF_STALL_DEFENSE_TIMEOUT=120
export TNF_AUTONOMOUS_MAX_SHELL_BLOCKS=5
export TNF_AUTONOMOUS_MAX_TURNS=50
export TNF_AUTONOMOUS_TURN_DELAY_MS=500
```

## Authority Stack

1. `docs/protocols/TURN_ZERO_MANDATE.md`
2. `docs/protocols/LIVING_STATE.md`
3. `docs/protocols/AGENT_STATUS_LEDGER.md`
4. `docs/protocols/reports/SESSION_HANDOFF_LATEST.json`

## Verification Checklist

After any harness or autonomous session:

```bash
node scripts/check-agent-registration.cjs
tnf protocol gate
tnf harness inspect --skip-live-loop
tnf turn-end
git status
```

## Related Skills

- `tnf-cursor-harness-protocol` — Cursor CLI onboarding under TNF
- `tnf-full-auto-network-autopilot` — background full-auto self-improvement loop
- `tnf-multi-agent-state-governor` — fleet state and ledger reconciliation

## Failure Handling

- If `harness.agentLoopLive` fails, confirm LLM provider keys via
  `tnf ai models` and retry with `tnf harness loop --json`
- If verify gates fail in autonomous mode, fix the failing check before
  continuing
- If handoff gate blocks CI, run `tnf turn-end` and include protocol files in
  commit
- Never use mock/fake LLM paths — all harness loops require live provider config
