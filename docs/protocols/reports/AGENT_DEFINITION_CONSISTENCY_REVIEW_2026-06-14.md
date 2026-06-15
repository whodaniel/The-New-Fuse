# Agent Definition Consistency Review — 2026-06-14

Verdict: **NOT FULLY CONSISTENT.** Phase 1–7 added DB-grade rigor and made the
broker fulfillment-aware, but the resulting taxonomy overlaps and partially
conflicts with the canonical runtime vocabulary. Three vocabularies exist in
parallel; my work added a fourth.

Companion:
`docs/protocols/reports/AGENT_DEFINITION_CONSISTENCY_REVIEW_2026-06-14.json`
Operator session: `agent:local-subdirector:session:2026-06-12T03:17:10.901505Z`

---

## 1. The five overlapping surfaces I found

| #   | Surface                        | Source                                                 | Vocabulary                                                                                                                                             |
| --- | ------------------------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | DACC-v1 Role Hierarchy         | `.agent/ROLE_DEFINITIONS.md`                           | `DIRECTOR` · `ORCHESTRATOR` · `BROKER` · `AGENT` (worker, signs messages `AGENT-XX`)                                                                   |
| 2   | Runtime Traits (canonical CLI) | `packages/tnf-cli/src/cli.ts:2958-2967`                | `AGENT_ROLE_TRAITS` = `orchestrator, broker, worker, participant`; `AGENT_PLATFORM_TRAITS` = `antigravity, gemini, claude, jules, pi, vscode, browser` |
| 3   | Agent Bank Targets             | `scripts/agents/reconcile-agent-banks.cjs:293-306`     | `codex, claude, gemini, opencode, kilo, augment, tnf, hermes, project, all`                                                                            |
| 4   | Legacy DB Enum                 | `packages/database/src/drizzle/schema/enums.ts:25-141` | 110+ value flat enum mixing role+platform+product                                                                                                      |
| 5   | My Phase 1–7 work              | this audit                                             | `role` (60 enum) · `fulfillment` (jsonb) · `qualities` (jsonb)                                                                                         |

The runtime CLI defaults (`tnf register`) use surface 2, not surface 4. The DB
seeder I built writes to surface 4. They are not the same vocabulary.

---

## 2. Specific inconsistencies

### INC-1 — `role` is overloaded across four vocabularies

- DACC: `orchestrator = master-clock baton holder` (foundation of orchestration
  hierarchy)
- AGENT_ROLE_TRAITS: `orchestrator, broker, worker, participant` (a CLI default)
- agentTypeEnum (DB legacy): `ORCHESTRATOR, BROKER, MONITOR, ROUTER, …` (110
  values)
- My AgentRole enum: `code_generation, orchestrator, cli_coder, …` (60 values)

An agent registered with `role='orchestrator'` (mine) means "a worker that
coordinates", whereas the same string in DACC means "the master-clock baton
holder". The CLI default `worker` and DACC `AGENT` overlap, and so do `BROKER`
shapes.

**Fix sketch:** add a new column `dacc_role` enum with
`'director','orchestrator','broker','worker','participant'`, and rename my new
column to `worker_action` (worker-side orthogonal axis).

### INC-2 — `platform` is split across two vocabularies

- AGENT_PLATFORM_TRAITS (cli.ts:2959):
  `antigravity, gemini, claude, jules, pi, vscode, browser` (7 values)
- Bank targets (cli.ts:9818):
  `codex, claude, gemini, opencode, kilo, augment, tnf, hermes, project` (9
  values)
- My fulfillment.vendor: free-form string (anything goes)

`kilo` and `opencode` are recognized at the **bank-target** layer but **not** at
the runtime `tnf register <platform>` layer. My Phase-4 fix added enum values
inside the legacy `agentTypeEnum` (so they survive DB persistence) but did not
expose them via `tnf register`. A user running
`tnf register myagent worker kilo` still gets rejected or silently defaults to
`vscode`.

**Fix sketch:** compile a single merged `PLATFORM_TAXONOMY` from the union of
AGENT_PLATFORM_TRAITS + bank-targets; route both layers through it.

### INC-3 — `traits` is the canonical term, I silently replaced it

TNF runs `tnf traits list` and uses `AGENT_*_TRAITS` arrays. My new field is
called `qualities` — different name, partially overlapping concept
(observability_level/subAgent_capable/etc.). Two names for the same idea in the
same codebase is a regression.

**Fix:** rename `qualities` → `traits`. Reuse the term that the CLI + docs
already use.

### INC-4 — `metadata` is a reserved-but-unstructured bag I bypassed

Lots of places already have `metadata: jsonb`:

- `agents.metadata` (jsonb on the agents table — exists pre-audit)
- `agents_metadata` (separate 1:1 table, has its own `metadata` jsonb)
- `agents.config` (jsonb)
- `agents.profile` (jsonb)
- `users.preferences` (jsonb)
- `agent_tracking.metadata`, `agent_sessions.metadata`,
  agent_request_log.metadata
- The `MasterAgentProfile.metadata` shape already includes
  `version, personalityTraits, communicationStyle, expertiseAreas, specializations, limitations, notes, owner, department, project`

I added `fulfillment` and `qualities` as new top-level jsonb columns instead of
nesting them inside an existing `metadata` field. There's a real argument either
way (top-level columns = better indexing; nesting = fewer columns), but the
choice was made implicitly without consulting existing convention.

**Fix:** state the policy explicitly in the audit doc + add a written rule in
`.agent/ROLE_DEFINITIONS.md` about when to use a top-level jsonb column vs
nesting into `metadata`.

### INC-5 — Seeder writes to DB but not to AGENT_STATUS_LEDGER.md

The `tnf agents bank reconcile` flow (and a half-dozen other surfaces) treats
the `AGENT_STATUS_LEDGER.md` as a canonical human-readable record of "what is
running right now". My seeder doesn't append to it. After
`pnpm ... seed-agent-registry`, the new entries (kilo-cli, opencode-cli,
tnf-hermes) are in Postgres but not visible to the existing ledger view
operators actually read.

**Fix:** either (a) auto-append seeded entries to AGENT_STATUS_LEDGER.md, or (b)
better, replace the manual ledger with `tnf agents list --standing-by` that
derives from the registry.

### INC-6 — `fulfillment` is a new term, possibly already exists elsewhere

I introduced `fulfillment` for
`{vendor, model, transport, protocol_version, prompt_doc_uri, tools, endpoint, raw}`.
The same concept appears in other parts of TNF docs under different names —
`runtime`, `engine`, `binder`, `execution-stack`, `driver`. I did not audit
`MULTI_AGENT_INTEGRATION_PROTOCOL.md`, TWIP docs, or the recent
SOUL/system-prompt work.

**Fix:** grep these documents in Phase 8 and either (a) confirm `fulfillment` is
the cleanest name, or (b) replace it with the term already in use.

---

## 3. Where my Phase 1–7 work landed correctly

- **Phase 1 (DB migration):** legitimate. Adds role/fulfillment/qualities as new
  additive jsonb. ddl is forward-compatible.
- **Phase 2 (in-memory registry):** legitimate. `infoRecord` preservation is
  defensive and unblocks schema evolution.
- **Phase 3 (broker fulfillment hints):** legitimate. Reads optional hints from
  itinerary, never fails the dispatch path.
- **Phase 6/7 (`tnf agents classify`):** legitimate. 291 persona `.md` files now
  have a typed snapshot.
- All Turn Zero / runtime gates still pass.

The work is NOT wrong. It is just NOT aligned with the existing vocabularies,
and announcing "consistent" without telling you about the drift would have
violated the Velocity-Integrity mandate.

---

## 4. Recommended next move

**Run Phase 8: a consistency-alignment pass.** Concretely:

1. Rename `qualities` → `traits` everywhere (DB + Drizzle type +
   `agents-classify.ts` + seeder + LIVING_STATE).
2. Add new `dacc_role` enum column on `agents` with values
   `('director','orchestrator','broker','worker','participant')`. Keep my `role`
   column but rename to `worker_action` in TypeScript and Drizzle.
3. Compile single merged `PLATFORM_TAXONOMY` from union of
   AGENT_PLATFORM_TRAITS + bank-targets; route both `tnf register` defaults and
   `tnf agents bank reconcile --targets` through it.
4. Wire `tnf traits list` to derive from the registry (DB or snapshot) instead
   of being a hand-curated JS array in `cli.ts`. This guards against future
   drift.
5. Append a STANDING-BY entry to AGENT_STATUS_LEDGER.md whenever a seeder adds a
   new SYSTEM-side entry.
6. Decision on metadata-vs-top-level: write the policy in
   `.agent/ROLE_DEFINITIONS.md` §3 ("Agent Definition Vocabulary").
7. Re-run Turn Zero gates and overflow to a new LIVING_STATE step 38.

Estimated cost: 4–6 hours of careful patches. Lower than letting the divergence
become foundational and rotating it out later.

---

## 5. Memory write

Saving the lesson so I don't repeat it next audit.

Invariant for next time:

- **Before claiming consistency in any TNF protocol audit, grep for the
  term-of-art first.** Canonical terms to check for in any agent-related audit:
  `traits`, `role`, `platform`, `metadata`, `qualities`, `fulfillment`,
  `identity`, `persona`. If you're introducing a new term for an old concept,
  the audit is incomplete.
- The runtime "trait" vocabulary lives in
  `packages/tnf-cli/src/cli.ts:2958-2967` and is the de-facto contract surfaced
  by `tnf register` and `tnf traits list`.
- Tooling surfaces that already enumerate "what counts as an agent target":
  `tnf agents bank reconcile --targets`, the `Augment`/`Hermes` import paths,
  `dacc-v1` ROLE_DEFINITIONS.

NOT saving the audit JSON itself (it's a session artifact; canonical copy is in
`docs/protocols/reports/`).
