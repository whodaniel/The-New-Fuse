# TNF Source Concordance

Use this skill when two or more agents, scanners, connectors, or historical indexes are describing overlapping durable sources and TNF needs one coherent, proof-bearing view without erasing useful semantic facets.

## Outcome

Produce a reconciled source view that distinguishes:

- stable source identity;
- descriptive observations/facets;
- authority/currentness;
- privacy/hydration policy;
- supersession/conflicts;
- implementation actionability;
- concurrent workstream ownership.

## Required protocol

Read `docs/protocols/TNF_MULTI_AGENT_SOURCE_GOVERNANCE.md` and operate under `docs/protocols/TURN_ZERO_MANDATE.md`.

Machine-readable observation contract:

`data/harness/multi-agent-source-observation.schema.json`

## Workflow

`OBSERVE → IDENTIFY → UPSERT → RECONCILE → GATE → HANDOFF → RECEIPT`

### 1. OBSERVE

Read the relevant discovery ledger, source index, provider metadata, or current agent receipt. Preserve what the observing agent actually reported; do not silently rewrite historical observations as current truth.

### 2. IDENTIFY

Resolve a stable source identity before counting or classifying.

For Google Drive, use the Drive File ID. A repeated ID with a changed title/taxonomy is one source plus additional observations, not automatically a new asset.

### 3. UPSERT

Merge new facets into the identity record while retaining provenance. Record drift flags when observations disagree.

### 4. RECONCILE

For TNF architecture/code claims:

- refresh `whodaniel/tnf-monorepo`;
- read current product/protocol rails;
- inspect exact relevant packages/files;
- decide whether the discovered design is existing, renamed, retired, partial, missing, or unresolved.

Never infer canonical authority from `CORE-TNF`, `Canon`, `Master`, `Current`, `Aligned`, or similar labels.

### 5. GATE

Apply:

- authority status;
- freshness status;
- sensitivity/residency;
- hydration policy;
- actionability.

Private/restricted content stays outside default fleet hydration. Discovery alone does not authorize consequential engineering work.

### 6. HANDOFF

Record active concurrent workstreams and collision boundaries. If another provider owns a package/branch, avoid competing edits and work in non-overlapping areas unless explicitly coordinating a merge.

### 7. RECEIPT

Emit:

- timestamp;
- canonical repo + HEAD when applicable;
- discovery cursor/range;
- unique identities;
- repeated IDs;
- drift/conflict counts;
- sensitivity exclusions;
- promotions/demotions/supersessions;
- newly allowed/blocked tasks;
- concurrent workstream boundaries;
- unresolved operator decisions.

## Google Drive reference pattern

For the current Master Document Audit Ledger, treat the logical layers as:

- discovery/taxonomy ledger;
- governance overlay;
- coordination/handoff surface.

Do not destructively normalize the discovery history while another bulk-audit agent may be writing it.

## Safety invariants

- Live canonical TNF state outranks generated catalogs.
- Source identity and source interpretation are different things.
- Multi-facet classification is allowed; contradictory authority is not silently accepted.
- Generalize reusable mechanisms, not private facts.
- Preserve history and provenance; prefer overlays/receipts over destructive edits.
