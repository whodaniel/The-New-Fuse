---
name: tnf-source-library-refresh
category: tnf-platform
department: tech
description:
  Reconcile TNF, Drive, commercial, and user-context source pathways into a
  current, classified, proof-bearing distribution for clean agent hydration and
  shared access.
---

# TNF Source Library Refresh

## Purpose

Periodically reconcile TNF context sources into a clean, proof-bearing
distribution so agents can start from current doctrine without flattening
canonical, operational, historical, commercial, and private context into one
pool. The refresh also checks that the fleet still resolves user-owned context
through one shared local/Google Drive storage contract rather than drifting into
provider-specific paths.

## Required governance protocol

For any run involving overlapping observations from Gemini, Claude, ChatGPT,
Cursor, scripts, connectors, historical catalogs, or other providers, read and
apply:

- `docs/protocols/TNF_MULTI_AGENT_SOURCE_GOVERNANCE.md`
- `.agent/skills/tnf-source-concordance/SKILL.md`
- `data/harness/multi-agent-source-observation.schema.json` when emitting
  machine-readable observations.

The source-governance protocol is task-scoped Stage C context. Do not add it to
universal Stage A merely because a source refresh uses it.

## Core sequence

`DISCOVER → IDENTIFY → UPSERT → VERIFY → CLASSIFY → RECONCILE → SUPERSEDE → GATE → PACKAGE → DISTRIBUTE → HANDOFF → RECEIPT`

## Required behavior

1. Refresh live `whodaniel/tnf-monorepo` protocol/product-boundary state before
   making freshness claims.
2. Read active workstream/collision-boundary receipts before mutation. Avoid
   competing edits to packages, branches, publication surfaces, or shared
   ledgers already owned by another active agent/workstream.
3. Audit the Google Drive Master Document Audit Ledger and relevant TNF/project
   folders as the broad discovery substrate.
4. Treat stable provider identity as the source key. For Google Drive, use Drive
   File ID; a repeated File ID is an upsert/reconciliation event, not
   automatically a new asset.
5. Preserve useful descriptive facets, aliases, summaries, and multidomain
   taxonomy even when repeated observations disagree. Record
   title/taxonomy/summary drift rather than silently overwriting history.
6. Classify authority posture, freshness, work domain, hydration policy,
   artifact destination, residency/sensitivity, and actionability independently.
7. Never infer canonical authority from labels such as `[CORE-TNF]`, `Canon`,
   `Master`, `Current`, `Aligned`, or `Production`.
8. Reconcile TNF Drive architecture candidates against current repository source
   before promoting them or generating consequential implementation tasks.
9. Refresh Web/product, business, marketing/growth, and sales/commerce
   classifications and keep generic/historical commercial reference separate
   from current TNF strategy.
10. Preserve historical evidence rather than rewriting it to look current.
11. Mark superseded sources explicitly while preserving provenance.
12. Keep founder/private/legal/medical/financial/account/customer context
    outside default engineering/commercial hydration.
13. Prefer one stable source object plus provenance-bearing
    references/observations over duplicate mutable copies.
14. Maintain the stable Drive entrypoint `TNF_SOURCE_LIBRARY_CURRENT`, a dated
    current source-library snapshot, and the clean `TNF_ENGINEERING_CONTEXT`
    package.
15. Publish/update governance overlays, machine-readable manifests, START_HERE
    pointers, distribution ZIPs, and append-only refresh receipts in the shared
    Drive distribution location.
16. Do not create duplicate native Google Docs solely for indexing when that
    would create a second mutable source of truth. Prefer native pointer/index
    documents that reference the canonical/raw source.
17. Audit user-context storage drift: confirm local + Google Drive remain
    provider adapters under the shared TNF profile/storage contract; flag
    hard-coded personal paths, Drive IDs, provider-specific context registries,
    or divergent desktop/hosted/harness behavior.
18. Record the refresh date, canonical HEAD, discovery cursor, notable
    supersessions, repeated-ID decisions, commercial classification changes,
    provider/storage drift, active workstream boundaries, task-generation gates,
    and unresolved ambiguities.
19. Never allow the distribution package, generated ledger, Drive metadata, or
    semantic taxonomy to outrank current canonical repository state.

## Shared-ledger pattern

When the current Google Drive reference implementation is available, treat the
Master Document Audit Ledger as three logical layers:

- `Sheet1` — discovery/taxonomy observations;
- `Governance Overlay 2026-08-22` —
  identity/authority/freshness/privacy/hydration/destination/supersession
  overlay;
- `Agent Coordination 2026-08-22` — discovery cursor, active workstreams,
  collision boundaries, reconciliation queue, and task-generation gates.

Preserve discovery history. Governance corrections belong in the
overlay/coordination surfaces unless an explicit cleanup migration owns the
destructive rewrite.

## Default source layers

- `00_CANONICAL_TNF`
- `10_TNF_OPERATIONAL_EVIDENCE`
- `20_TNF_HISTORICAL_SUPERSEDED`
- `30_TNF_BUSINESS_OPERATIONS`
- `40_FOUNDER_EXTERNAL_CONTEXT`
- `90_DISTRIBUTION_RENDERINGS`
- `INDEX_AND_MAINTENANCE`

For coding-agent hydration, prefer the narrower `TNF_ENGINEERING_CONTEXT`
projection rather than loading every source layer.

## Commercial audit lanes

Within business operations, use explicit lanes for:

- current TNF commercial strategy;
- web product/infrastructure;
- marketing/growth;
- sales/commerce;
- reference/archive;
- excluded personal/restricted;
- index/governance.

Do not promote a marketing/sales/business file to current strategy solely
because it is recent or has TNF in its title.

## User-context storage check

When the current canonical code contains the user-context storage contract,
verify:

- the active user profile is the authority for user-owned context location;
- agents use logical collections rather than invented raw paths;
- core fleet inherits the user profile;
- child swarms/agents inherit parent/user scope unless explicitly overridden;
- Drive readiness requires a real user binding/provider receipt;
- personal bindings/credentials remain outside repository source;
- provider-specific MCP/harness configs are projections, not independent truth
  stores;
- existing user-context storage PR/workstreams are reconciled rather than
  duplicated.

## Verification receipt

A successful run records:

- canonical repository + HEAD;
- refresh timestamp;
- discovery cursor/range processed;
- Drive ledger/governance/coordination status;
- unique source identities and repeated-ID decisions;
- title/taxonomy/authority/privacy/actionability conflicts;
- source counts/signals by classification where available;
- files added/removed/superseded;
- commercial lane changes;
- user-context storage/provider drift findings;
- active concurrent workstream boundaries;
- tasks newly allowed/blocked by reconciliation;
- stable + dated distribution destinations;
- unresolved items requiring operator review.

## Authority rule

Current `whodaniel/tnf-monorepo` protocol state outranks every generated
source-library package. The library is a hydration and distribution aid, not a
replacement canonical authority.
