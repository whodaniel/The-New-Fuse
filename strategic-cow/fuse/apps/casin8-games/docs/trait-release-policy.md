# Trait Release Policy

## Promotion Gates

Promote a canary rollout to full when all hold:

1. `winRate >= 0.34` in league report.
2. `exploitabilityProxyBb100 <= 62`.
3. `trait SLO status != unhealthy`.
4. No severe drift (`driftBps <= 1800`) on top canary agents.
5. Fairness alerts for canary cohort below rollback threshold.

## Rollback Triggers

Rollback immediately when any holds:

1. `lossBps > maxLossBps`.
2. `volatilityBps > maxVolatilityBps`.
3. `fairnessAlerts > maxFairnessAlerts`.
4. artifact signature mismatch or revoked artifact usage.

## Emergency Controls

- Freeze trait application:
  - `POST /api/strategy/traits/policy/freeze` with `{ "freeze": true }`
- Revoke artifact:
  - `POST /api/strategy/traits/policy/revoke-artifact` with
    `{ "artifactId": "..." }`

## Operational Checklist

1. Generate signed artifacts (`cfr-profile`, `risk-profiles`).
2. Create rollout with explicit rollback thresholds.
3. Evaluate live telemetry at fixed intervals.
4. Monitor `drift`, `dashboard`, and `slo` endpoints.
5. Promote or rollback based on gates.
