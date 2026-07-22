`[CLASS:PRIME] [STATUS:ACTIVE]`

# TNF Autonomous Continuity Protocol

Status: ACTIVE  
Protocol ID: `TNF_AUTONOMOUS_CONTINUITY_v1.0`  
Version: 1.0  
Created: 2026-07-17  
Related: `TNF_SELF_HEALING_PROTOCOL.md`, `TNF_SELF_SUFFICIENCY.md`, Turn Zero /
Turn End mandates

## Authority

- Canonical source: `docs/protocols/TNF_AUTONOMOUS_CONTINUITY_PROTOCOL.md`
- Improves self-healing by defining the **non-stall continuity stack** and the
  inspect → act → verify loop that keeps TNF working without human prompting.
- Does not replace Turn Zero; it runs **after** Turn Zero authority is present.

## Core Principle

TNF must remain **operationally continuous**: core daemons, heartbeat, harness
monitors, and full-auto cycles must recover or restart without waiting for an
interactive operator turn.

## Continuity Stack (minimum)

| Layer                         | Command / artifact                                                                     | Role                                                  |
| ----------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| 1. Protocol authority         | Turn Zero / Living State / Handoff                                                     | Orientation                                           |
| 2. Runtime core               | `tnf boot --non-interactive --no-attach-agent --require-core`                          | Relay, master-clock, swarm                            |
| 2b. Adaptive Terminal context | `tnf harness context` / `resolve-harness-context.cjs`                                  | Fresh models/providers/hosts per profile              |
| 3. Persistent agent           | `tnf alive up --install-cron`                                                          | Daemon + self-wake                                    |
| 4. Harness monitors           | `tnf harness boot`                                                                     | Relay monitor, terminal heartbeat cron, director cron |
| 5. Unattended improvement     | `tnf full-auto daemon start --interval-minutes 30 --broadcast`                         | Ongoing self-improvement                              |
| 6. Receipts                   | `.agent/runtime-logs/cli-boot.latest.json`, `docs/operations/tnf-full-auto-state.json` | Verify                                                |

Optional single-shot: `tnf boot ... --autonomous` activates layers 3–4 after
boot.

## Anti-Stall Rules

1. **Never report “operational” for core if `--require-core` failed** factory or
   health.
2. **If full-auto daemon is absent**, restart it; do not wait for a human.
3. **If heartbeat log is stale >10 minutes**, apply Self-Healing Protocol §3.
4. **If handoff is missing after critical commits**, emit handoff
   (`tnf handoff emit`) then continue.
5. **Protocol improves protocol**: when a new stall mode is found, append a
   Failure Mode to `TNF_SELF_HEALING_PROTOCOL.md` and a Continuity Stack row
   here in the same change set.

## Inspect → Act → Verify (autonomy cycle)

```text
INSPECT: tnf harness inspect --skip-live-loop
         tnf full-auto status
         tnf alive status (or process probes)
         read cli-boot.latest.json + tnf-full-auto-state.json

ACT:     restart missing layer (boot / alive / harness / full-auto daemon)
         apply Self-Healing remedies

VERIFY:  re-run inspect; confirm receipts updated; confirm no stall signals
```

## Operator / Agent Contract

- Prefer `tnf` over raw subprocesses so Super Admin + harness receipts stay
  attached.
- Use `--non-interactive --no-attach-agent` for unattended boots.
- Use `--require-core` when “green” must mean relay+swarm+health actually
  passed.
- Use `--autonomous` when boot should also arm alive + harness continuity.
- Continuous improvement:
  `tnf full-auto daemon start --interval-minutes 30 --broadcast --skip-strict-status --skip-build`
  unless a full frontend build is required (builds have OOM'd Hermes Node on
  this host).
- **Fleet join:** register a callable worker on `tnf:agent-registry` (platform
  `cursor` / role `worker`), publish a `fleet_join` status on `tnf:bus:ingress`,
  and claim continuity tasks. Example agent id pattern:
  `agent_cursor-fleet-worker_<ts>`.

## Soft Autonomous Turn Cap (TUI / interactive agent)

Interactive autonomous sessions enforce a **hard** turn budget
(`TNF_AUTONOMOUS_MAX_TURNS`, default `50`) that stops self-continuation.

A **soft** warning fires once at `TNF_AUTONOMOUS_SOFT_TURN_RATIO` of that budget
(default `0.8`) via a system message the agent sees on the next turn.

In **LONG_RUN** (fully autonomous) mode only, the agent may override by emitting
`TNF_EXTEND_TURN_CAP=<n>` (or bare `TNF_EXTEND_TURN_CAP`) in a response after
the soft window opens. Extensions are clamped to
`TNF_AUTONOMOUS_TURN_CAP_CEILING` (default `4×` hard cap). Non-LONG_RUN sessions
must hand off cleanly; they cannot self-extend.

| Env                                  | Default | Role                                   |
| ------------------------------------ | ------- | -------------------------------------- |
| `TNF_AUTONOMOUS_MAX_TURNS`           | `50`    | Hard self-continuation halt            |
| `TNF_AUTONOMOUS_SOFT_TURN_RATIO`     | `0.8`   | Soft warning threshold (0–1 exclusive) |
| `TNF_AUTONOMOUS_TURN_CAP_CEILING`    | `200`   | Absolute self-extension ceiling        |
| `TNF_AUTONOMOUS_TURN_EXTEND_DEFAULT` | `25`    | Extension size when marker omits `<n>` |

Implementation: `packages/tnf-cli/src/utils/autonomous-turn-cap.ts`.

## Relationship to Other Boots

| Surface               | Continuity role                                                                       |
| --------------------- | ------------------------------------------------------------------------------------- |
| `tnf boot`            | Primary stack bring-up (plan+exec unified in `packages/tnf-cli/src/boot/pipeline.ts`) |
| `tnf harness boot`    | Cron/monitor install only                                                             |
| `tnf alive up`        | Persistent agent + optional heartbeat cron                                            |
| `tnf zero-turn boot`  | Hermes-centric autonomous lane                                                        |
| `~/.tnf/bin/tnf-boot` | Host fleet profile launcher (Gate 0) — complementary, not a substitute for CLI boot   |

## TUI launch default

`tnf tui` defaults to **LONG_RUN** (full autonomous: shell exec +
auto-continue). Resolution order: `TNF_TUI_MODE` → `~/.tnf/tui-mode.json` →
`LONG_RUN`. Set `TNF_TUI_MODE=INTERACTIVE` (or persist that mode) to wait for
operator input. Turns that emit zero fenced bash blocks inject a stall-break
system nudge.

## Change Log

- 2026-07-22: TUI default mode is LONG_RUN (full autonomous at launch); seed
  `~/.tnf/tui-mode.json`; no-bash stall-break nudge on autonomous turns.
- 2026-07-22: Soft autonomous turn cap + LONG_RUN `TNF_EXTEND_TURN_CAP` override
  (ceiling-clamped); see Soft Autonomous Turn Cap section.
- 2026-07-17: v1.0 — initial continuity stack; binds boot receipts to anti-stall
  rules.
