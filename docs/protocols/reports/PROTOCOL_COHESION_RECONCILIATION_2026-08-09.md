# Protocol Cohesion Reconciliation — 2026-08-09

`[CLASS:PRIME] [STATUS:ACTIVE] [DOC_TYPE:AUDIT_REPORT] [VISIBILITY:COLLECTIVE] [OWNER:TNF]`

**Scope:** Overlaps, contradictions, and gaps found while reconciling work done
on 2026-08-09 against the pre-existing TNF harness protocols. Every finding is
measured against a file in this repo, not inferred.

**Companions:** `TNF_COLLISION_PROVISION.md`,
`TNF_AGENT_WORKSPACE_ISOLATION_PROTOCOL.md`,
`TNF_FEDERATED_TAG_SYNERGY_SPEC.md`, `.agent/ROLE_DEFINITIONS.md` (Phase 8/9),
`FEDERATED_ID_ENCODING_AUDIT_2026-06-14.md`.

---

## 1. Resolved — `ID#` collision in the provisional edge namespace

**Severity: live routing defect.**

`ROLE_DEFINITIONS.md` Phase 9 names exactly one source of truth for `idNumber`:
`FederatedIdentityService`, allocating **sequentially** via Redis
`INCR tnf:identity:seq:<agentId>`. A browser content script cannot reach Redis,
so three mirrored copies of `deterministicIdNumber()` hash the agent id instead
— a scheme Phase 9 never sanctioned.

Its space was `5000 + (h % 10000)`: **10,000 values**. Measured against the live
194-agent roster:

```
distinct ID#  : 192
COLLIDING     : 2
  ID#:4gV  <-  brand-outreach-agent || temporal-agent-reclassifier
  ID#:3Ub  <-  interoperability-protocol-agent || research-agent
```

`resolveMessageTarget()` routes on `@ID#:…`, so each collision was an
**ambiguous address**, not a cosmetic clash.

**Fix applied.** Space widened to `1e6 + (h % 1e9)` across all three mirrors
(`federation-identity.ts`, `federation-protocol.cjs`,
`recovery-federation.ts`), and the function documented as **provisional** — a
server-supplied `idNumber` always wins. Same roster now yields **194 distinct**
values; 33 parity/addressing tests pass. Collisions scale as n²/2N, so this must
be re-measured before the fleet grows an order of magnitude.

### 1b. A fourth mirror, on the live registration path

The first pass fixed three mirrors. A fourth — `deterministicBridgeIdNumber` in
`packages/relay-core/src/agent-registry-bridge.ts:29` — was missed and is the
one that **actually runs at agent registration**. It carried the same 10,000-
value space and additionally lacked the `String(agentId || 'agent')` fallback,
so it produced a different value for empty input than its three siblings.

Both fixed; all four now verified identical, including the nullish case.

### 1c. The bands were a provenance scheme that had already failed

The bridge comment recorded the intent: *"Bias 5000-14999 so deterministic
bridge IDs are visually distinct from production sequential (1-N) and from
seeder (1000-9999)."* An `ID#`'s provenance was meant to be readable from its
value. It was not — the provisional band **overlapped the seeder band** at
5,000–9,999.

Bands are now normative and disjoint (recorded in `ROLE_DEFINITIONS.md` Phase 9):

| Band | Minter | Status |
| --- | --- | --- |
| `1 – 999,999,999` | `FederatedIdentityService` (Redis `INCR`) | authoritative |
| `1e9 – 2e9` | four provisional mirrors | provisional |
| `2e9 – 3e9` | seeder | placeholder |

The seeder was the **third** site with this defect. Its `1,000 + (h % 9,000)`
band sat inside the production range, overlapped the old provisional band, and
measured one real collision (`backend-specialist` and `cto-agent` → `3755`).
Moved to `2e9 – 3e9`.

All three bands verified against the live 194-agent roster: **194 distinct
values in each, zero cross-band overlap.** Re-seeding assigns new `ID#`s to
already-seeded agents — they are placeholders, but persisted references need
refreshing.

### 1d. The audit's §3.3 finding was understated

The 2026-06-14 audit reported that `FederatedIdentityService` "does not write
back to the `agents.id_number` column." Tracing the callers shows something
larger: **`generateIdNumber()` has no production callers at all.** Its only
invocation is `verify-sovereign-state.ts`, a verification script. Registration
mints a *provisional bridge* ID instead.

So the authoritative sequential band that Phase 9 designates as the single
source of truth is **not in use**. A write-back would have been built onto a
method nothing calls. This is re-scoped in §8 accordingly — it is a wiring gap,
not a persistence gap, and it needs an operator decision about the registration
path before code.

---

## 2. Resolved — UFTE reused two names that were already taken

`TNF_FEDERATED_TAG_SYNERGY_SPEC.md` (drafted 2026-08-06) collided with two
identifiers that are enforced in code and schema:

| Was | Now | Why |
| --- | --- | --- |
| `mcid` = "Base58 Merkle Entity Hash" | `merkleRoot` | `mcid` is the **Master Cumulative ID** — a lineage envelope (`tnf/mcid/0.1`, requires `spec`/`id`/`scope`/`lineage`), whose `id` is a **UUID v4**. Merkle hashing has its own schema, `tnf-merkle-tree.schema.json`. A Base58 digest could never have lived in a UUID field. |
| `[DOMAIN_SCOPE]` | `[VISIBILITY]` | `TNF_DOCUMENT_TAGGING_PROTOCOL` is `[STATUS:LOCKED]` and mandates `[CLASS] [STATUS] [DOC_TYPE] [VISIBILITY]`. |

`federatedId` vs `canonicalEntityId` was **not** a collision and is now
documented as complementary: Phase 9's three namespaces identify **agents**
(rows on the `agents` table); UFTE's `federatedId` identifies **content
entities** (docs, goals, skills), which have no such row.

---

## 3. Resolved — pre-mutation guard vs `TNF_COLLISION_PROVISION` C2

C2 already claimed git-working-tree collisions, and two of its lines were
actively dangerous:

- C2 recovery said *"If working tree is corrupted: `git checkout -- .` from a
  clean branch."* That discards every uncommitted change, is the exact class of
  operation that erased ~30 files twice on 2026-08-09, and **no hook can
  intercept it** — it updates no ref, so `reference-transaction` never fires.
- C2 prevention said to *"clean stashes before starting new work."* Both
  maintenance stashes that day were the **only** copy of 36 files.

**Fixed.** Recovery order inverted (inspect → park to scratch branch → restore
narrowest path); whole-tree checkout reclassified as an operator action
requiring `TNF_MUTATION_OK=1`; stash discipline now requires tag-verify-drop and
states that `git stash push` omits untracked files.

The guard is registered as C2 **Pre-Action Check #8**. Checks 1–7 all ask *"is
another actor mid-write?"*; #8 asks *"is there uncommitted work this will
destroy?"* — the question the incident turned on, and the one no other check
covered. Refusals append to `data/protocols/COLLISION_LOG.jsonl` per §4.4.

---

## 3b. Resolved — 72 diverged skill names were mostly vendor variants

The raw count conflated defects with expected drift. Body-level triage
(`scripts/skills/triage-skill-divergence.cjs`, hashing the body only so that
frontmatter gained during promotion is not counted as content divergence):

| Verdict | Count | Meaning |
| --- | --- | --- |
| CONFLICT | 50 | permanent copies disagree — resolution undefined |
| stale snapshot | 21 | permanent copies agree; snapshot lags a promotion sweep |
| snapshot-only | 0 | — |

The 50 conflicts are **not accidental duplicates**. 48 of them are one skill
vendored into several roots:

```
  48  .skills/                      (flattened distribution)
  40  .agent/skills/antigravity/
  16  .agent/skills/anthropic/
  13  .agent/skills/security/
```

They were already namespaced by *directory*, but the `name:` frontmatter field
carries no namespace, so they collided at resolution time with nothing deciding
the winner.

**Fix applied — declared root precedence**, not deduplication:

```
project-authored > curated > vendored > foreign runtime > snapshots(never)
```

`ROOT_PRECEDENCE` in `build-skill-manifest.cjs`. The manifest's Divergence
section now publishes, per name, the path it **resolves to** — e.g.
`frontend-design` (8 copies, 3 bodies) → `.agent/skills/frontend-design/SKILL.md`,
the TNF-authored copy, over both vendor variants.

Deleting a vendor variant would lose content; declaring precedence does not. The
variants stay available and the ambiguity is gone.

**Open operator decision:** for the 16 names present in *both*
`anthropic/` and `antigravity/`, precedence currently prefers `anthropic/`
(upstream-authored) over `antigravity/`. Reverse the two entries in
`ROOT_PRECEDENCE` if the installed Antigravity distribution should win instead.

---

## 4. Resolved — two `AgentCard` schemas, now declared as canonical + projection

| Schema | Title | Required |
| --- | --- | --- |
| `data/agent-registry/agent-card.schema.json` | TNF AgentCard | `schemaVersion`, `id`, `name`, `displayName`, `agentType`, `status`, `sourceFile`, `categoriesNormalized`, `classification` |
| `packages/a2a-protocol/agent-card.schema.json` | A2A Agent Card | `version`, `agentId`, `name`, `skills`, `endpoint` |

Both describe an agent; neither references the other. They disagree on the
identity field (`id` vs `agentId`), the version field (`schemaVersion` vs
`version`), and the meaning of `skills`. The A2A card additionally carries
`aars` (an autonomy score over `autonomy`/`toolUse`/`persistence`) with no
counterpart in the TNF card.

**Fix applied.** The TNF card is declared **canonical** for internal registry
state; the A2A card is a **projection** for external interop — the same shape as
the `canonicalEntityId` / `federatedId` split in §2. Both schemas now carry an
`x-tnf-relationship` annotation naming the other and the generator, so neither
can be read as a standalone source of truth. (Verified semantically identical to
`HEAD` apart from that key.)

The mapping is **executable**, not documentary —
`scripts/protocols/agent-card-projection.cjs` — because a mapping no script
performs drifts the moment either schema changes:

| TNF (canonical) | A2A (projection) |
| --- | --- |
| `id` | `agentId` |
| `displayName` \|\| `name` | `name` |
| `version` \|\| `schemaVersion` | `version` |
| `skills` ∪ `capabilities` ∪ `tools` | `skills` |
| `classification.aarsScore` | `aars.score` |
| `classification.aarsFactors` | `aars.factors` |
| — | `endpoint` — synthesised as `tnf://agent/<id>` |

**AARS was the load-bearing overlap.** Both schemas already carried it with the
same three factors (`autonomy`, `toolUse`, `persistence`), spelled differently;
TNF documents it as *"Agentic AI Risk Score — multiplier to standard CVSS"*.
`endpoint` is A2A-required with no TNF counterpart — an internal registry entry
need not be externally addressable — so it is synthesised under a `tnf://`
scheme rather than fabricated as an http URL, letting a consumer see the agent
is local.

### The measurement that matters

```
cards                 : 136
conform to TNF schema :   0/136   missing schemaVersion,
                                  categoriesNormalized, classification
project to valid A2A  : 136/136
```

**Zero conformance to the canonical internal schema**, total conformance to the
external projection. The data predates the schema and nothing validates it —
§5's pattern again, now with a third instance.

The script deliberately does **not** backfill. `categoriesNormalized` could
plausibly be derived from `tags`, but `classification` requires `domain`,
`workflowStage`, `complexity`, and `riskTier`; inventing a risk tier for 136
agents would manufacture governance data that downstream consumers would then
trust.

---

## 5. Open — enforcement scope is narrower than the protocols claim

`TNF_ARTIFACTS_LIFECYCLE_PROTOCOL` rule 5 states the principle: *a rule is not
in force until the script references it AND that script runs in CI.* Measured
against that standard:

| Protocol | Claims | Actually enforces |
| --- | --- | --- |
| `TNF_DOCUMENT_TAGGING_PROTOCOL` | "every governed markdown unit" | `validate-doc-tagging.cjs` scans a **hardcoded 7-file allowlist** + `docs/library/` — not the other 81 protocol docs |
| Skill governance | 6 required frontmatter keys | frontmatter checked only for the **24 catalogued** skills; the promotion check covers the rest |
| UFTE | "every entity registered in TNF" | `federatedId` appears in 2 docs, `context5W1H` in 1 |
| TNF AgentCard | 9 required fields | **0 of 136** cards conform; nothing validates `agents.json` at all (§4) |

This is the mechanism behind the earlier measurement that only 12% of docs carry
`[CLASS:*]`. The protocols are not wrong; their validators are scoped to a
fraction of what they describe.

---

## 6. Discovered — protocol surfaces not previously catalogued

Two whole structural layers were being bypassed by reading prose specs as
canonical:

- **`docs/protocols/schemas/` — 13 JSON schemas.** These are the
  machine-authoritative definitions (MCID, Merkle tree, TWIP envelope/identity/
  terminal-context/workstream-signal, SGP envelope/payloads, session handoff,
  hook chain, cron governance, agent self-edit, executable intelligence).
  **When prose and schema disagree, the schema wins** — that is what settled §2.
- **`docs/protocols/bridges/` — 13 gate contracts** (`*.yml` + generated
  reports) wiring TWIP to handoff, capability catalog, and orchestrator loop.

### Acronym inventory

| Acronym | Expansion | Where |
| --- | --- | --- |
| `TWIP` | The Web Interoperability Protocol | 4 schemas + `twip-orchestration-extension-v0.1.md` |
| `MCID` | Master Cumulative ID | `tnf-master-cumulative-id.schema.json` |
| `DACC` | agent coordination protocol v1 | `.agent/ROLE_DEFINITIONS.md` |
| `UFTE` | Unified Federated Tagged Entity | `TNF_FEDERATED_TAG_SYNERGY_SPEC.md` |
| `A2A` | agent-to-agent | `packages/a2a-core`, `packages/a2a-protocol` |
| `SGP` | Spreadsheet Graph Protocol | `RFC DRAFT-SGP-0001`, 2 schemas |
| `POML` | Prompt Orchestration Markup Language (Microsoft) | comparative analysis docs |
| `ACA` | Agent Communication API | usage-example docs |
| `UCAN` | capability grants — expiring, task-bound | authority/capability docs |
| `HITL` | human-in-the-loop, 3-tier (EXECUTIVE = dual-sign) | governance docs |
| `CEE` | Code Execution Environments | tooling docs |
| `AARS` | agent autonomy score (autonomy/toolUse/persistence) | A2A agent card |
| `twid` | TWIP terminal identity (pty/process/multiplexer/incarnation) | `twip-identity.schema.json` |
| `D7 / D14 / D16 / D23 / D26 / D27` | numbered directives | `DIRECTIVES.md` |

---

## 7. Also completed 2026-08-09

- **Doc link repair** (`scripts/docs/repair-doc-links.cjs`): valid internal
  links **432 → 851**, dangling **697 → 278**, 60 docs touched, idempotent.
  Rewrites only unambiguous targets and never points a live doc at archived
  content.
- **Tier-0 skill manifest** (`.agent/SKILL_MANIFEST.md`, ~4.9k tokens): the
  corpus had only a ~128k-token frontmatter tier and a ~2.3M-token body tier,
  both unloadable, so neither was loaded and the network was undiscoverable.
  Domains now defer to the declared `category:` field (**34 of 578** declared);
  inference is an explicit backfill.
- **Corpus measurement:** 1,610 `SKILL.md` files resolve to **578 unique
  skills** (1,032 redundant copies); **72 names have diverged** — same name,
  different content, so which copy an agent resolves is undefined.
- **Guard bug fixed:** the mutation guard's `git()` helper called `.trim()`,
  eating the leading space of `git status --porcelain`'s first line — filenames
  parsed as `.txt` and files were reported staged when they were not.
- **Five skills added:** `verifying-command-success`,
  `protecting-uncommitted-work`, `auditing-large-corpora`,
  `reconciling-layered-specs`, `identifier-namespace-design`.

---

## 8. Next

1. **Wire the authoritative allocator into registration** (re-scoped from the
   audit's "write-back", see §1d). `FederatedIdentityService.generateIdNumber()`
   has no production callers; registration mints provisional bridge IDs. Two
   viable shapes, and the choice is an operator call because it changes what an
   `ID#` means:

   - **Allocate at registration.** The bridge calls the service when Redis is
     reachable and falls back to the provisional hash when it is not, then
     writes the result to `agents.id_number`. Authoritative IDs become the norm;
     needs Redis on the registration path.
   - **Reconcile after the fact.** Registration keeps minting provisional IDs; a
     sweep promotes them to sequential and updates the row. Keeps registration
     dependency-free; means an agent's `ID#` changes once, so anything that
     persisted the provisional value must tolerate that.

   Either way `agents.id_number` gains a real value; today it holds a hash from
   the provisional band.

2. **Re-seed to apply the new seeder band.** Existing rows keep their old
   `1,000–9,999` values until the seeder runs, so the collision between
   `backend-specialist` and `cto-agent` persists in the database until then.
3. **AgentCard projection mapping** (§4).
4. **Validator scope** (§5) — widen `validate-doc-tagging.cjs` beyond its
   7-file allowlist, or narrow the protocol's claim to match.
5. **`skills-index.json` is stale** (generated 2026-03-03; `sourceRoots` point
   at paths since moved to TNF-Extensions), so Tier-1 queries misresolve.
