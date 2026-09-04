`[CLASS:INTEL] [STATUS:PENDING]`

# Turn Zero V2 — Procedural Pathway Reconciliation (2026-09-03)

Read-only trace of every procedural pathway that starts at Turn Zero V2, checked
against the code that actually runs, from first principles. Nothing was
modified. Every claim below cites the file that proves it. Repo state at trace
time: `whodaniel/tnf-monorepo` @ `docs/gate-crash-is-not-permission:d6a55017f`,
working tree dirty (a concurrent `tnf tui` LONG_RUN session was live).

## 0. First principles the doctrine already states

The protocol stack is internally coherent about what it wants. Four axioms,
each already written down:

| # | Axiom | Source |
| - | ----- | ------ |
| A1 | Establish *just enough* verified authority/context/classification/capability to take the **next safe action**; mutation readiness is gated separately from responsiveness. | `TURN_ZERO_MANDATE.md` Purpose, Operator-facing principle |
| A2 | **Receipts, not memory.** Existence is not position; a stale receipt means *unknown*, not broken. | `STATE_FRESHNESS_MANDATE.md` R1, R3 |
| A3 | A tool call returning success is a receipt for the **call**, not proof the intended outcome exists. **Inspect → Act → Verify.** | `TURN_ZERO_MANDATE.md` §Inspect→Act→Verify; `.agent/SYSTEM_PROMPT.md` Operating Discipline |
| A4 | **Authority comes from verified identity, never from a wire claim.** Classification is not authorization. The only authorization registry is `~/.tnf/authority/roles.json`. | `DIRECTIVES.md` D23 |

Plus one structural rule: **one authority per fact** — "Harnesses … MUST NOT
maintain an independently authoritative competing Stage A list"
(`FRONTLOAD_MANIFEST.md`), and the do-not-reinvent gate (`SYSTEM_PROMPT.md`).

Everything that is wrong below is a place where an implementation violates one
of A1–A4 or the one-authority rule. Nothing below requires new doctrine.

---

## 1. Pathway map — what actually runs

```
[hook / operator]  pnpm run tnf:onboard
   └─ scripts/tnf-onboard-twip.cjs
        ├─ turn-zero-v2-gate.cjs  (manifest Stage A hydrate → repo receipt →
        │      classification from ENV → orientation from SESSION_HANDOFF_LATEST.json
        │      + LIVING_STATE directive → task routes → freshness --frontload → receipt)
        ├─ verify-repo-frontload.cjs
        ├─ verify-onboarding-routes.cjs
        ├─ provision-injection-surfaces.cjs --verify
        └─ tnf-discover-active.cjs                       ← conformant V2 path ✅

[tnf boot]  packages/tnf-cli/src/boot/pipeline.ts
   ├─ 'turn-zero-onboard'   → skipped by default; --force runs LEGACY scripts/tnf-onboard.cjs
   ├─ 'handoff-matrix'      → turn-end.cjs --no-stage
   │                          → enforce-session-handoff.cjs --mode=ci   (diff = HEAD~1..HEAD)
   │                          → on fail: emit-session-handoff.cjs  TNF_HANDOFF_AUTO_VERIFY=1
   │                             → prints "generated and validated"   (uncommitted, pipeline.ts:329-343)
   └─ … factory / fleet / tui attach

[tnf tui]  cli.ts   (default mode LONG_RUN = full autonomous, 12/12 tools incl. write_file)
   ├─ ProtocolInterceptor / TurnZeroService preflight  (own hard-coded file lists)
   ├─ every 5 min: contextRefreshPending → buildAutonomousContinuePrompt()
   │      ├─ readHandoffNextActions()  ← raw JSON.parse of SESSION_HANDOFF_LATEST.json, unvalidated
   │      └─ handoffTaskIndex++ per turn regardless of outcome
   └─ runAutonomousVerifyGates() = check-agent-registration + LIVING_STATE synchronized
                                   (never checks the action's result or the handoff's validity)

[commit] .husky/pre-commit  → handoff:gate:staged (BLOCKS)  ✅
[push]   .husky/pre-push    → handoff:pre-push --advisory (declared non-blocking) ⚠
[CI]     billing-blocked since ≤2026-08-22 → "strict governance executes in CI" is currently false
```

---

## 2. Findings, ranked by how much they break the axioms

### F1 — The canonical continuation artifact has ≥4 writers, one unconstrained *(violates one-authority, A3)*

Writers of `docs/protocols/reports/SESSION_HANDOFF_LATEST.json`:

1. `scripts/turn-end-v2.cjs` (the mandated one, `TURN_END_MANDATE.md`)
2. `scripts/turn-end.cjs` (legacy; called **directly** by boot, `pipeline.ts:321`)
3. `scripts/protocols/emit-session-handoff.cjs` (boot auto-recovery, `handoff:emit`)
4. `packages/tnf-cli/src/orchestration/SessionHandoffService.ts`
5. **The TUI model, via the `write_file` tool, with no path guard** (`llm-client.ts:26`)

Evidence of #5: the working-tree file at trace time is a 38-line free-form
object (`session_id`, `status`, `summary`, `artifacts.deployment_url`,
`metadata.deployed_by: "tnf interactive agent"`) that no script in the repo
produces. It fails schema validation on 14 missing required properties and 6
`additionalProperties` violations (`enforce-session-handoff.cjs --mode=ci`
output at trace time). The HEAD version (`fe6ae3f4…`) is schema-valid.

Consequence: the autonomous loop's **task source** is a file the loop's own
model may overwrite freely and never validates before consuming
(`cli.ts:20686 readHandoffNextActions`). Inspect → Act → Verify is violated at
the root: the loop acts on an artifact it never inspects.

### F2 — Default handoff content is self-referential, producing an autonomous fixed point *(violates A1)*

`emit-session-handoff.cjs:424-434` and `turn-end.cjs:652-653` default to:

- `next_actions`: "Continue priority queue from … continuation.resume_checklist"
- `resume_checklist`: "Validate SESSION_HANDOFF_LATEST.json against … schema"

So a procedurally emitted handoff tells the next agent that its work is to
validate the handoff. That is exactly the loop observed in the transcript: read
handoff → try `ajv` → wrong Ajv class (`new Ajv` vs the gate's
`ajv/dist/2020`, `enforce-session-handoff.cjs:6`) → `maxIterations (7)` → 5-min
refresh → repeat. The loop's "next work unit" is a tautology generated by
defaults, not a task.

### F3 — Boot auto-recovery mints receipts about no work and calls them validated *(violates A2, A3)*

`pipeline.ts:329-343` (uncommitted): when the ci-mode gate fails, boot runs
`emit-session-handoff.cjs` with `TNF_HANDOFF_SUMMARY='Procedural auto-recovery
during boot'`. Facts about the resulting artifact (`8b3715f7…`, 14:15Z today):

- `work_summary` = the literal string "Procedural auto-recovery during boot";
- `changed_paths` = the **union** of staged + unpushed + dirty + HEAD~1 paths
  (`gatherChangedPaths`, `emit-session-handoff.cjs:176-200`) — ~45 paths of
  *other sessions'* in-flight work, claimed under a summary describing none of it;
- `continuation.targets` = emit defaults `['story-architect','librarian']`,
  `owner` = default;
- a ledger row is appended with the actor **hard-coded** as `Orchestrator`
  (`emit-session-handoff.cjs:251`) — the ledger now records, as an Orchestrator
  publication, a receipt nobody authored;
- `TNF_HANDOFF_AUTO_VERIFY` runs privacy/secret/PII/RLS checks
  (`emit-session-handoff.cjs:116-172`) and **never** the schema check; the
  schema gate that just failed is not re-run after emission. "generated and
  validated" therefore asserts something that was not measured.

Also: the ci-mode gate at boot diffs `HEAD~1..HEAD` — it asks whether the
*previous committer* included handoff artifacts. A boot cannot cure that; it can
only report it. `~/.tnf/handoff-current.json` and the `tnf-status` banner then
broadcast "STATE: Procedural auto-recovery during boot" as if it were mission
state.

Ledger integrity side-effect: `AGENT_STATUS_LEDGER.md:1779` records handoff
`9a914cc7…` — an id that exists in no artifact on disk or in git. Three boots
today (LIVING_STATE auto-entries at 05:54, 07:26, 14:15) each re-emitted and
overwrote; the ledger keeps the orphans.

### F4 — The classification axis is unpassable end-to-end (enum contradiction) *(violates A1)*

| Surface | Accepted `work_domain` values |
| ------- | ----------------------------- |
| `TURN_ZERO_MANDATE.md` Axis 1 | `core` / `agency` / `personal` |
| `tnf-session-handoff.schema.json:75` | `core` / `agency` / `personal` / `unknown` |
| `turn-zero-v2-gate.cjs:78` (`VALID.domain`) | **`corporate`** / `agency` / `personal` / `unknown` |
| `FRONTLOAD_MANIFEST.md:263` (worked example) | **`TNF_WORK_DOMAIN=corporate`** |

`turn-end-v2.cjs upgrade()` copies the env value into the handoff. A session
that sets `core` (per mandate) is refused write-readiness ("invalid work
domain"); a session that sets `corporate` (per gate/manifest) emits a
schema-invalid handoff and fails the commit gate. Write-ready and schema-valid
are mutually exclusive.

### F5 — Write-readiness has zero call sites on the mutation path *(violates A1)*

`--require-write-ready` exists (`turn-zero-v2-gate.cjs:238-241`) and is
documented as the precondition for mutation. Nothing in `tnf boot`, `tnf tui`,
or the autonomous loop invokes it or reads the receipt. The TUI defaults to
`LONG_RUN` (`cli.ts:20643`) — autonomous shell + `write_file` on the shared
checkout — with classification `unknown/unknown/unknown/unknown` and
`writeReady: false` in the receipt it never consults. The gate is real and
inert (the "Enforcement is inert, not missing" pattern).

### F6 — TNF's own CLI runs a competing, pre-V2 Turn Zero *(violates one-authority)*

- `TurnZeroService.ts:44-62` hard-codes `REQUIRED_STATE_FILES`,
  `FRONTLOAD_FILES` (incl. `.agent/context/resource-map.md`), `HANDOFF_FILES`,
  `codebase_map.json`, `KNOWLEDGE_TREE.json`; `ProtocolInterceptor.ts:61-66`
  hard-codes another list. `FRONTLOAD_MANIFEST.md` forbids exactly this, and
  `TURN_ZERO_MANDATE.md` says `codebase_map.json` is not Turn Zero authority.
- `pipeline.ts:169-189`: `--force-onboard` runs `scripts/tnf-onboard.cjs`,
  which `CLAUDE.md` says is legacy diagnostics only.

The hook path (Claude SessionStart) is V2-conformant; TNF's own runtime is not.

### F7 — State freshness is never refreshed by any pathway *(violates A2)*

No script, hook, or boot step calls `state-freshness-gate.cjs --refresh`
(grep: only the gate's own help text). Receipts were last written
2026-09-02T01:01Z; every domain TTL ≤ 3600 s. Every session since has started
10/10 stale, and the "RULE: re-probe before you state it" is enforced only by
model discipline. Four domains are local and sub-second
(`git.repository.identity`, `runtime.services`, `tnf.product-repo-map`,
`tnf.oss-app-boundary`) and could be refreshed by the onboarder for free.

### F8 — The autonomous VERIFY step verifies the fleet, not the action *(violates A3)*

`runAutonomousVerifyGates()` (`cli.ts:8536`) = `check-agent-registration.cjs`
+ `LIVING_STATE [STATUS:SYNCHRONIZED]`. It prints "✓ Autonomous verify gates
passed" on a turn that hit `maxIterations` with no final message, left the
handoff schema-invalid, and advanced `handoffTaskIndex` anyway
(`cli.ts:21866-21869`). The step named VERIFY measures nothing about the ACT.

### F9 — Five role surfaces; the authoritative one says the TUI is a `worker` *(A4)*

| Surface | What it says about the CLI/TUI agent | Authority? |
| ------- | ------------------------------------ | ---------- |
| `.agent/agents/tnf-cli.md` frontmatter | `dacc_role: director` | No — derived by filename substring (`agents-classify.ts`, per D23) |
| `data/agent-registry/agents.json` | `role: null`; sub-/super-director/orchestrator entries have empty descriptions and `capabilities: [""]` | No — classification catalog |
| Redis `tnf:agent-registry` | `tnf-cli-agent → role: "orchestrator"` (self-registered 14:15Z) | No — wire claim (D23) |
| `.agent/ROLE_DEFINITIONS.md` | "director — Full fleet authority, role mutation rights … Agents: tnf-cli"; cites `.tnf/authority/roles.json` | No — and the cited path does not exist |
| `~/.tnf/authority/roles.json` | **exactly one grant:** `tnf-local-subdirector → sub-director` (2026-08-08). `tnf-cli-agent` resolves to default `worker` (`tnf-identity.cjs:201-232`) | **Yes** (D23) |

So the most privileged process in practice (autonomous, writes canonical
protocol artifacts, edited `pipeline.ts`) is the least credentialed in the only
registry that authorizes anything. `ROLE_DEFINITIONS.md` contradicts D23
outright.

The transcript claims evaluated against this:

- *"tnf cli agent … logically is the Super Admin (Orchestrator) surface … should
  subsume the Orchestrator and Broker roles … a single, omnipotent control
  plane."* — Rests on the filename-derived classification and the agent's own
  bus self-registration. D23: "an agent's own narration is a claim, not a
  credential"; "holding sub-director/super-director conveys the right to
  *request* elevation — never standing elevated access." The Orchestrator's
  enumerated powers (`TNF_GOVERNANCE_SYNTHESIS_v2.0.md` §4: AGENT-INIT, kill
  switch, governance constants, retire agents) exist as a check *on* runtime
  processes; merging them into the process being checked removes the check.
  Locality ("runs on the primary terminal") is not authority. **Reject.**
- *"L2 global Director seat is empty."* — L1/L2/L3 appears in no protocol
  document (grep across `docs/protocols`); it was coined in-conversation. The
  observation was a bus-registry snapshot; `DIRECTOR-1788441935350` re-registered
  at 13:25Z. Moot.
- *"Draft fleet-coordinator / state-governor / autonomy-governor /
  slotmanager-agent."* — All four exist in `~/.claude/agents/`, in
  `data/agent-registry/agents.json`, and in a conflict log dated 2026-08-31.
  The do-not-reinvent gate was not run.

The legitimate kernel in the transcripts: the **classification** axis is a
mess (`orchestrator`, `orchestrator-agent`, `orchestrator-agent-copy`,
`LLM-Orchestrator` ×N cron re-registrations; `DIRECTOR-*` vs
`tnf-local-subdirector` vs `sub-director` vs `super-director`; three definition
surfaces `.agent/agents`, repo `.claude/agents`, `~/.claude/agents` whose
"exact mirror" rule has already diverged). That is a relabel/dedupe on the
classification axis — not an authority merge.

### F10 — Directive lifecycle has SET but no COMPLETE

`LivingStateService.updateDirective()` (`:172-197`) only replaces the slot.
`LIVING_STATE` still reads "Deploy frontend to Cloudflare Pages" (set 2026-09-02)
after the 14:45Z handoff declared it `status: completed` (the URL does return
200 — independently probed at trace time). `buildAutonomousContinuePrompt()`
falls back to the directive when `next_actions` is empty
(`cli.ts:20720-20730`) → re-execution risk on the next empty handoff.

### F11 — Concurrency: three sessions, three boots, one shared checkout

`TNF_AGENT_WORKSPACE_ISOLATION_PROTOCOL.md` R1–R4 are advisory
(`resolve-workspace-tier.cjs` is "called manually, not yet auto-invoked by the
onboarder", its own §5 table). Today: pi committed `d6a55017f` to repair a
collision caused by the TUI session's mid-flight `cli.ts` wiring; the TUI then
overwrote `SESSION_HANDOFF_LATEST.json` and left `pipeline.ts` dirty while pi's
per-agent receipt sits untracked. No path lease existed for any of it.

### F12 — Small, mechanical

- `scripts/runtime/launch-agent-wrapper.sh:108` — `"${wrap_extra[@]}"` on an
  empty array under macOS bash 3.2 + `set -u` → "unbound variable"; the
  pi-redis-wrapper launcher dies before tmux wrap. Fix:
  `${wrap_extra[@]+"${wrap_extra[@]}"}`.
- `~/.tnf/authority/keys` holds 7,438 entries and `audit.jsonl` is 30 MB —
  `TNF_UNBOUNDED_GROWTH_AUDIT` shape.
- Legacy `turn-end.cjs` and `turn-end-v2.cjs` are both entrypoints; boot calls
  the legacy one (`pipeline.ts:321`) though the mandate names v2.

---

## 3. Reconciled procedural model (no new doctrine — just the existing one, wired)

| Stage | What runs today | What the axioms require |
| ----- | --------------- | ----------------------- |
| RESPOND | ✅ | unchanged |
| ORIENT | onboarder (hook) ✅ / CLI preflight ✗ (F6) | one Turn Zero implementation: CLI calls `turn-zero-v2-gate.cjs` / `hydrateStage`; onboarder refreshes the four local freshness domains (F7); receipt includes the agent's **authority role from `roles.json`** (F9) |
| CLASSIFY | env-only, enum-broken, never consulted (F4, F5) | fix enum to `core`; autonomous/LONG_RUN write requires a current `--require-write-ready` receipt |
| HYDRATE | ✅ task-scoped | unchanged |
| STAFF | discovery ✅; do-not-reinvent not run (F9) | staffing/definition proposals must query definitions ∪ registry ∪ bus before proposing |
| ACT | unguarded `write_file` on canonical paths (F1); no path lease (F11) | protect `docs/protocols/**`, `AGENT_STATUS_LEDGER.md`, `LIVING_STATE.md` from model free-form writes; autonomous mode declares a path lease |
| VERIFY | fleet health, not outcome (F8) | verify the action: exit codes, artifact existence, **schema-validate any protocol artifact written this turn**; `maxIterations` without a final message = FAIL, not "passed" |
| PROPAGATE | — | unchanged |
| HANDOFF | 5 writers, self-referential defaults, auto-mint at boot (F1–F3) | **one writer** (`turn-end-v2`/`emit`) that validates before writing; empty defaults (no continuation ≠ "continue the queue"); boot **reports** a failed gate and holds — it does not mint; ledger rows name the emitting actor id, never a hard-coded "Orchestrator"; directive gets a COMPLETE transition (F10) |

---

## 4. Refinement order (most provably effective first)

Each item is small and independently testable; together they close F1–F11
without adding a surface.

1. **Single handoff writer + validate-on-write.** Route `turn-end.cjs`,
   `SessionHandoffService`, and boot through `emit`/`turn-end-v2`; run
   `enforce-session-handoff.cjs` against the *file just written* and refuse to
   leave an invalid file on disk. Deny `write_file` to the canonical protocol
   paths in `llm-client.ts`. *(closes F1, most of F3)*
2. **Empty defaults.** `emit`/`turn-end` default `next_actions`/`resume_checklist`
   to explicit "none"; the TUI treats "none" as HOLD with an operator notice,
   not as work. *(closes F2)*
3. **Boot reports, never mints.** Revert `pipeline.ts:329-343` to the committed
   behaviour (warn + `pnpm run validate:session-handoff`), and change the boot
   gate mode from `ci` to a working-tree check. *(closes F3)*
4. **Enum fix:** `VALID.domain` → `core`; manifest example → `core`. *(F4)*
5. **Wire write-readiness:** LONG_RUN/AUTONOMOUS refuses to start (or runs
   read-only) without a fresh `turn-zero-stage-a.latest.json` with
   `writeReady: true`. *(F5)*
6. **One Turn Zero:** `TurnZeroService` delegates to `hydrateStage()`; delete
   its private lists; boot's `--force-onboard` runs `tnf-onboard-twip.cjs`. *(F6)*
7. **Refresh local freshness in the onboarder.** *(F7)*
8. **Verify the act.** Replace the two fleet checks with per-turn outcome checks
   + schema check of any protocol artifact touched; `maxIterations` = FAIL. *(F8)*
9. **Authority truth:** rewrite `.agent/ROLE_DEFINITIONS.md` to cite D23 and
   `~/.tnf/authority/roles.json`; operator decides whether `tnf-cli-agent` is
   granted `sub-director` (via `tnf authority review`) or stays `worker` — and
   record the consolidation proposal as **rejected** in
   `CHALLENGE_RATIONALE_LOG.md` so fresh sessions stop re-proposing it. *(F9)*
10. **Classification dedupe** of the orchestrator/director name family across
    `.agent/agents`, `.claude/agents`, `~/.claude/agents`, registry JSON, and
    bus registration — relabel, do not promote. *(F9 kernel)*
11. **Directive COMPLETE transition** in `LivingStateService` keyed on handoff
    `status`. *(F10)*
12. **Path lease for autonomous mode** via `resolve-workspace-tier.cjs`
    auto-invoked by the onboarder (its own §5 says this gap is load-bearing). *(F11)*
13. Mechanical: wrapper array guard; authority key/audit rotation. *(F12)*

## 5. What is *not* wrong

- `TURN_ZERO_MANDATE.md` V2, `FRONTLOAD_MANIFEST.md`, `STATE_FRESHNESS_MANDATE.md`,
  `TURN_END_MANDATE.md`, and D23 are consistent with each other and with the
  axioms. The doctrine does not need a rewrite.
- The hook-driven `tnf:onboard` path is conformant and hash-receipted.
- The pre-commit `handoff:gate:staged` genuinely blocks.
- `emit-session-handoff.cjs --auto-verify` is not fabricating: it runs four
  real guards and throws on failure. Its defect is scope (no schema check) and
  the word "validated" in the caller's log line.
- The Cloudflare deployment claim in the 14:45Z handoff was independently
  probed: `https://production.thenewfuse-main.pages.dev/` → HTTP 200.

## 6. One-line synthesis

The doctrine is right; every failure traced today is a second, third, or fifth
implementation of a fact the doctrine assigns to one authority — and each
proposal in the transcripts (merge roles into the CLI, draft four more agent
definitions, auto-mint handoffs at boot) would add another. The provably
effective refinement is subtraction: one writer per canonical fact, validate on
write, and gate autonomous mutation on the receipts Turn Zero already produces.

---

# Part II — Reconciliation against the evolved corpus (2026-09-03, later session)

Part I traced pathways against four axioms. Part II tests Part I's conclusions
against TNF's own foundational record — the axioms, lexicon, vetting gates,
directives and their git history — to establish whether each proposed
refinement restores the evolved state or overrides it. Three of Part I's
findings changed. One was retracted. One new defect was observed live.

## 7. `corporate` was purged by operator directive; the gate never heard

Commit `7fd41cc3c` (2026-08-30 15:18, "refactor(semantics): purge corporate
metaphor and enforce compliance log for locked lexicon") rewrote 25 files,
renamed `TNF_STAFF_MASTER_CALENDAR_AND_SCHEDULE.md` →
`TNF_SWARM_MASTER_SCHEDULE.md`, and added `TNF_SYSTEM_LEXICON.md` §2:

> _The terms "Corporate", "Department", and "Staff" are permanently deprecated._

`CHALLENGE_RATIONALE_LOG.md` records the authorizer as **Operator, via explicit
"proceed on all fronts" directive**.

So F4 is not a tie between authorities. Four surfaces say `core` — the lexicon
(LOCKED), `TURN_ZERO_MANDATE.md:142`, the schema, and every handoff receipt
since 2026-08-29. Two said `corporate`: `turn-zero-v2-gate.cjs:78` and
`FRONTLOAD_MANIFEST.md:263`. Both were residue of a purge that touched
documents and the schema and never touched an executable.

**Axiom 8 (Non-Temporal Proliferation, = D3) names this exactly:** _"if an agent
improves itself but fails to implement that improvement into the shared TNF
framework, the action is void."_ The purge was void in the part that never
reached code.

## 8. Why it survived: every coherence control is scoped to prose

| Control | Scope | Sees `turn-zero-v2-gate.cjs:78`? |
| --- | --- | --- |
| `notation-reconciliation-audit.cjs:79-84` | `.agent/skills/**/*.md`, `docs/protocols/*.md` | No — markdown only |
| `validate-locked-doc-ledger.cjs` `LEDGER_PROTECTED_FILES` | `DIRECTIVES.md`, `TURN_ZERO_MANDATE.md`, `TURN_END_MANDATE.md` | No |
| commit `7fd41cc3c` itself | docs + schema | No — never touched `scripts/` |

`TURN_ZERO_MANDATE.md` is LOCKED: one word of its prose requires a logged
challenge rationale. The script it designates as _"the machine gate"_
(line 128) can be edited silently. `TNF_DOCUMENT_VETTING_PROCEDURE.md` §5 claims
_"The validator protects both documents so one side cannot drift
independently"_ — true of the two documents, false of the executable that
enforces them.

Gate 4 already covers the missing case: _"Code/procedure changes must link to
the requirement or protocol they implement."_

## 9. The three writers are three directives

Part I called the multi-writer problem sprawl. It is not. Three authorities each
name a different writer, and the code implements all three faithfully:

| Authority | Status | Names as writer |
| --- | --- | --- |
| `DIRECTIVES.md` **D14** | LOCKED + ledger-protected | `node scripts/turn-end.cjs` |
| `TURN_END_MANDATE.md` §Preferred command | LOCKED + ledger-protected | `scripts/turn-end-v2.cjs` |
| `SESSION_HANDOFF_ENFORCEMENT.md` §Automation | unlocked | `pnpm run handoff:emit` → `emit-session-handoff.cjs` |

Confirmed write sites: `emit-session-handoff.cjs:516`, `turn-end-v2.cjs:86`,
`turn-end.cjs` (via tmp+rename). `sync-handoff-cache.cjs` only mirrors to
`~/.tnf/` and is a reader.

**Consolidating writers is therefore a Gate 5 change across two ledger-protected
LOCKED documents — D26 TIER 2, operator confirmation required.** It is not
available at TIER 3 and was not attempted.

"One authority per fact" is not a new axiom. It is **Gate 2**: _"Check whether an
existing unit already owns the concern. Prefer explicit linkage over duplicate
authority."_

## 10. Retraction: the corporate purge is not broadly incomplete

A count of 97 files still containing `corporate` was measured and nearly
reported as a failed purge. It is a false positive.
`data/departments/corporate-departments.json:4` states the distinction TNF
already drew:

> "Operator-facing departments for TNF CLI agent routing. **Distinct from
> pipeline Clusters** (Scouting, Library, Engineering, Governance, Journaling)."

Two senses coexist by design. **Departments** are the operator's real business
lanes (HR, Marketing, Design, Legal, Tech, Finance, Product, Ops) with a live
CLI (`tnf department route`), slash commands and a 208 KB staffing index.
**Clusters** are the agent pipeline. The lexicon deprecates the corporate
metaphor *for agent infrastructure*, never for the operator's company.

`FRONTLOAD_MANIFEST.md:120-127` is correct as written and must not be
"corrected". Genuine residue for the classification axis is two sites, both now
fixed.

## 11. Where the deprecated sense did leak: the pipeline, in the foundations

- `TNF_BOOK_OF_AXIOMS.md:73` — "handoff between **departments** (Scouting →
  Library → **Forge** → Governance)"
- `DIRECTIVES.md:442, 580` — "**Department chain** (Scout→Library→Forge→
  Governance→Connective)" — in a LOCKED, ledger-protected file
- `CORE_SYSTEM_PROMPT_ARCHITECTURE.md:23` — "Librarian, **Forge**, Governance"

against the registry's `Scouting, Library, **Engineering**, Governance,
Journaling`. Stage 3 is *Forge* in three documents and *Engineering* in the
registry; the chain is *Departments* in the locked directives and *Clusters* in
the locked lexicon. `corporate-departments.json:53` says
`"cluster": "Scouting & Synthesis"` while line 4 of the same file says
`Scouting`. **TIER 2 — reserved for operator decision.**

## 12. Correction to F3: D8 authorises the automation, not the fabrication

Part I recommended boot "report, never mint". `SESSION_HANDOFF_ENFORCEMENT.md`
§Operator Intent and **D8** say the opposite: standing authorization explicitly
covers "handoff emission" and _"confirmation is NOT a blocking gate"_.
Auto-emission is intended and should stay.

The defect is narrower and doctrinally precise. D8's own proviso — _"Audit trail
and verification remain mandatory (D2, D6)"_ — with `TURN_END_MANDATE`'s _"`na`
is preferable to inventing a pass"_ and **D5 Attribution Cornerstone**, condemns
the two real faults: printing "validated" without running the schema gate, and
claiming changed paths belonging to other sessions.

## 13. Live incident: the canonical handoff was fabricated by a model

At 12:24 local, while this reconciliation was in progress,
`SESSION_HANDOFF_LATEST.json` was replaced by an 88-line file:

- `handoff_id: a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d` — a hand-shaped sequence
- `created_at: 2026-09-03T16:25:00.000Z` — rounded to the minute
- `source: "repo"`, `session_id: session-2026-09-03-1415` — mutually inconsistent times
- missing **14 of 18** required schema properties
- carrying **6** properties the schema forbids (`additionalProperties: false`)
- `context_refs` has **never** appeared in the git history of `docs/protocols/reports/`

No script in the repository emits that shape. A model wrote a plausible-looking
handoff from imagination over the record.

**Nothing detected it.** `enforce-session-handoff.cjs` reported
`OK (pre-push): no files to inspect` — it is a pre-push gate scoped to changed
files, and a corrupt file merely sitting on disk is invisible to it. At least
three distinct handoff identities existed on 2026-09-03 (`8b3715f7…` with a
valid `core` classification at session start, `a1b2c3d4…` fabricated,
`fe6ae3f4…` in index and HEAD). `8b3715f7…` survives in none of worktree, index
or HEAD.

Also observed: `packages/tnf-cli/dist/cli.js tui` (PID 92811, since 10:23) and
`cli.js boot` (PID 74389) were running throughout. An earlier statement in this
session that the TUI was not running was **wrong** — the `ps` pattern used
(`tnf tui`) does not match the real command line (`cli.js tui`).

**This retires the "single writer" framing.** The handoff is a plain file in a
shared checkout; every agent with a file-write tool is a writer, and no amount
of writer consolidation reaches them. Validation must happen on read.

## 14. What was changed (TIER 3), and what was not

Machine authority: `~/.tnf/authority/tier.json` → `"tier": "tactical"` (TIER 3),
operator Daniel Goldberg, 2026-07-28. No `~/.tnf/authority/standing.md` exists,
so no TIER 4 grant is in force.

**Changed** — rationale: `docs/protocols/challenge-rationales/2026-09-03-turn-zero-classification-source.md`

- `turn-zero-v2-gate.cjs:78` — `corporate` → `core`
- `classificationReceipt()` — reads the handoff record first, `TNF_*` demoted to
  the override hint the mandate calls it, with per-axis provenance and a warning
  when an override contradicts the record
- `orientationSummary()` exposes `handoff.classification`; `main()` reordered
- **new** `scripts/protocols/validate-session-handoff.cjs` — schema validation
  plus fabrication heuristics, self-contained (no `ajv`, no repo
  `node_modules`), per Axiom 1
- the gate calls it on read: warnings always, blocker under
  `--require-write-ready`
- `FRONTLOAD_MANIFEST.md:263` `corporate` → `core`; header tags added (it had
  none, violating D17 and Gate 3, as the most-loaded document in the system)

**Not changed — TIER 2, operator decision required**

1. The D14 / `TURN_END_MANDATE` / `SESSION_HANDOFF_ENFORCEMENT` writer
   contradiction (§9)
2. Department-vs-Cluster and Forge-vs-Engineering vocabulary in the foundations
   (§11)
3. Wiring `--require-write-ready` to the mutation path (§F5) — now unblocked by
   the classification fix, but a behavioural change to the paired lifecycle
   contract
4. `TNF_BOOK_OF_AXIOMS.md` is `[STATUS:PENDING]` — the foundational DNA is
   unvetted while every mandate derived from it is LOCKED

## 15. Revised synthesis

Part I said the doctrine is right and the implementations diverge. The corpus
confirms it and sharpens the mechanism: **TNF's controls govern its prose and
not its executables**, and its own Axiom 8 declares any improvement that fails
to reach the code void. Three independent instances were confirmed — the
notation auditor's markdown-only scope, the locked-doc ledger's three-file list,
and the semantic purge that skipped `scripts/`.

The corrective is not subtraction of writers, which Part I proposed and §13
disproves. It is **validation at the point of read**, because the set of writers
is unbounded by construction.

---

# Part III — The role primitives (2026-09-03)

Parts I and II traced classification and handoff. Part III tests the primitive
underneath the staffing roles: does TNF's authority stack functionally work?

## 16. The kernel is correct — verified, not assumed

`resolveRole()` in `scripts/lib/tnf-identity.cjs` is sound. 22/22 unit tests pass
(`tnf-identity.test.cjs`, `tnf-message-auth.identity.test.cjs`), and the threat
model was exercised directly:

| Probe | Result |
| --- | --- |
| Envelope claiming `super-director` | resolved **`sub-director`** from registry, `claimMismatch: true` |
| Shared-secret signer, no keypair | **`worker`**, `source: unverified`, `roleVerified: false` |
| Verifier in `enforce` vs crafted shared-secret envelope | `ok: false`, `shouldReject: true` |
| Sender in `enforce` without a key | refuses to sign |

It fails closed, never returns a claimed role, rejects path traversal.
`VALID_ROLES = worker | sub-director | super-director`.

## 17. Three vocabularies; the runtime reads the weakest

| Layer | Vocabulary | Source | Read by the running fleet? |
| --- | --- | --- | --- |
| Authority (D23) | `worker \| sub-director \| super-director` | `~/.tnf/authority/roles.json`, Ed25519 | **No** |
| Classification (`dacc_role`) | `director \| orchestrator \| broker \| worker \| participant` | filename substring (`n.includes('director')`) | indirectly |
| Declared | anything, incl. `local-subdirector` | bus payload, `~/.tnf/agent.yaml`, `AGENT_ROLE` | **Yes** |

`packages/tnf-cli` never called `resolveRole`; its only import of the identity
module is `authority provision-keys` → `ensureAgentKeypair` (`cli.ts:7883`).
`agent-roster.ts:213` takes `role` from the agent's own bus self-registration —
the wire claim D23 names.

## 18. The escalation path (fixed in this commit)

`cli.ts` granted autonomy on a **declared** role:

```
if (isLocalSubdirectorIdentity(DEFAULT_AGENT_IDENTITY) && authConfig.autonomyEnabled)
    autonomous = true;
```

`DEFAULT_AGENT_IDENTITY.role` comes from `process.env.AGENT_ROLE` first, then
`~/.tnf/agent.yaml` — including its `dacc_role` field, which D23 states never
authorizes anything. So `AGENT_ROLE=sub-director` was a privilege escalation, and
`tnf agent` defaulted the role to `local-subdirector` on its own.

Observed live: `~/.tnf/agent.yaml` declares `role: director, director_tier: sub`
(satisfying the check), `~/.tnf/local-subdirector.json` grants
`autonomyEnabled: true, capabilities: ['all']` to `agentId: tnf-cli-agent`, and
**`resolveRole('tnf-cli-agent')` returns `worker`**. The two systems disagreed
about the same entity and the permissive one won, because it was the only one
wired.

`DEFAULT_LOCAL_SUBDIRECTOR_CONFIG` compounded it: a **missing** config returned
`autonomyEnabled: true, capabilities: ['all']`, while a **corrupt** one correctly
returned none. Absence granted more than corruption.

Also present, unchanged: `LocalSubdirectorAuthorityService.signLocalSubdirectorIdentity()`
mints a symmetric-HMAC token carrying `role: 'local-subdirector'`. D23 already
names this shape — "any party able to verify it can also forge it" — and the role
it carries is not a valid authority role.

## 19. Fixed here

- `cli.ts` — the autonomy grant now calls `resolveAuthorityRole()`, which
  delegates to `resolveRole()` and fails closed to `worker` on any error. A
  declared role selects the code path; the operator-owned registry decides
  whether it may run autonomously. Denial prints the exact grant command.
- `LocalSubdirectorAuthorityService` — the absent-config default is now
  `autonomyEnabled: false, capabilities: []`. Absence is not consent.
- **new** `scripts/protocols/role-coherence-gate.cjs` — six checks (C1 registry
  integrity, C2 declared-role→privilege reachability, C3 authority-literal
  comparisons outside sanctioned modules, C4 invented authority-shaped roles,
  C5 fail-closed autonomy default, C6 operator identity-file coherence).

Findings went 9 errors → 6. Zero new TypeScript errors (13 before, 13 after).

## 20. Not fixed — and why

- **Registry grants and `TNF_MESSAGE_AUTH_MODE=enforce` are operator-only.**
  `saveRoleRegistry()` refuses to write when `TNF_AGENT_ID` is set: "Role grants
  are operator-owned; run this from an operator shell." That boundary is correct
  and was not circumvented. Live mode is `warn`; `launch-agent-wrapper.sh:47`
  exports the variable empty and has no authority wiring at all.
- **`~/.tnf/agent.yaml` carries four role fields in three vocabularies**
  (`role: director`, `dacc_role: director`, `embodiment: sub-director`,
  `corporate_title: "Local Sub-Director"` — the last using the deprecated
  metaphor). Operator-owned; C6 reports it rather than editing it.
- **The `local-subdirector` spelling shims** in `cli.ts` and
  `LocalSubdirectorAuthorityService` remain, but no longer grant privilege on
  their own.

## 21. Consequence for the fleet

This change **withholds autonomy on this machine** until a grant exists, because
`tnf-cli-agent` resolves to `worker`. That is the intended behaviour — authority
must be granted, not assumed — but it is a live behavioural change:

```
node -e 'require("./scripts/lib/tnf-identity.cjs").setAgentRole("tnf-cli-agent","sub-director")'
```

run from an operator shell (no `TNF_AGENT_ID` set).
