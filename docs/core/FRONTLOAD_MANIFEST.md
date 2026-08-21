# FRONTLOAD_MANIFEST.md — TNF Progressive Context Injection

Turn Zero V2 uses **progressive disclosure**: load only the authority and current receipts needed to take the next safe action. File presence is not host injection, and frontload is not permission to mutate.

## Stage A — Orientation

Use in every TNF coding/operations session as needed:

| # | Path | Role |
|---|---|---|
| 1 | `docs/protocols/TURN_ZERO_MANDATE.md` | Lifecycle + write-readiness law |
| 2 | `docs/protocols/reports/SESSION_HANDOFF_LATEST.json` | Latest continuation receipt |
| 3 | `docs/protocols/LIVING_STATE.md` | Durable active state when relevant |
| 4 | `data/distribution/product-repo-map.json` | Canonical repo lineage/roles |
| 5 | `.agent/SYSTEM_PROMPT.md` | Runtime prompt surface |

Prefer summaries for large state files.

### Stage A rail authority and hydration receipts

This table is the canonical Stage A rail inventory. Harnesses, system prompts, onboarding scripts, verification scripts, and provider-specific adapters MUST NOT maintain an independently authoritative competing Stage A list.

A consumer may add local compatibility or diagnostic files, but those additions are not fundamental rails unless this manifest is deliberately updated through the normal protocol-governance path.

For write-capable or autonomous TNF work, **presence is insufficient**. The harness should derive Stage A from this manifest, actually read the current file contents, and emit a hydration receipt containing at minimum:

- manifest path and content hash;
- repository origin, branch, and HEAD used for hydration;
- each Stage A path;
- a content hash for each loaded rail;
- load/observation timestamp;
- load result (`loaded`, `missing`, `unreadable`, or `stale` where applicable);
- the consumer/runtime that performed hydration.

Mutation readiness should fail closed when a required Stage A rail is missing or unreadable. A changed rail hash invalidates an older hydration receipt for decisions governed by that rail and requires re-hydration before the next consequential action.

Context compaction, session handoff, provider substitution, or repository movement also invalidates any unprovable claim that the current actor still holds the required rail context. Re-hydrate the minimum Stage A set rather than trusting conversation memory.

`FRONTLOAD_MANIFEST.md` defines **what must be hydrated**. `TURN_ZERO_MANDATE.md` defines **when and why it is required**. `STATE_FRESHNESS_MANDATE.md` governs mutable external/runtime observations. These are complementary authorities, not duplicate protocol stacks.

## Stage B — Classification / Governance

Load before placement, publication, cross-boundary, or nontrivial implementation decisions:

| Path | Role |
|---|---|
| `docs/product/TNF_PRODUCT_BOUNDARY.md` | OSS/public-contract/private/satellite/external doctrine |
| `data/distribution/oss-app-boundary.json` | Machine-readable app/satellite boundary |
| `docs/REPO_SEPARATION.md` | Canonical development + downstream publication flow |
| `docs/protocols/STATE_FRESHNESS_MANDATE.md` | Volatile-state evidence rules |
| `docs/protocols/state-freshness.registry.json` | Current freshness domains |
| `docs/protocols/ADAPTABLE_HOST_VERIFICATION.md` | Live host/provider discovery |
| `docs/protocols/TURN_END_MANDATE.md` | Handoff contract |
| `docs/protocols/HARNESS_CONFIG.md` | Harness inventory/architecture |
| `data/harness/harness-config.json` | Machine-readable harness config |
| `docs/core/SECURITY.md` | Security constraints |
| `docs/core/ENGINEERING_PRINCIPLES.md` | Engineering norms |

## Stage C — Task-Scoped Hydration

Only after the task is known:

- exact package/app/file paths involved;
- relevant tests and schemas;
- relevant satellite repository if the task crosses into one;
- targeted dynamic memory/trajectory records when useful;
- domain-specific protocols/runbooks;
- `AGENT_STATUS_LEDGER.md` when fleet/known-gap state is actually relevant.

### Do not use as mandatory startup authority

- `apps/frontend/src/data/codebase_map.json`
- generated codebase trackers
- every daily memory file
- every harness/provider log
- every extension/satellite repository

Generated maps may be useful artifacts; they are not a substitute for the current product map, git receipts, or exact source files.

## Capability staffing

When specialized or parallel work is useful:

1. identify required capabilities;
2. discover enlisted providers;
3. select providers by authority/privacy/context/cost/latency/reliability;
4. delegate only when it improves the work;
5. verify results.

A provider can be an agent, model, harness, script, service, or human gate. Do not hard-code one host as protocol infrastructure.

## Privacy

**Universalize the pattern, not the private context.**

Personal/client/tenant source material belongs in its approved private/external location. Only sanitized generalized mechanisms should be promoted into TNF product artifacts.

## Interactive use

```bash
pnpm run tnf:onboard
```

This runs compact Turn Zero V2 orientation and active-provider discovery. Deep legacy diagnostics are opt-in:

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
node --test scripts/protocols/turn-zero-v2-gate.test.cjs
node --test scripts/protocols/state-freshness-gate.test.cjs
node scripts/protocols/validate-locked-doc-ledger.cjs --mode=staged
node scripts/verify-repo-frontload.cjs
```
