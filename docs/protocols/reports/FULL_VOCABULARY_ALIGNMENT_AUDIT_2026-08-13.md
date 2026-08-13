# Full TNF Vocabulary Alignment Audit — 2026-08-13

**Verdict: FULLY CONSISTENT (re-verified 2026-08-13T14:30Z)** — All 7
inconsistencies resolved in commit `0a811ca5e0` (Phase 10 Alignment Pass).
Originally 7 inconsistencies found across schema, static vocabulary, and
emit-point layers; all now fixed. 8 gap areas remain for future sweeps.

**Operator session:** `agent:local-subdirector:session:2026-08-13T06:29:48.796Z`
**Audit scope:** Full codebase vocabulary sweep across all 11 canonical surfaces
(post-Phase-9). **Companion JSON:**
`docs/protocols/reports/FULL_VOCABULARY_ALIGNMENT_AUDIT_2026-08-13.json`

> **Re-verification stamp (2026-08-13T14:30Z):** Independent re-check of all 7
> INCs against live codebase state. All PASS:
>
> - INC-1: `AGENT_ROLE_TRAITS` = 5 roles, matches DACC-v1 exactly
> - INC-2: All 6 seeded agents present in AGENT_STATUS_LEDGER (lines 313-318)
> - INC-3: `canonicalEntityId` defined as hierarchical string (line 45)
> - INC-4: ID Band Allocation section present (lines 37-40)
> - INC-5: CI check script `scripts/ci/check-federated-alphabet.sh` enforces
>   lock-step
> - INC-6: Line 337 uses `a.traits` (canonical), not `a.qualities`
> - INC-7: `vector_id` documented at line 47 with disambiguation
>
> **Gates:** type-check (database, relay-core, tnf-cli) PASS, drizzle:check
> PASS, validator round-trip `TNF:AGENT:TNFCORE:TEST_X:001` PASS.

---

## 1. Overlapping Surfaces Found

| #   | Surface                    | Source                                                                                                 | Vocabulary Status                                                    |
| --- | -------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| 1   | Runtime Traits Vocabulary  | `packages/tnf-cli/src/cli.ts:3374-3410`                                                                | **DIVERGED** — CLI has 7 roles vs DACC-v1 5                          |
| 2   | DACC-v1 Role Hierarchy     | `.agent/ROLE_DEFINITIONS.md:6-23`                                                                      | **CANONICAL** — 5 levels only                                        |
| 3   | Agent Bank Targets         | `scripts/agents/reconcile-agent-banks.cjs:293` + `cli.ts:3385`                                         | ✅ **ALIGNED** — merged into PLATFORM_TAXONOMY (14 values)           |
| 4   | Legacy DB Enum `AgentType` | `packages/database/src/drizzle/schema/enums.ts:25`                                                     | 241 values — legacy, persistent, separate axis                       |
| 5   | Metadata jsonb bags        | `packages/database/src/drizzle/schema/*.ts`                                                            | Policy codified in ROLE_DEFINITIONS.md § Metadata policy             |
| 6   | relay-core Agent interface | `packages/relay-core/src/types.ts` + `agent-registry.service.ts`                                       | ✅ **ALIGNED** — daccRole, workerAction, traits, federation          |
| 7   | Registry types (Drizzle)   | `packages/database/src/drizzle/schema/enums.ts` + `agents.ts`                                          | ✅ **ALIGNED** — daccRoleEnum (5), agentRoleEnum (60→workerAction)   |
| 8   | Documentation contracts    | `docs/protocols/AGENT_STATUS_LEDGER.md`                                                                | **DIVERGED** — only 1/6 seeded agents recorded                       |
| 9   | Software Agent Identity    | `.agent/ROLE_DEFINITIONS.md:37-41`                                                                     | **DRIFT** — canonicalEntityId definition incorrect                   |
| 10  | Skill bank                 | `.agent/agents/` (194) + `.claude/agents/` (137)                                                       | Mirror policy enforced                                               |
| 11  | Federated ID Encoding      | `packages/relay-core/src/contracts/identity.ts`, `packages/a2a-core/src/federated-identity.service.ts` | **PARTIAL** — validators PASS, but formula docs & mirrors duplicated |

---

## 2. Specific Inconsistencies

### INC-1: CLI Role Vocabulary Extends Beyond DACC-v1 Hierarchy

- **Details:** `AGENT_ROLE_TRAITS` in `cli.ts:3400-3407` defines 7 roles:
  `director`, `orchestrator`, `broker`, `worker`, `participant`, `coordinator`,
  `bridge`. DACC-v1 hierarchy (`.agent/ROLE_DEFINITIONS.md:6-23`) defines only
  5: `director`, `orchestrator`, `broker`, `worker`, `participant`.
- **Impact:** `tnf register --dacc-role coordinator` and `--dacc-role bridge`
  are accepted by CLI but have no DACC-v1 authority mapping. Broker's
  `isWorkerAgent()` only recognizes the 5 canonical roles (INFRA_ROLES check).
  Agents registered with `coordinator`/`bridge` daccRole will be treated as
  workers with no special authority.
- **Evidence:**
  - `cli.ts:3400-3407` — AGENT_ROLE_TRAITS array
  - `ROLE_DEFINITIONS.md:6-23` — Canonical 5-level hierarchy
  - `broker-agent.ts:1031-1055` — `isWorkerAgent()` only checks 5 canonical
    roles
- **Remediation:** Either (a) add `coordinator` and `bridge` to DACC-v1
  hierarchy with defined authority boundaries, or (b) remove them from
  `AGENT_ROLE_TRAITS` and gate CLI to only the 5 canonical roles. Recommend (a)
  with explicit authority definitions.

### INC-2: AGENT_STATUS_LEDGER Missing 5 of 6 Phase-8 Seeded Agents

- **Details:** Phase 8 (2026-06-14) added STANDING-BY rows for 6 seeded agents:
  `kilo-cli`, `opencode-cli`, `pi-coding-agent`, `claude-code`, `tnf-hermes`,
  `jules`. Current `AGENT_STATUS_LEDGER.md` only shows `opencode-cli-agent`
  (line 298).
- **Impact:** Human-visible standing-by record is incomplete. Operators cannot
  see the full seeded fleet.
- **Evidence:**
  `grep -n 'kilo-cli\|opencode-cli\|pi-coding\|claude-code\|tnf-hermes\|jules' docs/protocols/AGENT_STATUS_LEDGER.md`
  returns only 1 hit.
- **Remediation:** Append 5 missing STANDING-BY entries to
  `AGENT_STATUS_LEDGER.md` with canonicalEntityId, registration timestamp, and
  status.

### INC-3: ROLE_DEFINITIONS.md Defines `canonicalEntityId` Incorrectly

- **Details:** Line 40:
  `- canonicalEntityId: Registry row identifier (integer PK)`. Actual format
  (per `identity.ts:38`, `identity.ts:52`, bridge emit) is
  `TNF:[scope:]CATEGORY:PROVIDER:NAME:INSTANCE` (hierarchical string). The
  integer PK is the internal `agents.id` column.
- **Impact:** Developers reading ROLE_DEFINITIONS.md will confuse the
  hierarchical federated ID with the internal DB primary key.
- **Evidence:**
  - `ROLE_DEFINITIONS.md:40` — incorrect definition
  - `identity.ts:38` — `buildCanonicalEntityId` builds
    `TNF:AGENT:TNFCORE:NAME:001`
  - `identity.ts:52` — `normalizeCanonicalEntityId` validates `TNF:` prefix
  - `agent-registry-bridge.ts:174-179` — emits
    `TNF:AGENT:TNFCORE:${AGENT_ID}:001`
- **Remediation:** Correct line 40 to:
  `- canonicalEntityId: Hierarchical TNF identity `TNF:[scope:]CATEGORY:PROVIDER:NAME:INSTANCE`(e.g.,`TNF:AGENT:TNFCORE:WORKER-01:001`)`.

### INC-4: ROLE_DEFINITIONS.md Missing idNumber Band Allocation Section

- **Details:** `seed-agent-registry.ts:54-58` documents band allocation table
  referencing "See ROLE_DEFINITIONS.md". `ROLE_DEFINITIONS.md` has no such
  section. Also missing: `vector_id` namespace disambiguation (known FOLLOWUP-1
  from Phase 9).
- **Impact:** Single source of truth for ID band allocation is the seeder code,
  not the canonical definitions doc. The 2026-08-09 collision fix widened
  provisional band to `1e9-2e9` but ROLE_DEFINITIONS.md wasn't updated.
- **Evidence:**
  - `seed-agent-registry.ts:54-58` — band table with "See ROLE_DEFINITIONS.md"
  - `federated-id-band-collision-fix-2026-08-09.md` — documents the fix
  - `ROLE_DEFINITIONS.md` — no band allocation section found
- **Remediation:** Add "Provisional edge IDs → idNumber band allocation" section
  to ROLE_DEFINITIONS.md with the three-band table (production 1-999M,
  provisional 1e9-2e9, seeder 2e9-3e9) and vector_id disambiguation note.

### INC-5: FEDERATED_BASE58_ALPHABET Duplicated Across 5 Files (No Single Import)

- **Details:** The canonical Base58 alphabet
  `123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz` is defined
  identically in:
  1. `packages/a2a-core/src/federated-identity.service.ts:21` (canonical,
     exported)
  2. `packages/gemini-browser-skill/src/TranscriptProcessorV2.ts:1647`
     (duplicate)
  3. `packages/database/scripts/seed-agent-registry.ts:30` (duplicate)
  4. `apps/chrome-extension/src/v6/shared/federation-identity.ts:8` (duplicate)
  5. `scripts/lib/federation-protocol.cjs:58` (duplicate)
- **Impact:** Drift risk — if alphabet changes, 5 files must be updated in
  lock-step. Current comments acknowledge this but no enforcement exists.
- **Evidence:**
  `grep -rn 'FEDERATED_BASE58_ALPHABET' packages/a2a-core/ packages/gemini-browser-skill/ packages/database/scripts/ apps/chrome-extension/ scripts/lib/`
- **Remediation:** Export from `a2a-core` as single source; update 4 consumers
  to import. Add CI check that all 5 match.

### INC-6: `qualities` Deprecated Alias Still Referenced in Registry Service Stats

- **Details:** `agent-registry.service.ts:337` uses `a.qualities` in
  `getStats().withQualities` filter. Column was renamed to `traits` in migration
  0009 (Phase 8). The in-memory `Agent` interface keeps `qualities` as
  deprecated back-compat (line 61), but the DB column is `traits`.
- **Impact:** Stats reporting may be inaccurate if `qualities` is not populated
  on in-memory agents.
- **Evidence:**
  - `agents.ts:216` — `traits: jsonb('traits')` (DB column)
  - `agent-registry.service.ts:61` — `qualities: Record<string, unknown>`
    (deprecated in-memory)
  - `agent-registry.service.ts:250-252` — maps `traits` → `qualities` for
    back-compat
  - `agent-registry.service.ts:337` — reads `a.qualities` for stats
- **Remediation:** Update `getStats()` to check `a.traits` (canonical) with
  fallback to `a.qualities`. Or remove `qualities` from in-memory interface
  entirely (breaking change).

### INC-7: `vector_id` Namespace Not Documented in ROLE_DEFINITIONS.md

- **Details:** Phase 9 FOLLOWUP-1 noted `vector_id` (`ID#:Base58(hash[:8])`)
  shares `ID#:` prefix with `idNumber` but encodes hash bytes.
  `KNOWLEDGE_TREE.json` uses `vector_id`. ROLE_DEFINITIONS.md has no mention.
- **Impact:** Consumers seeing `ID#:` cannot distinguish sequential `idNumber`
  from hash-derived `vector_id` without inspecting content.
- **Evidence:**
  - `seed-agent-registry.ts:347-349` — documents the conflict
  - `FEDERATED_ID_ENCODING_AUDIT_2026-06-14.md` — FOLLOWUP-1
  - `ROLE_DEFINITIONS.md` — no `vector_id` reference
- **Remediation:** Add `vector_id` disambiguation to ROLE_DEFINITIONS.md
  Federated ID section. Consider migrating to `VEC#:` prefix (as noted in
  collision fix doc).

---

## 3. Where the Change Landed Correctly

| Area                                                                                 | Status | Evidence                                     |
| ------------------------------------------------------------------------------------ | ------ | -------------------------------------------- |
| PLATFORM_TAXONOMY unification (14 platforms)                                         | ✅     | `cli.ts:3374-3395` includes all bank targets |
| Drizzle schema: daccRoleEnum (5), workerAction, traits, federation                   | ✅     | `agents.ts:176-182`, `enums.ts`              |
| relay-core in-memory registry: daccRole, workerAction, traits, federation            | ✅     | `agent-registry.service.ts:36-61`            |
| Bridge emits `canonicalEntityId` via `buildCanonicalEntityId`                        | ✅     | `agent-registry-bridge.ts:174-179`           |
| Validator round-trip: `normalizeCanonicalEntityId(buildCanonicalEntityId(...))` PASS | ✅     | `node -e` test outputs PASS                  |
| TranscriptProcessorV2/V3/V4 share `generateFederatedIdNumber`                        | ✅     | V3/V4 import from V2                         |
| Provisional ID band widened to 1e9 (collision-free at 194 agents)                    | ✅     | 4 mirrors verified lock-step                 |
| Seeder uses disjoint 2e9-3e9 band                                                    | ✅     | `seed-agent-registry.ts:73`                  |
| All type-check / drizzle:check / Turn Zero gates PASS                                | ✅     | Verification step outputs                    |

---

## 4. Recommended Next Move

**Run Phase 10 Alignment Pass** (estimated 3-4 hours):

1. **Fix INC-1** — Decide on `coordinator`/`bridge` in DACC-v1: add to hierarchy
   with authority docs, or remove from CLI traits. (30 min)
2. **Fix INC-2** — Append 5 missing STANDING-BY entries to
   `AGENT_STATUS_LEDGER.md`. (15 min)
3. **Fix INC-3** — Correct `canonicalEntityId` definition in
   `ROLE_DEFINITIONS.md:40`. (10 min)
4. **Fix INC-4** — Add band allocation table + `vector_id` note to
   `ROLE_DEFINITIONS.md`. (30 min)
5. **Fix INC-5** — Single-source `FEDERATED_BASE58_ALPHABET` from `a2a-core`;
   update 4 consumers + add CI check. (60 min)
6. **Fix INC-6** — Update `getStats()` to use canonical `traits` field. (20 min)
7. **Fix INC-7** — Document `vector_id` vs `idNumber` in `ROLE_DEFINITIONS.md`.
   (15 min)
8. **Re-run verification gates** — Turn Zero, type-check, drizzle:check,
   validator round-trip. (30 min)

---

## 5. Memory / Lesson

**Durable lesson for memory:** "Vocabulary alignment requires checking THREE
layers: (1) schema/types, (2) static runtime surfaces (CLI, traits, ledger), (3)
emit-point validators. A change passing layer 1+2 but failing layer 3
(emit-point round-trip) is still inconsistent. Phase 9 caught exactly this:
bridge emitted `AGENT://TNFCORE/...` failing `normalizeCanonicalEntityId()`."

**Class-level skill update:** The `tnf-vocabulary-alignment-audit` skill's
`canonical-surfaces.md` should be refreshed with:

- Current AGENT_ROLE_TRAITS (7 values) vs DACC-v1 (5 values) divergence
- ROLE_DEFINITIONS.md missing band allocation section
- FEDERATED_BASE58_ALPHABET 5-way duplication
- AGENT_STATUS_LEDGER incomplete seeded agents

---

## 6. Self-Edit Gate

This audit touches `.agent/ROLE_DEFINITIONS.md` (agent-owned). Changes to it
must go through `scripts/protocols/agent-self-edit-gate.cjs`. Documentation-only
changes to `docs/protocols/AGENT_STATUS_LEDGER.md` and `docs/protocols/reports/`
do not require the gate.

---

## Appendix: Verification Gate Results (All PASS)

```
[turn-zero-authority] OK
[local-runtime-boundary] OK
@the-new-fuse/database type-check: OK
@the-new-fuse/database drizzle:check: OK (Everything's fine 🐶🔥)
@the-new-fuse/relay-core type-check: OK
@the-new-fuse/tnf-cli type-check: OK
@the-new-fuse/gemini-browser-skill type-check: OK

Validator round-trip:
  verified: TNF:AGENT:TNFCORE:TEST_X:001
  PASS
```

---

## 7. Gap Checks for Future Sweeps

The following gaps were identified during this audit and must be explicitly
swept in any future full vocabulary or alignment sweeps. They are implicitly
captured by INC-5 and INC-7, but warrant explicit verification against the
federated `ID#` routing logic and overall TNF protocols:

1. **Gap Area**: MCP server vocabulary
   - **Location**: `cli.ts:8921,8943,16953` (`mcp_server` vs `mcp-server`)
   - **Drift Risk**: Kind filter inconsistency
2. **Gap Area**: Capability enum vs broker usage
   - **Location**: `enums.ts:160-186` (26 values) vs `broker-agent.ts` lowercase
     strings
   - **Drift Risk**: Enum UPPERCASE vs broker lowercase
3. **Gap Area**: Agent status enum vs registry
   - **Location**: `enums.ts:148-158` (10 UPPERCASE) vs
     `normalizeAgentLifecycleStatus()`
   - **Drift Risk**: Registry expects lowercase
4. **Gap Area**: TnfIdentityCategory completeness
   - **Location**: `protocol-contracts/src/identity.ts` (11 categories)
   - **Drift Risk**: New categories added without audit
5. **Gap Area**: WorkerEnvelope shape
   - **Location**: `tnf-cli/src/services/WorkerEnvelope.ts` (`type: 'task'`,
     `version: '1.0'`)
   - **Drift Risk**: Version drift risk
6. **Gap Area**: Registry interface fields
   - **Location**: `relay-core/src/types.ts` (`operationalHandle`, `aliases`,
     `channels`)
   - **Drift Risk**: Undocumented in `ROLE_DEFINITIONS.md`
7. **Gap Area**: jsonb bag inventory
   - **Location**: `agents.ts` (10+ jsonb columns)
   - **Drift Risk**: New bags added without metadata policy review
8. **Gap Area**: mcid/lineage vocabulary
   - **Location**: `tnf-master-cumulative-id.schema.json`,
     `protocol-contracts/src/handoff.ts`
   - **Drift Risk**: Separate from federated IDs, often conflated
9. **Gap Area**: `FEDERATED_BASE58_ALPHABET` single source
   - **Location**: 5 files duplicate it
   - **Status**: **ADDRESSED** - Browser environments (Chrome extension,
     gemini-browser-skill, scripts/lib) cannot import from a2a-core due to
     Node.js dependency constraints. CI check script
     `scripts/ci/check-federated-alphabet.sh` enforces lock-step sync across all
     5 mirrors at build time.
10. **Gap Area**: `vector_id` vs `idNumber`
    - **Location**: Both use `ID#:` prefix; semantic difference undocumented
    - **Status**: **ADDRESSED** - Documented in `ROLE_DEFINITIONS.md` line 47
      with explicit disambiguation
11. **Gap Area**: Test Registry Sync
    - **Location**: test-sync.ts
    - **Drift Risk**: Minor validation drift risk
    - **Status (2026-08-13T14:45Z):** `test-sync.ts` not found in src/ — may be
      stale reference or only present in dist/. No source file in
      `packages/relay-core/src/` or `packages/database/src/`. Gap may be stale.

## 8. Gap-Area Re-Verification (2026-08-13T14:45Z)

Live codebase check of all 8 open gaps. Result: only GAP 1 has real drift;
others are defensive/normalizer-resolved or well-documented.

| Gap                         | Drift Risk | Status      | Notes                                                                                                                                                                                                                                                                                                                                                          |
| --------------------------- | ---------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GAP 1 (MCP server vocab)    | LOW        | NOT DRIFT   | `mcp_server` (cli.ts:8982/9004) is the marketplace catalog kind value (matches DB schema, frontend types, api marketplace.service — 50+ references). `mcp-server` (cli.ts:17014/17057) is the CLI subcommand arg name. Two distinct axes: kind enum value vs subcommand name. Normalizer at cli.ts:17019 maps `mcpserver` -> `mcp-server` for subcommand args. |
| GAP 2 (capability enum)     | LOW        | RESOLVED    | DB enum UPPERCASE (25 values, enums.ts:160-186). Broker uses traits, not enum. No drift.                                                                                                                                                                                                                                                                       |
| GAP 3 (status enum)         | LOW        | RESOLVED    | DB enum UPPERCASE (9 values). `normalizeAgentLifecycleStatus` (relay-core/contracts/lifecycle.ts) handles both cases via `AGENT_STATUS_ALIASES`. Runtime callers always lowercase.                                                                                                                                                                             |
| GAP 4 (IdentityCategory)    | LOW        | DOCUMENTED  | 11 values in `protocol-contracts/src/identity.ts:3-13`. Zod schema enforces enum. Surface 11 documents the axis.                                                                                                                                                                                                                                               |
| GAP 5 (WorkerEnvelope)      | LOW        | VERSIONED   | Hardcoded `type:'task'`, `version:'1.0'` (WorkerEnvelope.ts). Single version, no drift today.                                                                                                                                                                                                                                                                  |
| GAP 6 (Registry interface)  | LOW        | IN TYPES    | `operationalHandle`/`aliases`/`channels` defined in `relay-core/src/types.ts:6/8/13`. Not duplicated in ROLE_DEFINITIONS.md but types.ts is canonical.                                                                                                                                                                                                         |
| GAP 7 (jsonb bag inventory) | LOW        | INVENTORIED | 10+ jsonb columns in `agents.ts` with inline comments. Policy in ROLE_DEFINITIONS.md § Metadata policy.                                                                                                                                                                                                                                                        |
| GAP 8 (mcid/lineage vocab)  | LOW        | ISOLATED    | tnf/mcid/0.1 spec at `protocol-contracts/src/handoff.ts:30-45`. Separate namespace from federated IDs. Surface 11 documents.                                                                                                                                                                                                                                   |
| GAP 11 (test-sync.ts)       | LOW        | STALE       | `test-sync.ts` not present in src/. May be stale audit reference.                                                                                                                                                                                                                                                                                              |

**Conclusion:** No actionable gaps remain. All 8 gap areas are either
defensively normalized (GAP 2, 3), documented in canonical surfaces (GAP 4, 6,
7, 8), versioned (GAP 5), or are non-drift between distinct axes (GAP 1). GAP 11
(test-sync.ts) is a stale audit reference; no source file exists.
