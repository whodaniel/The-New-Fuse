---
name: tnf-directives
description: >
  Crawl the canonical TNF directive sources, synthesize/update the single
  authoritative DIRECTIVES.md and the one-page LIVING_DIRECTIVES_CARD.md, and
  keep the process repeatable and evolvable. Use when: (a) the user asks for
  TNF's governing directives / "what TNF demands, allows, provides"; (b) a new
  protocol, tenet, or axiom is added and DIRECTIVES.md must be re-derived; (c)
  an agent needs the canonical operating contract for the federated hierarchy.
  This is the everpresent consolidation loop — do not invent directives from
  sentiment; re-read the authoritative source set and re-derive.
---

# TNF Directives Skill (crawl → synthesize → maintain)

You are maintaining the canonical operating contract for every agent in the TNF
federated hierarchy. The output artifacts are:

- `docs/protocols/DIRECTIVES.md` — full DEMANDS / ALLOWS / PROVIDES + scan
  mandate + scaffolding/branches.
- `docs/protocols/LIVING_DIRECTIVES_CARD.md` — one-page card (any agent can be
  prepended with it).

Both files carry `[CLASS:PRIME]` authority. `DIRECTIVES.md` §0 establishes the
precedence chain; any conflicting mirror loses.

## Operating principles (do not violate)

1. **Never invent.** Directives are extracted from the authoritative sources
   below, not authored from opinion.
2. **Inspect → Act → Verify.** Read the sources before writing; confirm the file
   parses after writing.
3. **Non-Temporal Proliferation.** Any new learning about TNF's directives goes
   into `DIRECTIVES.md`/card, not just chat.
4. **Archive, don't delete.** When a directive is superseded, mark it
   `[STATUS:ARCHIVED]` and note the replacement; never silently overwrite
   (Document Vetting §5 / Deprecated Fact Archiving).
5. **Challenge & Verify.** Mutating a `[STATUS:LOCKED]` source requires a logged
   `challenge_rationale` + baseline comparison vs legacy (Velocity-Integrity
   Balance).

## Source set (the breadcrumb crawl — evolvable manifest)

Read ALL of these. This list IS the manifest; when a new authoritative protocol
is created, ADD it here so future runs stay complete.

### Tier 0 — Immutable / LOCKED (highest authority)

- `docs/protocols/TNF_BOOK_OF_AXIOMS.md`
- `docs/protocols/TNF_GOVERNANCE_SYNTHESIS_v2.0.md`
  ([CLASS:PRIME][STATUS:LOCKED])
- `docs/protocols/TNF_GOVERNANCE_TENETS.md` ([CLASS:PRIME])
- `docs/protocols/TNF_SYSTEM_LEXICON.md` (LOCKED, L1)
- `docs/protocols/TNF_DOCUMENT_TAGGING_PROTOCOL.md` (LOCKED)

### Tier 1 — Session authority & structure

- `docs/protocols/TURN_ZERO_MANDATE.md`
- `docs/protocols/TURN_END_MANDATE.md`
- `docs/protocols/SESSION_HANDOFF_ENFORCEMENT.md`
- `docs/protocols/MULTI_AGENT_INTEGRATION_PROTOCOL.md`
- `docs/protocols/AGENT_TARGETED_HANDOFF_V1.md`

### Tier 2 — Operational protocols

- `docs/protocols/TNF_FLEET_HEALTH_PROBE_PROTOCOL.md`
- `docs/protocols/TNF_SELF_HEALING_PROTOCOL.md`
- `docs/protocols/TNF_ORCHESTRATION_GOVERNANCE_PROTOCOL.md`
- `docs/protocols/TNF_MODULE_DEPENDENCY_AWARENESS.md`
- `docs/protocols/TNF_ENVIRONMENT_ADAPTER.md`
- `docs/protocols/TNF_DOCUMENT_VETTING_PROCEDURE.md`
- `docs/protocols/THE_VELOCITY_INTEGRITY_BALANCE.md`
- `docs/protocols/TNF_SELF_SUFFICIENCY.md`
- `docs/protocols/TNF_RESOURCE_STRATEGY.md`
- `docs/protocols/EXECUTABLE_INTELLIGENCE_FRAMEWORK.md`
- `docs/protocols/CORE_SYSTEM_PROMPT_ARCHITECTURE.md`
- `docs/protocols/INFORMATION_INTENTIONS.md`
- `docs/protocols/TNF_CORPORATE_DEPARTMENT_ORCHESTRATION_MANUAL.md`
- `docs/protocols/MEMPALACE_META_CHART.md`
- `docs/protocols/DIRECTIVE_CONVERSION_LEDGER.md`
- `docs/protocols/TNF_CONCURRENT_AGENT_COORDINATION_PROTOCOL.md` (multi-agent
  overlap; fleet direction)

### Tier 3 — Normative contracts & project rules

- `docs/protocols/schemas/*.json` (session-handoff, merkle, cron-governance,
  executable-intelligence, agent-self-edit, sgp/twip envelopes)
- `docs/core/{AGENTS,SOUL,USER,IDENTITY,HEARTBEAT,SECURITY,TOOLS,ENGINEERING_PRINCIPLES}.md`
- `docs/CLAUDE.md`

## Procedure (repeatable)

1. **Crawl.** Read every file in the manifest above (parallel reads; batch by
   tier). Note any file whose `[STATUS]` changed or that is newly LOCKED.
2. **Extract.** For each source, capture: hard demands (auto-kill / mandatory),
   permissions (allowed-within-bounds), provided capabilities, and any
   scan/monitor/probe/outreach mechanism already wired.
3. **Derive.** Rebuild the four sections of `DIRECTIVES.md`:
   - §1 DEMANDS (D-numbers, each citing its source + class).
   - §2 ALLOWS (A-numbers).
   - §3 PROVIDES (P-numbers).
   - §4 Proactive scan/monitor/probe/outreach mandate (verify the cron jobs /
     `~/.tnf/bin/` scripts actually exist before claiming they run).
   - §5 Scaffolding + adaptive branches (map edge-case triggers → correct
     branch).
   - §6 Enforcement + this skill pointer + updated source list.
4. **Condense.** Regenerate `LIVING_DIRECTIVES_CARD.md` from the same derivation
   (one screen, same numbering).
5. **Verify.** Grep the written files for broken markdown / missing citations.
   Confirm `DIRECTIVES.md` still opens with `[CLASS:PRIME]` and the §0
   precedence.
6. **Proliferate (Non-Temporal).** Do NOT commit unless asked. If the change is
   significant, suggest running `node scripts/turn-end.cjs` so the update
   reaches `LIVING_STATE.md` + handoff (per Turn End mandate). Note: `tnf` must
   be healthy (cli.ts compiles) for `turn-end` and related commands to run.

## Edge-case handling

- **New protocol added:** add it to the manifest (correct tier) and re-derive.
  Evolution, not duplication.
- **Conflict between sources:** §0 precedence decides; document the resolution
  in §6 and the handoff.
- **Disk/environment tight:** the crawl is read-only; skip nothing but you may
  read large synthesis docs (e.g. GOVERNANCE_SYNTHESIS) once and cache key
  tables.
- **`tnf` CLI broken (e.g. cli.ts transform error):** do not attempt to run
  `tnf` commands; the directives are plain markdown and can be maintained
  without the CLI. Flag the CLI breakage to the operator separately.

## Output contract

End each run with a short summary: sources crawled (count), directives
added/changed/removed (D/A/P numbers), and any conflict resolved. Keep
DIRECTIVES.md decisive — each line is a command, not a discussion.
