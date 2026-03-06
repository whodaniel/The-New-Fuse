# Agent Trait Intelligence Ops

## Endpoints

- `POST /api/strategy/traits/craft`
  - `payloadVersion`: currently `1`
  - `provider`: `texassolver` | `cfr_profile` | `risk_profile`
  - optional signed provenance:
    - `provenance`: generator metadata (`generator`, `generatorVersion`,
      `commitSha`, `seed`)
    - `signature`: HMAC object (`alg`, `value`, `keyId`)
  - accepts optional `context` for tournament-aware adjustments:
    - `gameType`: `mtt` or `sng`
    - `phase`: `early` | `middle` | `late` | `bubble` | `final_table`
    - optional: `stackDepthBb`, `playersLeft`, `payoutPressureBps`

- `POST /api/strategy/traits/texassolver`
  - Backward-compatible path pinned to `provider=texassolver`.

- `POST /api/strategy/traits/rollout`
  - create canary cohort and rollback thresholds.

- `POST /api/strategy/traits/rollout/evaluate`
  - evaluate canary telemetry and auto-mark rollback/pass.

- `POST /api/strategy/traits/rollout/evaluate-live`
  - derive fairness telemetry from recent risk alerts (`windowMinutes`) and
    evaluate rollback/pass.

- `GET /api/strategy/traits/rollout/state?rolloutId=...`
  - fetch persisted rollout state.

- `GET /api/strategy/traits/drift?agentId=...`
  - observed-vs-target style drift (`vpip`/`pfr` deltas).

- `GET /api/strategy/traits/slo`
  - trait craft reliability/latency status.

- `GET /api/strategy/traits/dashboard`
  - consolidated view of rollouts, top drift signals, SLO summary,
    freeze/revocation state.

- `POST /api/strategy/traits/policy/freeze`
  - emergency global freeze/unfreeze for trait application.

- `POST /api/strategy/traits/policy/revoke-artifact`
  - block a specific artifact lineage from further application.

## Nightly Jobs

- Workflow: `.github/workflows/traits-intelligence-nightly.yml`
- Job steps:

1. `node scripts/traits/export-cfr-profile.mjs`
2. `node scripts/traits/ingest-risk-profile.mjs`
3. `node scripts/traits/eval-league.mjs`
4. optional online monitor:
   `node scripts/traits/monitor-drift-slo.mjs --base-url ... --token ... --agent-id ...`
5. live rollout evaluator:
   `node scripts/traits/push-rollout-live-telemetry.mjs --base-url ... --token ... --rollout-id ...`

## Script Outputs

- CFR export: `.data/traits/cfr-profile.json`
- Risk ingestion: `.data/traits/risk-profiles.json`
- Risk ingestion quarantine: `.data/traits/risk-profiles-quarantine.json`
- Evaluation harness: `.data/traits/league-report.json`

## Notes

- `payloadVersion` is enforced; unsupported versions are rejected with `400`.
- Tournament `bubble` and `final_table` contexts reduce `maxRiskBps` and tighten
  style overrides.
- League harness is deterministic with seed control (`--seed`).
- If `CASIN8_REQUIRE_TRAIT_SIGNATURE=1`, unsigned/invalid signatures are
  rejected.
- Compliance coupling is enforced at craft time (`amlRiskLevel`, geo blocks,
  banned status) to cap risk.
- Rollout/drift/recommendation state is persisted in `riskdb` tables for
  restart-safe operations.
- Release criteria and emergency actions are in
  [trait-release-policy.md](/path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/casin8-games/docs/trait-release-policy.md).
