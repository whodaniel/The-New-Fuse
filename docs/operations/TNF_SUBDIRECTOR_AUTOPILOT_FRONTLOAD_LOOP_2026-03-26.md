# TNF Sub-Director Autopilot + Frontload Loop (2026-03-26)

## Purpose

Convert Local Sub-Director behavior from prompt-only habits to deterministic,
repeatable runtime loops that also continuously audit TNF
frontloading/onboarding health.

## Implemented Components

1. Sub-Director skill:
   - `.skills/tnf-sub-director-autopilot/SKILL.md`
2. Deterministic cycle checker:
   - `.skills/tnf-sub-director-autopilot/scripts/subdirector-cycle-check.sh`
3. Agent activation contract update:
   - `.claude/agents/sub-director.md`
4. Continuous runtime loop:
   - `scripts/runtime/subdirector-autopilot-loop.cjs`
5. Launchd service wrapper:
   - `scripts/runtime/subdirector-autopilot-service.sh`

## What The Cycle Checker Verifies

1. Runtime orchestration state:
   - master heartbeat status
   - local sub-director status
   - terminal heartbeat status
   - forced sidecar targeting
   - resolved sidecar ownership routing
2. Local Sub-Director identity integrity:
   - owner count from identity registry
   - owner agent IDs
3. Frontload/onboarding health:
   - zsh frontload hook and markers (via frontload verifier)
   - frontload executables
   - `~/.tnf/handoff-current.json` freshness
   - `~/.openclaw/workspace/handoff/LATEST.md` freshness
4. Prompt handoff logging integrity:
   - handoff source/target identity visibility
   - handoff result logging (`delivered`, `skipped`, `blocked`, `deferred`)
   - frontload-to-runtime handoff traceability

## Deterministic Outputs

The checker produces:

1. JSON status payload (`healthy`, `degraded`, `blocked`)
2. one-line status string
3. deterministic `selfPrompt` line
4. action list derived from checks

Supported modes:

1. `--one-line`
2. `--self-prompt`
3. `--log-file <path>`

## Autonomous Runtime Wiring

The loop now runs as a resident service:

1. `com.tnf.subdirector-autopilot` (LaunchAgent)
2. state file:
   - `~/.tnf/subdirector-autopilot/state/subdirector-autopilot-latest.json`
3. service logs:
   - `~/.tnf/subdirector-autopilot/logs/stdout.log`
   - `~/.tnf/subdirector-autopilot/logs/stderr.log`
4. protocol loop ledger:
   - `logs/sub-director-autopilot-loop.jsonl`

Master heartbeat self-healing path now includes:

1. `ensure-subdirector-autopilot`
2. periodic restart/start enforcement alongside local-subdirector +
   relay-monitor

This makes Sub-Director continuity and frontload scrutiny resilient to session
restarts.

## Install And Operations Runbook

From repo root:

```bash
scripts/runtime/subdirector-autopilot-service.sh install
scripts/runtime/subdirector-autopilot-service.sh status
```

Daily operations:

```bash
scripts/runtime/subdirector-autopilot-service.sh restart
scripts/runtime/subdirector-autopilot-service.sh run-once
```

Validation:

```bash
.skills/tnf-sub-director-autopilot/scripts/subdirector-cycle-check.sh --one-line
jq '{generatedAt,status,summary}' ~/.tnf/subdirector-autopilot/state/subdirector-autopilot-latest.json
tail -n 20 logs/sub-director-autopilot-loop.jsonl
```

Recovery:

```bash
scripts/runtime/subdirector-autopilot-service.sh stop
scripts/runtime/subdirector-autopilot-service.sh start
```

This service wrapper executes the loop from
`~/.tnf/bin/subdirector-autopilot-loop.cjs` and writes durable state under
`~/.tnf/subdirector-autopilot/state`.

## Checker Semantics

1. `forcedTargets=0` is treated as healthy when the configured owner terminal is
   not currently observed in the live terminal scan.
2. `forcedTargets=0` is treated as degraded when the owner terminal is observed
   but routing still fails to target it.
3. Frontload warning output is continuously surfaced, but `tnf-frontload`
   command absence is informational (optional) and does not degrade state by
   itself.
4. Missing prompt-handoff logging fields SHOULD be treated as degraded until
   evidence is restored.

## Operating Pattern

1. Run startup checks.
2. Run cycle check.
3. Post one-line status.
4. Use self-prompt output as continuity reinforcement.
5. Execute listed actions if degraded/blocked.
6. Append loop record to:
   - `logs/sub-director-autopilot-loop.jsonl`

## Policy Effect

This ties Sub-Director self-prompting to deterministic routines and keeps
onboarding/frontloading reliability under continuous scrutiny rather than ad hoc
review.

## Forward Roadmap

1. Per-agent tenant frontloading bundles:
   - tenant-aware context blocks selected by agent identity and role.
2. Inter-agent relationship-aware handoff pipelines:
   - prompt routing that is shaped by declared upstream/downstream role
     relationships.
3. Protocol-level enforcement:
   - reject critical handoffs that do not emit minimum logging contract fields.
