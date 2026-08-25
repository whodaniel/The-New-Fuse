# FRONTLOAD_MANIFEST.md — TNF Open Runtime Progressive Context Injection

The open TNF runtime uses **progressive disclosure**: preserve a small semantic/protocol rail in every consequential session, then hydrate only the current task. File presence is not host injection, and frontload is not permission to mutate.

The public agent must remain fully useful without access to private TNF source or the hosted orchestration-intelligence implementation.

## Stage A — Public Agent Rail

Use in every TNF open-runtime agent/coding/operations session as needed:

| # | Path | Role |
|---|---|---|
| 1 | `.agent/SYSTEM_PROMPT.md` | Compact open-agent identity + operating rail |
| 2 | `docs/protocols/TNF_INTEROPERABILITY_KERNEL.md` | Minimum provider-neutral semantic compatibility contract |
| 3 | `docs/protocols/TNF_OPEN_AGENT_CORE.md` | Open-agent non-lobotomy/local-autonomy contract |
| 4 | `docs/protocols/TURN_ZERO_MANDATE.md` | Lifecycle + write-readiness law |
| 5 | `docs/protocols/reports/SESSION_HANDOFF_LATEST.json` | Latest public-runtime continuation receipt when present/current |
| 6 | `docs/protocols/LIVING_STATE.md` | Public-runtime active state projection when relevant |
| 7 | `data/distribution/product-repo-map.json` | Repository lineage/roles |
| 8 | `.agent/context/agent-onboarding.md` | Compact host-neutral onboarding pointer |

The machine-readable contract is `data/harness/open-agent-contract.json`.

Verify/hash the rail with:

```bash
node scripts/protocols/open-agent-rail-gate.cjs
```

The gate writes a machine-local receipt to `~/.tnf/runtime/open-agent-rail.latest.json` unless `--no-write` is supplied.

Prefer summaries for large state files. A stale handoff/living-state projection is context, not current authority.

## Stage B — Classification / Governance

Load before placement, publication, cross-boundary, or nontrivial implementation decisions:

| Path | Role |
|---|---|
| `docs/product/TNF_PRODUCT_BOUNDARY.md` | OSS/public-contract/private-hosted/satellite/external boundary |
| `data/distribution/oss-app-boundary.json` | Machine-readable app/satellite boundary |
| `docs/REPO_SEPARATION.md` | Public/private distribution relationship |
| `docs/protocols/TNF_COHERENT_STATE_CONTINUITY.md` | Public continuity projection |
| `docs/protocols/STATE_FRESHNESS_MANDATE.md` | Volatile-state evidence rules |
| `docs/protocols/state-freshness.registry.json` | Current freshness domains |
| `docs/protocols/ADAPTABLE_HOST_VERIFICATION.md` | Live host/provider discovery |
| `docs/protocols/TURN_END_MANDATE.md` | Handoff contract |
| `docs/protocols/HARNESS_CONFIG.md` | Public harness inventory/architecture |
| `data/harness/harness-config.json` | Machine-readable public harness config |
| `docs/core/SECURITY.md` | Security constraints |
| `docs/core/ENGINEERING_PRINCIPLES.md` | Engineering norms |

## Stage C — Task-Scoped Hydration

Only after the task is known:

- exact package/app/file paths involved;
- relevant tests and schemas;
- installed/public agent skills relevant to the task;
- current provider/runtime observations;
- relevant satellite repository if the task crosses into one;
- targeted memory/trajectory records when useful and authorized;
- domain-specific protocols/runbooks;
- `AGENT_STATUS_LEDGER.md` when fleet/known-gap state is actually relevant.

### Do not use as mandatory startup authority

- `apps/frontend/src/data/codebase_map.json`
- generated codebase trackers
- every daily memory file
- every harness/provider log
- every extension/satellite repository
- private TNF source that is not part of the open distribution

Generated maps and hosted responses may be useful evidence; neither replaces the public protocol rail, exact source, current receipts, or operator authority.

## Capability staffing

When specialized or parallel work is useful:

1. identify required capabilities;
2. discover currently available providers;
3. eliminate candidates that fail explicit authority, boundary, or hard capability requirements;
4. select among eligible providers using operator choice, inspectable local policy, user-supplied policy configuration, or an intentionally configured hosted policy contract;
5. delegate only when it improves the work;
6. verify results.

A provider can be an agent, model, harness, script, service, or human gate. Do not hard-code one host as protocol infrastructure.

The open runtime does not require disclosure or availability of TNF's proprietary hosted ranking/optimization implementation.

## Privacy

**Universalize the pattern, not the private context.**

Personal/client/tenant source material belongs in its approved private/external location. Only sanitized generalized mechanisms should be promoted into public TNF product artifacts.

## Interactive use

```bash
pnpm run tnf:onboard
```

This verifies the public agent rail, runs compact Turn Zero orientation, and performs active-provider discovery. Deep diagnostics are opt-in:

```bash
pnpm run tnf:onboard -- --legacy-full
```

Before mutation, use explicit classification and write readiness, for example:

```bash
TNF_WORK_DOMAIN=corporate \
TNF_ARTIFACT_DESTINATION=oss_runtime \
TNF_DATA_RESIDENCY=product_state \
TNF_DATA_SENSITIVITY=public \
pnpm run tnf:onboard -- --write-ready --task "relay-core intent frame change"
```

## Freshness

```bash
node scripts/protocols/state-freshness-gate.cjs --frontload
node scripts/protocols/state-freshness-gate.cjs --refresh
```

## Turn End

```bash
node scripts/turn-end-v2.cjs
```

## Verification

```bash
node scripts/protocols/open-agent-rail-gate.cjs --no-write
node --test scripts/protocols/open-agent-rail-gate.test.cjs
node --test scripts/protocols/turn-zero-v2-gate.test.cjs
node --test scripts/protocols/state-freshness-gate.test.cjs
node scripts/verify-repo-frontload.cjs
```
