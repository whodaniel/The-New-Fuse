# FRONTLOAD_MANIFEST.md — TNF Progressive Context Injection

`[CLASS:PRIME] [STATUS:ACTIVE] [DOC_TYPE:PROTOCOL_STANDARD] [VISIBILITY:COLLECTIVE] [OWNER:TNF]`

Turn Zero V2 uses **progressive disclosure**: load only the authority and
current receipts needed to take the next safe action. File presence is not host
injection, and frontload is not permission to mutate.

Machine onboarding contract: `data/harness/onboarding-contract.json`.

## Stage A — Orientation

Use in every TNF coding/operations session as needed:

| #   | Path                                                 | Role                               |
| --- | ---------------------------------------------------- | ---------------------------------- |
| 1   | `docs/protocols/TURN_ZERO_MANDATE.md`                | Lifecycle + write-readiness law    |
| 2   | `docs/protocols/reports/SESSION_HANDOFF_LATEST.json` | Latest continuation receipt        |
| 3   | `docs/protocols/LIVING_STATE.md`                     | Durable active state when relevant |
| 4   | `data/distribution/product-repo-map.json`            | Canonical repo lineage/roles       |
| 5   | `.agent/SYSTEM_PROMPT.md`                            | Runtime prompt surface             |

Prefer summaries for large state files, but the hydration mechanism must read
the current bytes and receipt their hashes.

### Stage A rail authority and hydration receipts

This table is the **only canonical Stage A rail inventory**. Harnesses, system
prompts, onboarding scripts, verification scripts, skills, and provider-specific
adapters MUST NOT maintain an independently authoritative competing Stage A
list.

Consumers must derive Stage A from this manifest. Compatibility/diagnostic files
may exist, but they are not fundamental rails unless this table is deliberately
changed through protocol governance.

For write-capable or autonomous TNF work, **presence is insufficient**. The
harness must derive Stage A from this manifest, read the current file contents,
and emit a hydration receipt containing at minimum:

- manifest path and SHA-256;
- repository origin, branch, and HEAD used for hydration;
- each Stage A path;
- a SHA-256 for each loaded rail;
- load/observation timestamp;
- load result (`loaded`, `missing`, `unreadable`, or `stale` where applicable);
- the consumer/runtime that performed hydration.

Canonical implementation:

```bash
node scripts/protocols/frontload-manifest.cjs --stage A --json
pnpm run tnf:onboard -- --task "<task>"
```

Mutation readiness fails closed when a required Stage A rail is missing or
unreadable. A changed manifest/rail hash invalidates an older hydration claim
for decisions governed by that rail and requires re-hydration before the next
consequential action.

Context compaction, session handoff, provider substitution, repository movement,
or loss of authority confidence also invalidates any unprovable claim that the
current actor still holds the required rails. Re-hydrate the minimum Stage A set
rather than trusting conversation memory.

`FRONTLOAD_MANIFEST.md` defines **what must be hydrated**.
`TURN_ZERO_MANDATE.md` defines **when and why it is required**.
`STATE_FRESHNESS_MANDATE.md` governs mutable external/runtime observations.
These are complementary authorities, not duplicate protocol stacks.

### Fully harnessed session invariant

A fresh agent/session is considered **harnessed** when:

1. manifest-derived Stage A hydration passes and is hash-receipted;
2. repository identity/current HEAD are known or explicitly classified as
   external/unknown;
3. Living State and handoff freshness are reported rather than silently assumed;
4. a task-scoped Stage B/C hydration plan is emitted;
5. current capability/provider discovery is attempted;
6. the host's TNF injection surface is verified when that host exposes one.

Write-capable/autonomous work additionally requires resolved three-axis
classification and no write-readiness blockers.

This invariant means “fully harnessed” does **not** mean dumping every TNF
document into the model context. It means the session holds the fundamental
rails plus a verified route to the exact additional context/capabilities the
task requires.

## Stage B — Classification / Governance

Load before placement, publication, cross-boundary, or nontrivial implementation
decisions:

| Path                                            | Role                                                    |
| ----------------------------------------------- | ------------------------------------------------------- |
| `docs/product/TNF_PRODUCT_BOUNDARY.md`          | OSS/public-contract/private/satellite/external doctrine |
| `data/distribution/oss-app-boundary.json`       | Machine-readable app/satellite boundary                 |
| `docs/REPO_SEPARATION.md`                       | Canonical development + downstream publication flow     |
| `docs/protocols/STATE_FRESHNESS_MANDATE.md`     | Volatile-state evidence rules                           |
| `docs/protocols/state-freshness.registry.json`  | Current freshness domains                               |
| `docs/protocols/ADAPTABLE_HOST_VERIFICATION.md` | Live host/provider discovery                            |
| `docs/protocols/TURN_END_MANDATE.md`            | Handoff contract                                        |
| `docs/protocols/HARNESS_CONFIG.md`              | Harness inventory/architecture                          |
| `data/harness/harness-config.json`              | Machine-readable harness config                         |
| `data/harness/onboarding-contract.json`         | Machine-readable session-harness contract               |
| `docs/core/SECURITY.md`                         | Security constraints                                    |
| `docs/core/ENGINEERING_PRINCIPLES.md`           | Engineering norms                                       |

## Stage C — Task-Scoped Hydration

Only after the task is known:

- exact package/app/file paths involved;
- relevant tests and schemas;
- relevant satellite repository if the task crosses into one;
- targeted dynamic memory/trajectory records when useful;
- domain-specific protocols/runbooks;
- `AGENT_STATUS_LEDGER.md` when fleet/known-gap state is actually relevant.

### Department / operator-memory route

When the operator names a corporate department (HR, Marketing, Design, Legal,
Tech, Finance, Product, Ops) or says "remember this":

- `docs/operations/TNF_DEPARTMENTS_AND_MEMORY.md`
- `data/departments/corporate-departments.json`
- `data/departments/staffing-index.json` (names only)
- `docs/protocols/HARNESS_MEMORY_LAYER.md`

Do not dump agent or skill bodies. Progressive injection: department show →
`skill-bank-query` → one `SKILL.md` / agent file when invoking it. Persist facts
with `tnf remember retain`, not chat acknowledgement.

When the task is host onboarding or "what file does this agent load":

- `data/harness/host-prompt-profiles.json`
- `node scripts/harness/host-prompt-profiles.cjs --verify`

When ecosystem research is due:

- `tnf scout status` / `.agent/runtime-state/scout-mission-latest.md`
- `docs/operations/CONTINUOUS_ECOSYSTEM_SCOUTING.md`

### Engineering route

For nontrivial TNF engineering/architecture/debugging/implementation/review,
load:

- `.agent/skills/tnf-engineering-context/SKILL.md`

It is an orchestrating meta-skill. It must compose existing protocols/skills
rather than become another authority stack.

### Multi-agent / source-concordance route

When multiple agents, Drive audits, source catalogs, or overlapping durable
sources are involved, load:

- `docs/protocols/TNF_MULTI_AGENT_SOURCE_GOVERNANCE.md`
- `.agent/skills/tnf-source-concordance/SKILL.md`

Stable provider identity is distinct from titles/taxonomies/facets. Discovery
does not itself authorize implementation.

### Source-library route

When current source distributions, Drive classification, supersession,
packaging, or refresh are involved, load:

- `.agent/skills/tnf-source-library-refresh/SKILL.md`

### User-context/storage route

When the task touches user profile/context persistence, memory persistence,
local storage, Google Drive storage, or hosted user-context projection, load the
canonical user-context storage mandate/skill **if present on the active
branch**.

If those artifacts are not present, inspect the active canonical PR/workstream
before inventing provider-specific paths or a competing storage model.

### Video intelligence & semantic skill tree route

When video intelligence processing, actionable intelligence extraction,
multi-persona combinatorics, non-destructive pruning, or hierarchical semantic
skill tree traversal is involved, load:

- `docs/protocols/SOVEREIGN_DISTILLATION_AND_DUAL_TRACK_PROTOCOL.md`
- `docs/protocols/EXPANDED_VIDEO_INTELLIGENCE_SPEC.md`
- `docs/protocols/NON_DESTRUCTIVE_PRUNING_PROTOCOL.md`
- `docs/protocols/HIERARCHICAL_SEMANTIC_SKILL_TREE.md`
- `docs/protocols/THE_VELOCITY_INTEGRITY_BALANCE.md`

### Do-not-reinvent gate

Before creating a new package, protocol, schema, service, workflow, storage
path, agent role, or abstraction:

1. search current source by responsibility and name;
2. inspect active PRs/handoffs/workstreams for overlap;
3. classify the capability as existing, renamed, retired, partial, missing, or
   unresolved;
4. reconcile/extend the current path where possible;
5. only create a new abstraction when it removes overlap instead of increasing
   it.

### Do not use as mandatory startup authority

- `apps/frontend/src/data/codebase_map.json`
- generated codebase trackers
- every daily memory file
- every harness/provider log
- every extension/satellite repository
- Drive documents merely titled `Canon`, `Master`, `Current`, `Aligned`, or
  `[CORE-TNF]`

Generated maps and historical/source-library artifacts can be useful evidence;
they are not substitutes for live product maps, git receipts, protocol rails, or
exact current source.

## Capability staffing

When specialized or parallel work is useful:

1. identify required capabilities;
2. discover enlisted providers;
3. select providers by authority/privacy/context/cost/latency/reliability;
4. inspect active ownership/collision boundaries;
5. delegate only when it improves the work;
6. verify results.

A provider can be an agent, model, harness, script, service, or human gate. Do
not hard-code one host as protocol infrastructure.

## Privacy

**Universalize the pattern, not the private context.**

Personal/client/tenant/legal/health/financial/credential source material belongs
in its approved private/external location. Only sanitized generalized mechanisms
should be promoted into TNF product artifacts. Sensitivity constrains hydration
independently of semantic relevance.

## Interactive use

```bash
pnpm run tnf:onboard -- --task "<task>"
```

The standard onboarder derives Stage A from this manifest, writes a hash
receipt, reports current repository/handoff state, emits task-scoped routes,
checks host injection surfaces, and performs provider discovery.

Deep legacy diagnostics are opt-in and non-authoritative:

```bash
pnpm run tnf:onboard -- --legacy-full
```

Before mutation, use explicit classification and write readiness, for example:

```bash
TNF_WORK_DOMAIN=core \
TNF_ARTIFACT_DESTINATION=oss_runtime \
TNF_DATA_RESIDENCY=product_state \
TNF_DATA_SENSITIVITY=public \
pnpm run tnf:onboard -- --write-ready --task "relay-core intent frame change"
```

To verify all deeper harness layers explicitly:

```bash
pnpm run tnf:onboard -- --full-harness --task "<task>"
```

## Freshness

```bash
node scripts/protocols/state-freshness-gate.cjs --frontload
node scripts/protocols/state-freshness-gate.cjs --refresh
```

Volatile provider/model/port/process/network facts must never be treated as
evergreen because they appear in a prompt, skill, handoff, or historical report.

## Turn End

```bash
node scripts/turn-end-v2.cjs
```

## Verification

```bash
node --test scripts/protocols/frontload-manifest.test.cjs
node --test scripts/protocols/turn-zero-v2-gate.test.cjs
node scripts/protocols/validate-locked-doc-ledger.cjs --mode=staged
node scripts/verify-repo-frontload.cjs
node scripts/harness/provision-injection-surfaces.cjs --verify
```
