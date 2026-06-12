# Bridge Contract: Full-Auto Provision -> Execution

## Source Skill

- `tnf-full-auto-network-autopilot` provisioning phase

## Target Skills/Flows

- `tnf-stack-self-improvement-loop` execution (`tnf full-auto once|start`)
- Runtime status verification (`tnf full-auto status`)

## Handoff Schema

- `provisionReport.targets[]`: list of runtime targets processed or skipped
- `statePath`: `docs/operations/tnf-full-auto-state.json`
- `runLogPath`: `docs/operations/tnf-full-auto-runs.jsonl`
- `lastRun.ok`: boolean pass/fail indicator

## Validation

1. Provisioning completed for at least one runtime target.
2. `statePath` exists after `once`/`start`.
3. `runLogPath` contains at least one JSONL row.
4. `tnf full-auto status` returns without error.

## Failure Policy

- Partial target provisioning does not block loop start if at least one primary
  runtime (`codex`, `claude`, `tnf`) succeeded.
- Any `full-auto once` failure blocks `start` until status is inspected and
  issue remediated.
