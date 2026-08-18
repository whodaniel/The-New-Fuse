`[CLASS:PRIME] [STATUS:LOCKED] [DOC_TYPE:PROTOCOL_STANDARD] [VISIBILITY:COLLECTIVE]`

# TNF Turn Zero Mandate — V2

**Status:** ACTIVE  
**Protocol ID:** `TNF_TURN_ZERO_CANONICAL`  
**Canonical internal development repository:** `whodaniel/tnf-monorepo`

## Purpose
Turn Zero establishes the minimum verified authority, repository identity, classification, current context, and capability staffing required to take the **next safe action**. Interactive responsiveness comes first; mutation readiness is gated separately.

## Authority
- Internal TNF development source: `whodaniel/tnf-monorepo`.
- `whodaniel/The-New-Fuse` is the owned public open-runtime publication target.
- `whodaniel/fuse-control-plane` is the owned private control-plane publication target.
- External public forks are legitimate OSS contribution work surfaces and must record their actual identity.
- Product placement is governed by `TNF_PRODUCT_BOUNDARY.md`, `REPO_SEPARATION.md`, `product-repo-map.json`, and `oss-app-boundary.json`.

## System boundary
TNF is the orchestration framework/control plane. Claude Code, Codex, Cursor, Gemini, OpenClaw, Pi, local models, browser harnesses, services, and humans are capability providers, not foundational protocol identities.

## Lifecycle
`RESPOND → ORIENT → CLASSIFY → HYDRATE → STAFF → ACT → VERIFY → PROPAGATE → HANDOFF`

## Gate 0 — Repository identity
Before write-capable work derive live root/origin/branch/HEAD/dirty/in-progress-operation receipts. Repository mode is one of:
- `canonical-development` — internal `whodaniel/tnf-monorepo`;
- `downstream-publication-target` — owned `whodaniel/The-New-Fuse` or `whodaniel/fuse-control-plane`; internal development here is blocked;
- `external-or-fork` — legitimate public/fork work surface; private TNF source is not assumed available.

Use:
```bash
node scripts/protocols/turn-zero-v2-gate.cjs --require-write-ready
```

## Three-axis classification

### Work domain
`corporate | agency | personal`

### Artifact destination
`oss_runtime | public_contract | private_control_plane | satellite | external`

### Data residency / sensitivity
Residency: `product_state | bounded_working | external_durable | secret_machine_local`  
Sensitivity: `public | internal | private | restricted`

Rules:
1. private/restricted context cannot target public product source;
2. secret-machine-local material remains external;
3. personal/client artifacts default external unless deliberately rewritten as sanitized product-neutral implementation;
4. classification is recorded in handoff state.

Environment hints: `TNF_WORK_DOMAIN`, `TNF_ARTIFACT_DESTINATION`, `TNF_DATA_RESIDENCY`, `TNF_DATA_SENSITIVITY`.

## State freshness
Volatile facts require current receipts. Private canonical/control-plane domains may be `INTERNAL_UNAVAILABLE` in public OSS installations; that is not a failure. Catastrophic claims require independent corroboration.

## Task-scoped hydration
Do not use `apps/frontend/src/data/codebase_map.json` as mandatory authority. Hydrate current product/repo maps, product boundary, repo separation, current receipts, exact task files, and a relevant satellite only when needed.

## Capability staffing
Identify required capabilities, discover currently enlisted providers, evaluate authority/privacy/context/cost/latency/reliability, staff the capability, execute, and verify. Named providers are implementation receipts, not protocol dependencies.

## Inspect → Act → Verify
Inspect current authority/state, act with explicit scope, verify empirically. A successful tool invocation is not automatically proof of the intended system outcome.

## Privacy-preserving assimilation
### Universalize the pattern, not the private context.
Extract generalized mechanisms from personal/tenant/client/medical/legal/financial work, strip identifying/case-specific information, classify and test the generalized artifact, then assimilate only that artifact.

## ASSIMILATE_CHECK V2
Inspect only relevant/enlisted session, diff, failure/trajectory sources, next actions, and recurring evidence. No host-specific path such as `~/.hermes/...` is universally mandatory. Material learning becomes code/test, protocol, skill, issue, known-failure entry, or intentionally external note only when reusable value warrants persistence.

## Interactive mode
Respond first. Load progressive Stage A context as needed, orient before mutation, classify when persistence becomes relevant, hydrate only the task, staff only useful capabilities. Do not automatically pull, ingest full maps, scan all hosts, or load every memory/ledger.

## Swarm/autonomous mode
Run Gate 0; load task-relevant frontload; validate handoff freshness; classify planned artifacts; hydrate current boundaries; staff capabilities; execute; verify; assimilate; write Turn End V2. Existing destructive/credential/elevation/publication/operator gates remain in force.

## Publication
Internal TNF development lands in `whodaniel/tnf-monorepo` and publishes via controlled repo-separation sync. External forks use normal public contribution flow. Do not manually repeat internal feature development in owned downstream targets.

## Turn End
Use `node scripts/turn-end-v2.cjs`; current spec is `tnf/session-handoff/0.2`.

## Operator-facing principle
**Establish just enough verified authority, context, classification, and capability to safely take the next action.**
