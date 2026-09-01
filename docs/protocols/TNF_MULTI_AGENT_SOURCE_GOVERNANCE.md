`[CLASS:PRIME] [STATUS:CANDIDATE] [DOC_TYPE:PROTOCOL_STANDARD] [VISIBILITY:COLLECTIVE]`

# TNF Multi-Agent Source Governance Protocol

**Protocol ID:** `TNF_MULTI_AGENT_SOURCE_GOVERNANCE`  
**Status:** CANDIDATE — merge review required before canonical promotion  
**Scope:** Shared source discovery, classification, reconciliation, hydration, and actionability across heterogeneous TNF capability providers.

## Purpose

TNF agents frequently inspect the same durable sources through different tools, models, sessions, and retrieval systems. Their descriptions may differ even when they are observing the same underlying artifact. This protocol prevents those observations from becoming duplicate sources, accidental authority promotion, stale implementation work, or private-context leakage.

The protocol deliberately separates five concerns that must not collapse into one field or one agent decision:

1. **source identity** — what durable object was observed;
2. **descriptive facets** — how one or more agents describe or classify it;
3. **authority/currentness** — whether it is trustworthy for the present decision;
4. **hydration eligibility** — whether a given agent/task may load it;
5. **actionability** — whether the observation is sufficient to create consequential work.

The core rule is:

> **Shared source identity is stable; interpretations are versioned observations.**

A source may have many useful aliases, tags, summaries, domains, and interpretations without becoming many source objects.

---

## Relationship to Turn Zero

This protocol operates under `TNF_TURN_ZERO_CANONICAL`.

Before consequential TNF mutation:

- live `whodaniel/tnf-monorepo` authority outranks external indexes or Drive catalogs;
- classification follows Turn Zero's independent work-domain, artifact-destination, residency, and sensitivity axes;
- volatile state is refreshed rather than asserted from memory;
- private or restricted facts are not promoted into public/product source merely because an agent found a reusable pattern.

This protocol does **not** replace the source-refresh skill, repository freshness gates, product-boundary rules, or human/operator authority. It defines how multiple source-observing agents exchange and reconcile evidence.

---

## Canonical Source Identity

Every discovered source SHOULD carry a provider-specific stable identity key.

For Google Drive, the identity key is the **Drive File ID**, not the title, path, generated summary, taxonomy cluster, or URL display text.

Examples:

```text
gdrive:1R9v_qQxr5_fqfS79h3m59ALk4nRrogrNrj6Wng5-Mh4
github:whodaniel/tnf-monorepo@<commit>:<path>
url:https://example.org/resource#<content-or-version-receipt>
```

Where a provider exposes no immutable object identifier, the observer SHOULD record the strongest available tuple of normalized URI, content hash/version marker, and observed timestamp.

### Identity rules

1. Re-observing the same stable identity is an **upsert/reconciliation event**, not automatically a net-new source.
2. A renamed file remains the same source when the provider identity is unchanged.
3. Divergent summaries/tags for one identity are preserved as observations or facets.
4. A copied file with a different provider identity is a distinct source object, even if content is identical; content-hash equivalence may additionally mark it as a duplicate copy.
5. Destructive deduplication is prohibited unless provenance and recovery are preserved.

---

## Source Observation Envelope

A conforming observation SHOULD be representable with the machine-readable schema in:

`data/harness/multi-agent-source-observation.schema.json`

Minimum semantic fields:

- `source_key`
- `provider`
- `provider_object_id`
- `observed_at`
- `observer`
- `title_observed`
- `facets`
- `authority_status`
- `freshness_status`
- `hydration_policy`
- `sensitivity`
- `actionability`
- `evidence`

Observations are appendable evidence. Reconciliation may produce a current resolved view, but must not erase the fact that prior interpretations existed.

---

## Roles and Separation of Concerns

TNF staffs capabilities, not vendor brands. The following are capability roles and may be performed by Gemini, Claude, ChatGPT, Cursor, Codex, a script, or another provider.

### Discovery / Extraction

Optimized for broad traversal and semantic coverage.

May:

- discover files and folders;
- extract text/metadata;
- generate summaries;
- propose tags, facets, aliases, and domain hypotheses;
- identify apparent relationships.

Must not, from discovery alone:

- declare a TNF source canonical;
- create a consequential implementation task from an unverified historical design;
- override privacy restrictions;
- count repeated provider identities as net-new assets.

### Governance / Reconciliation

Optimized for identity, authority, currentness, provenance, privacy, and action gates.

Responsibilities:

- deduplicate/reconcile stable source identities;
- preserve multiple descriptive facets;
- classify authority and freshness;
- apply sensitivity and residency constraints;
- reconcile TNF candidates against live canonical code/protocol state;
- record supersession and conflicts;
- determine hydration and actionability status.

### Execution

Consumes governed source state for a scoped task.

Before consequential mutation, execution must verify that required inputs are sufficiently current and actionable for that task. An execution agent must not treat a discovery tag such as `CORE-TNF`, `Canon`, `Master`, `Current`, `Aligned`, or `Production` as proof of authority.

---

## Authority Model

A descriptive taxonomy and an authority classification are independent.

A file may legitimately be tagged `CORE-TNF` while its authority status is `historical`, `candidate`, `superseded`, or `unknown`.

Recommended authority states:

- `canonical_live` — verified against the live canonical authority surface;
- `current_candidate` — plausibly current but not yet reconciled;
- `historical` — useful provenance, no longer current authority;
- `superseded` — explicitly replaced by another source/decision;
- `reference` — useful external or adjacent material;
- `unknown` — insufficient evidence.

For codebase claims, `canonical_live` requires an appropriate live repository/protocol receipt. A title alone can never establish this state.

---

## Freshness Model

Freshness and authority are distinct.

Recommended freshness states:

- `live_verified`
- `recent_receipt`
- `metadata_only`
- `aging`
- `stale`
- `unknown`

File modification time is only a signal. A recently copied old document may still contain stale claims; a longstanding protocol file may still be current if the canonical system identifies it as active.

---

## Privacy and Hydration Precedence

Sensitivity constrains retrieval even when a source is semantically relevant.

Recommended hydration policies:

- `default_allowed`
- `task_scoped`
- `task_scoped_until_verified`
- `operator_scoped`
- `excluded_by_default`
- `prohibited`

Rules:

1. `private` or `restricted` context is never promoted into broad/default fleet hydration merely because it is useful.
2. Personal, legal, medical, financial, account, credential, client, or customer content defaults to the narrowest reasonable hydration scope.
3. Reusable mechanisms may be generalized only after private facts are stripped.
4. Provider credentials remain private/secret-machine-local under the relevant storage contract.
5. Hydration decisions should be proof-bearing when they affect consequential execution.

---

## Actionability Gate

Discovery is evidence, not authorization.

Recommended actionability states:

- `informational`
- `candidate_task`
- `needs_reconciliation`
- `ready_for_scoped_action`
- `operator_gate_required`
- `blocked`

For a Drive-discovered TNF architecture/specification document, the normal path is:

```text
DISCOVER
  → IDENTIFY
  → RECONCILE AUTHORITY + FRESHNESS
  → CHECK CURRENT CODE/PROTOCOL OVERLAP
  → CLASSIFY DESTINATION + SENSITIVITY
  → AUTHORIZE TASK
  → ACT
  → VERIFY
  → RECEIPT
```

An old design document must not automatically create a parallel implementation when the current monorepo already contains the capability under another name or architecture.

---

## Drift and Conflict Semantics

When one stable source identity appears with differing titles, taxonomy, summaries, or domain claims, record the condition rather than silently overwriting it.

Recommended conflict flags:

- `REPEATED_ID`
- `TITLE_DRIFT`
- `TAXONOMY_DRIFT`
- `SUMMARY_DRIFT`
- `AUTHORITY_CONFLICT`
- `PRIVACY_CONFLICT`
- `FRESHNESS_CONFLICT`
- `ACTIONABILITY_CONFLICT`
- `CONTENT_DUPLICATE`

A multi-facet source is not necessarily erroneous. For example, a video-processing framework may validly carry both media and system-internals facets. Governance should distinguish **useful multidimensional classification** from **contradictory authority claims**.

---

## Shared Ledger Pattern

A shared durable ledger may expose separate logical views instead of forcing every agent to write the same columns.

Recommended logical layers:

1. **Discovery Ledger** — append/enrich observations and taxonomy facets.
2. **Governance Overlay** — stable identity, duplicate count, authority, freshness, sensitivity, hydration, destination, supersession.
3. **Coordination / Handoff Surface** — active agent workstreams, ownership boundaries, last processed cursor/row, unresolved collisions, task-generation gates, and receipts.

The separation is intentional. High-throughput discovery agents should not need to become authority engines, and governance agents should not destroy semantic richness while deduplicating.

---

## Concurrency and Workstream Ownership

When multiple agents are operating concurrently:

- record the active workstream, provider/session, branch or durable receipt, scope, and last-observed time;
- avoid editing the same files in competing branches unless explicitly coordinating a merge;
- treat an actively owned implementation area as a collision boundary;
- prefer non-overlapping branches and handoff receipts;
- after another agent pushes, refresh the live branch/PR before making dependent assumptions.

A UI transcript is not required for coordination when a shared durable state surface exposes sufficient receipts.

---

## TNF-Specific Reconciliation

For any Drive/source-ledger item proposed as current TNF architecture:

1. verify canonical repository identity;
2. refresh `main` or the explicitly authoritative active integration branch;
3. inspect current product-boundary and protocol rails;
4. inspect exact relevant packages/files;
5. identify whether the source describes an existing, renamed, retired, partial, or genuinely missing capability;
6. record the reconciliation result;
7. only then promote it to actionable engineering work.

Historical TNF material remains valuable as provenance and design rationale. It should be preserved rather than rewritten to look current.

---

## Verification Receipt

A governance pass SHOULD emit a receipt containing at least:

- timestamp;
- canonical repository and HEAD when TNF code claims were reconciled;
- discovery cursor/range processed;
- unique stable identities observed;
- repeated identity count;
- taxonomy/title/authority conflict counts;
- sensitive-source exclusions;
- sources promoted/demoted/superseded;
- implementation tasks newly allowed or blocked;
- active workstream collision boundaries;
- unresolved operator decisions.

The receipt itself must not copy restricted source content into a broader visibility plane.

---

## Current Google Drive Reference Implementation

The current shared-state reference implementation is the Google Sheet titled **Master Document Audit Ledger**.

Logical tabs currently used:

- `Sheet1` — discovery/taxonomy observations;
- `Governance Overlay 2026-08-22` — authority/privacy/freshness/identity overlay;
- `Agent Coordination 2026-08-22` — cross-agent contract, cursors, workstream ownership, and reconciliation queue.

This Drive artifact is an external durable coordination surface. It does not outrank `whodaniel/tnf-monorepo` for TNF canonical truth.

---

## Non-Goals

This protocol does not:

- require every agent to use Google Drive;
- require a single taxonomy;
- make a semantic embedding or generated summary authoritative;
- authorize mass deletion of duplicate files;
- copy private source content into TNF;
- replace Git history, code review, product-boundary governance, or Turn Zero;
- require agents to expose proprietary internal chain-of-thought or UI session state.

---

## Adoption Path

1. Use the schema for new shared-source observations.
2. Preserve existing discovery ledgers; add governance overlays non-destructively.
3. Update source-refresh routines to reconcile by stable identity.
4. Record concurrent agent workstreams in the coordination surface.
5. Gate implementation-task generation on authority/currentness/code reconciliation.
6. After field validation, promote this candidate protocol through normal TNF protocol governance.
