# TNF Don't Die Remediation Bridge

Source bridge: `docs/protocols/bridges/tnf-dont-die-remediation.yml`

## Purpose

Convert master-clock escalation evidence into deterministic process remediation
runs, then prove impact with a second audit snapshot.

## Execution

```bash
node scripts/protocols/dont-die-supervisor.cjs --json
```

## Required Validation Outcomes

1. Before/after escalation totals are captured in one report.
2. Every attempted process run has a result payload (success/failure/skipped).
3. Missing run-now commands are surfaced in unresolved output.
4. Stale lock files are swept only when stale and only before remediation.

## Output Artifacts

- `reports/protocols/dont-die-supervisor/dont-die-latest.json`
- `reports/protocols/dont-die-supervisor/dont-die-latest.md`

## Escalation Policy

If critical escalations remain after remediation, the supervisor exits non-zero
unless `--warn-only` is passed.
