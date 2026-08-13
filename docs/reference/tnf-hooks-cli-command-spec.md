# TNF Hooks CLI Command Spec

## Status

Draft v0.1 (May 17, 2026)

## Scope

Defines the initial operator-facing command contracts for:

- `tnf hooks logs`
- `tnf hooks test`
- `tnf hooks replay`
- `tnf hooks explain`

These commands target the HookChain v2 model and workflow-engine-native runtime
path.

## Shared Conventions

### Global Command Shape

```bash
tnf hooks <subcommand> [options]
```

### Global Options

- `--json` output machine-readable JSON only.
- `--tenant <id>` override tenant/workspace scope.
- `--trace-id <uuid>` attach correlation ID to command execution.
- `--verbose` include debug fields and execution timings.

### Exit Codes

- `0` success
- `2` invalid CLI arguments
- `3` resource not found
- `4` validation failure
- `5` execution failure
- `6` authorization/policy denied
- `7` partial success (mixed result set)

## 1) `tnf hooks logs`

### Purpose

Read HookChain run logs and step-level outcomes for one run, one chain, or a
bounded recent time window.

### Syntax

```bash
tnf hooks logs [--run <run_id> | --chain <name>] [--since <duration>] [--limit <n>] [--status <status>] [--json]
```

### Options

- `--run <run_id>` fetch one run timeline.
- `--chain <name>` filter by chain name.
- `--since <duration>` relative window (`15m`, `2h`, `1d`).
- `--limit <n>` max records (default `50`, max `1000`).
- `--status <status>` filter by `running|completed|failed|blocked|cancelled`.
- `--step <id>` optional step filter.

### Output (JSON)

```json
{
  "chain": "typescript-validation-chain",
  "run_id": "run_01J...",
  "status": "failed",
  "trigger_event": "file.edit.post_save",
  "trace_id": "7eaa8d15-...",
  "started_at": "2026-05-17T12:15:03Z",
  "ended_at": "2026-05-17T12:15:49Z",
  "steps": [
    {
      "id": "lint",
      "status": "failed",
      "attempt": 1,
      "duration_ms": 18342,
      "error": "eslint exited with code 1"
    }
  ]
}
```

## 2) `tnf hooks test`

### Purpose

Validate and dry-run a chain against an event fixture without side effects.
Compiles chain -> workflow graph and returns planned step execution.

### Syntax

```bash
tnf hooks test --chain <name>|--file <path> --event <event.json> [--strict] [--json]
```

### Options

- `--chain <name>` use chain from registry.
- `--file <path>` use local HookChain YAML/JSON.
- `--event <event.json>` required event payload fixture.
- `--strict` fail if any warning exists.
- `--render-plan` include compiled workflow node/edge plan.

### Behavior

- No runner side effects are executed.
- Condition expressions are evaluated using constrained evaluator.
- Reports schema errors, unresolved templates, missing policy refs, and merge
  conflicts.
- `--render-plan` includes a workflow-engine compatible projection
  (`nodes`/`connections`/`triggers`/`settings`) for compile-path cross-checking.

### Output (JSON)

```json
{
  "valid": true,
  "warnings": [],
  "compiled": {
    "node_count": 5,
    "edge_count": 4
  },
  "plan": [
    { "step": "format", "will_run": true },
    { "step": "notify", "will_run": false, "reason": "condition false" }
  ]
}
```

## 3) `tnf hooks replay`

### Purpose

Replay a previously failed or blocked run with optional input override.

### Syntax

```bash
tnf hooks replay --run <run_id> [--from-step <id>] [--event-override <event.json>] [--force] [--json]
```

### Options

- `--run <run_id>` required source run.
- `--from-step <id>` restart at specific step (default start from failed step).
- `--event-override <event.json>` replace original event payload.
- `--force` bypass replay-safety warnings (never bypasses policy denies).

### Safety Rules

- Replay requires idempotency key continuity unless explicit override is
  provided.
- Non-idempotent runner actions require explicit confirmation unless
  `--json --force` is used by automation identity with approval scope.

### Output (JSON)

```json
{
  "source_run_id": "run_01J...",
  "replay_run_id": "run_01K...",
  "status": "queued",
  "replay_mode": "from_failed_step",
  "queued_at": "2026-05-17T13:02:11Z"
}
```

## 4) `tnf hooks explain`

### Purpose

Produce a structured explanation for why a run was allowed, denied, blocked, or
failed, including policy and condition decisions.

### Syntax

```bash
tnf hooks explain --run <run_id> [--step <id>] [--json]
```

### Options

- `--run <run_id>` required run identifier.
- `--step <id>` focus on one step.
- `--show-policy-source` include policy pack/rule IDs.

### Output (JSON)

```json
{
  "run_id": "run_01J...",
  "decision_summary": {
    "final_status": "blocked",
    "reason": "REQUIRE_APPROVAL"
  },
  "gate_decisions": [
    {
      "gate": "dangerous-command",
      "decision": "REQUIRE_APPROVAL",
      "reason": "rm -rf detected in prod scope"
    }
  ],
  "step_analysis": []
}
```

## Minimal Acceptance Criteria

1. All four subcommands support `--json` stable output.
2. Commands return the documented exit codes.
3. `test` performs zero side effects.
4. `replay` preserves trace and idempotency lineage.
5. `explain` always includes final decision and gate rationale.
