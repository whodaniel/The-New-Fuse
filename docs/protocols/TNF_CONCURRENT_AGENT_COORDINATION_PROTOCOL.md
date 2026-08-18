# 🤝 TNF Concurrent Agent Coordination Protocol

**Status:** ACTIVE · **Class:** [CLASS:PRIME] · **Protocol ID:**
TNF_CONCURRENT_AGENT_COORDINATION_CANONICAL **Scope:** Two or more agents (any
lineage — Hermes, Kilo, Claude, Codex, Gemini, OpenClaw, tenant loops,
sub-directors) working on the **same related or overlapping task** within the
TNF federated hierarchy. **Location:**
`docs/protocols/TNF_CONCURRENT_AGENT_COORDINATION_PROTOCOL.md` **Companion:**
`MULTI_AGENT_INTEGRATION_PROTOCOL.md` (git-level), `AGENT_STATUS_LEDGER.md`,
`TURN_ZERO_MANDATE.md`, `DIRECTIVES.md` (D6/D7/D14/D21).

> This protocol answers one question for any agent that finds itself on a task
> another agent may already own: **how do I know, how do I coordinate, and how
> does the fleet keep one direction?** It sits _above_ git conflict resolution —
> it governs the conceptual overlap (two agents both "write the directives")
> before any file is touched.

---

## 1. Situation · Environment · State

### 1.1 What "overlap" means here

Not a git merge conflict (that is `MULTI_AGENT_INTEGRATION_PROTOCOL.md`).
Overlap is when **two or more agents independently adopt the same goal or
artifact** — e.g. both synthesize `DIRECTIVES.md`, both fix `cli.ts`, both draft
the same skill. The danger: duplicated work, divergent artifacts, conflicting
handoffs, and silent overwrites of each other's output.

### 1.2 Environment an overlapping agent operates in

- A **federated, asynchronous** swarm: agents may boot minutes/hours apart, on
  different CLIs, with no shared live conversation.
- A **control plane** (`tnf`) that is the single source of direction; OpenClaw
  and other Claws are optional routed surfaces.
- **Persistence layers** that make state discoverable across agents:
  `docs/protocols/LIVING_STATE.md`, `AGENT_STATUS_LEDGER.md`,
  `reports/SESSION_HANDOFF_LATEST.{json,md}`, `~/.tnf/swarm-context.md`
  (coordination issues + active directives, refreshed every heartbeat),
  `~/.tnf/alerts.json`, the Redis `tnf:handoff:v1:*` inbox, and the Change
  Ownership Ledger (`data/protocols/CHANGE_OWNERSHIP.jsonl`).

### 1.3 State signals that overlap is happening / about to

- Another agent's name or output appears in `swarm-context.md` "coordination
  issues" or "active directives".
- `AGENT_STATUS_LEDGER.md` "Next Agent Focus" or "Protocol Gaps" names the same
  artifact you are about to create.
- `SESSION_HANDOFF_LATEST.next_actions` lists the same task.
- You see an in-flight / un-acked handoff packet whose `payload.prompt` targets
  your intended artifact (`tnf:handoff:v1:inbox:agent:<you>`).
- A file you plan to write is already present and newer than your session start,
  or is tracked as "modified" in `git status` by an unknown actor.

> **Canonical incident (do not repeat):** During the 2026-07-08 directives work,
> the operator asked Hermes to synthesize `DIRECTIVES.md`; a separate agent
> (Kilo) independently executed the same synthesis and also wrote
> `DIRECTIVES.md` + `LIVING_DIRECTIVES_CARD.md`. Both produced valid artifacts
> on the same path. Resolution required one authoritative consolidation. This
> protocol exists so the _next_ overlapping agent detects the sibling first.

> **Canonical incident #2 — shared-report overwrite, two variants
> (2026-08-16):** A fleet of multiple agents (Hermes sessions,
> `tnf-interactive-01`, the `command-code` worker added on 2026-08-16, and any
> `tnf-cli-agent` running autonomous commits) all emit into the same shared
> canonical report `docs/protocols/reports/SESSION_HANDOFF_LATEST.json`. Two
> distinct overwrite variants have been observed in the same session:
>
> 1. **Schema-INVALID clobber** — a concurrent emitter writes a payload that
>    fails `docs/protocols/schemas/tnf-session-handoff.schema.json` (e.g.
>    missing `repository` / `branch` / `head_sha` / `changed_paths`, a
>    `work_summary` string instead of array, a `continuation` with no `owner`).
>    Observed once: an emitter stamped `source_agent: tnf-interactive-01`
>    clobbered the working-tree copy that a committed, schema-valid handoff
>    (`f202ac36`) had just established.
> 2. **Schema-VALID clobber** (more common) — a concurrent emitter writes a
>    _schema-valid_ handoff whose `created_at` is _newer than your own
>    session-start time_. Observed in real fleet activity: a `command-code`
>    worker emitted handoff `56ff164f` (`created_at: 20:31Z`,
>    `head_sha: b4e3627c19`,
>    `work_summary: ["Created 1 new agent(s): command-code", ...]`) while this
>    session was still running. The on-disk file passes every schema check, but
>    it is **not your** handoff and not your `next_actions`. If you
>    `git checkout HEAD --` this version, you destroy the other agent's session
>    continuity — the right move is to **detect and decide**, not blindly
>    restore.
>
> Both variants share the same failure class as incident #1 above: a shared
> persistence path written by multiple actors. They did **not** affect the
> already-pushed `HEAD` (that stays clean); they only dirtied the working tree
> and would have poisoned the next agent's `handoff:gate` (variant 1) or its
> continuity assumptions (variant 2) unless detected.
>
> **Detection — the concurrent-write invariant (catches BOTH variants):** before
> trusting or acting on any diff to the handoff report, run all three:
>
> ```bash
> # (a) Schema-invariant (catches variant 1: invalid clobbers)
> node -e "const A=require(require.resolve('ajv/dist/2020',{paths:[process.cwd()+'/scripts/protocols']})).default;
> const F=require(require.resolve('ajv-formats',{paths:[process.cwd()+'/scripts/protocols']}));
> const fs=require('fs');const s=JSON.parse(fs.readFileSync('docs/protocols/schemas/tnf-session-handoff.schema.json','utf8'));
> const h=JSON.parse(fs.readFileSync('docs/protocols/reports/SESSION_HANDOFF_LATEST.json','utf8'));
> const ajv=new A({allErrors:true,strict:false});F(ajv);console.log('VALID:',ajv.compile(s)(h));"
> # (b) Freshness comparison (catches variant 2: valid clobbers newer than your session start)
> stat -f '%Sm' docs/protocols/reports/SESSION_HANDOFF_LATEST.json   # mtime
> # Compare against your session start (the timestamp you booted at).
> # If mtime > session-start AND the file's commits[] does NOT include
> # any sha you committed this session, a concurrent emitter overwrote it.
> git show HEAD:docs/protocols/reports/SESSION_HANDOFF_LATEST.json | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const h=JSON.parse(s);console.log('committed id:',h.handoff_id,'commits:',(h.artifacts?.commits||[]).length);});"
> # (c) Live-writer check (always required before any restore)
> pgrep -fl "emit-session-handoff|turn-end"     # must be empty
> crontab -l | grep -iE "handoff|turn-end"      # must be empty
> ```
>
> Interpretation:
>
> - (a) on-disk invalid AND `git show HEAD:` valid → variant 1 overwrite.
> - (b) on-disk mtime > your session-start AND on-disk `commits[]` excludes the
>   sha you authored this session → variant 2 overwrite.
> - (c) any live writer → **stop**; surface to operator instead of restoring.
>
> **Recovery — depends on the variant:**
>
> - Variant 1 (invalid clobber): restore canonical truth from HEAD, then re-emit
>   your own handoff on top:
>   ```bash
>   git checkout HEAD -- docs/protocols/reports/SESSION_HANDOFF_LATEST.json \
>     docs/protocols/reports/SESSION_HANDOFF_LATEST.md
>   # re-emit your work unit's handoff (script: emit-session-handoff.cjs)
>   ```
> - Variant 2 (valid clobber): do NOT destroy the other agent's work. Either (i)
>   keep their handoff and append your `next_actions` via a fresh
>   `emit-session-handoff` (the emitter's coverage check tolerates multiple
>   actors if their `changed_paths` are disjoint), or (ii) raise to operator and
>   pause. The handoff is **shared canonical state**, not a single-writer log.
> - In either case, **never** `git add -A` a clobbered version into a commit;
>   **never** restore while a live emitter may still be writing.

---

## 2. Detection — the Overlap Check (run BEFORE producing output)

Every agent, after Turn Zero, MUST run the Overlap Check when its task touches a
**shared artifact** (any file under `docs/protocols/`, `docs/core/`,
`packages/`, `scripts/`, `.agent/`, or a named skill):

1. Read `~/.tnf/swarm-context.md` → scan "coordination issues" + "active
   directives".
2. Read `AGENT_STATUS_LEDGER.md` → "Next Agent Focus" + "Protocol Gaps".
3. Read `reports/SESSION_HANDOFF_LATEST.{json,md}` → `next_actions`.
4. Check your `tnf:handoff:v1:inbox:agent:<you>` for un-acked packets on the
   topic.
5. `git status --short` → is the target file already modified by another actor?
6. Grep the repo for the artifact name / a distinctive phrase from your plan.

If **any** signal shows another agent already owns or is producing the same
artifact → you are in overlap. Proceed to §3. Do **not** silently write.

---

## 3. Coordination Procedure (the core loop)

```
DETECT overlap  ──▶  CLAIM/RECORD  ──▶  CLASSIFY TIER  ──▶  RESOLVE  ──▶  COMMUNICATE  ──▶  VERIFY
```

### 3.1 Claim / Record

- Emit a Change Ownership Ledger record: `pnpm run ownership:ledger:emit`
  (actor, branch, head SHA, changed-file hash, ownership domain counts). This is
  the canonical "I am on this" signal other agents can see.
- Post a one-line coordination note to `swarm-context.md` (or request the
  Director to) stating: artifact, your intended approach, and status (`claiming`
  / `coordinating` / `yielding`).

### 3.2 Classify tier (reuse `MULTI_AGENT_INTEGRATION_PROTOCOL.md` tiers)

Run `pnpm run conflict:tier` (or apply manually):

- **isolate** — your angle is genuinely distinct (different file, different
  scope). Safe to proceed in parallel; note the boundary in swarm-context.
- **merge-with-attribution** — same artifact, complementary slices. Coordinate a
  single owner + merge points; attribute each slice.
- **escalate** — same artifact, divergent intent, or a
  protocol/workflow/Supabase /gitlink-risk surface. Hand to the
  Director/Orchestrator; do not both write.

### 3.3 Resolve (pick one)

- **Yield** — if the other agent started first or is further along, stop, adopt
  their artifact as canonical, and switch to a supporting role (review, extend,
  or a different artifact). This is the default when overlap is discovered late.
- **Merge-with-attribution** — agree a split (e.g. one owns `DIRECTIVES.md`, the
  other owns the skill + card), then each writes only their slice; cross-link.
- **Single-owner escalate** — when intent diverges, the Director (currently
  `cursor-auto-operator`) assigns one owner; the other stands down or takes a
  clearly separate deliverable. Emit a targeted handoff packet
  (`HandoffStoreService.publish`, `targets.agentIds:[other]`) carrying the
  decision + Merkle hash.

### 3.4 Communicate

- Update `swarm-context.md` coordination issues with the resolution.
- If you stood down or changed scope, emit `SESSION_HANDOFF_LATEST` (or ask the
  Director to) so the next agent knows the new boundary.
- Never leave a shared artifact half-written by two actors. (Anti-Lobotomy D7
  and Handoff Enforcement D14 still apply — critical-path changes need handoff
  artifacts; never `rm`/`git rm` another agent's state dirs.)

### 3.5 Verify

- Re-run the Overlap Check after acting. Confirm exactly one canonical artifact
  exists on the target path; the other agent's work is either merged (with
  attribution) or redirected to a distinct path.
- **Shared canonical report invariant:** before trusting or acting on any diff
  to `docs/protocols/reports/SESSION_HANDOFF_LATEST.{json,md}`, run all three
  checks (schema-invariant, freshness-vs-session-start, live-writer) per §1.3
  incident #2. An invalid-on-disk payload, **or** a valid-on-disk payload newer
  than your session-start whose `commits[]` excludes the sha you authored this
  session, means a concurrent emitter overwrote the shared report. Variant 1
  (invalid) → restore from `HEAD` and re-emit. Variant 2 (valid) → keep the
  other agent's handoff and either append your `next_actions` or raise to
  operator; do not destroy their work.

---

## 4. Conflict Tiers → Overlap Mapping

| Tier (from MULTI_AGENT_INTEGRATION) | Overlap meaning                                 | Action                                         |
| ----------------------------------- | ----------------------------------------------- | ---------------------------------------------- |
| `isolate`                           | Distinct slice/scope                            | Parallel; record boundary in swarm-context     |
| `merge-with-attribution`            | Same artifact, complementary                    | One owner + merge points; attribute slices     |
| `escalate`                          | Same artifact, divergent intent / risky surface | Director assigns single owner; other redirects |

Git-level enforcement (integration train `integration/*` → linear `main`,
gitlink reachability, CI strict gates) still applies on top of this — see
`MULTI_AGENT_INTEGRATION_PROTOCOL.md`.

---

## 5. Operator Guidance (how the human directs overlapping agents)

You are the Director's principal. When you see (or suspect) overlap:

1. **Name one owner** for the shared artifact; tell the other agent its distinct
   deliverable (or to stand down). A single sentence prevents divergence.
2. **Keep one direction source:** the authoritative handoff
   (`SESSION_HANDOFF_LATEST`) + `swarm-context.md`. Point both agents at it.
3. **Use the active channel** (ledger "Operator → Active channel", e.g. Green)
   so both agents receive the same directive, not two forks of it.
4. **Prefer de-confliction over parallel redo:** if two agents already produced
   divergent artifacts, pick the canonical one, fold the other's unique value in
   with attribution, and archive the duplicate (Document Vetting §5 — archive,
   don't delete).
5. **Don't launch a second agent on the same open task without first checking
   `swarm-context.md` / ledger** — that is how overlap starts.

---

## 6. Fleet Direction via the TNF Harness (how ANY agent finds direction)

An agent that boots into an overlapping situation orients itself by reading, in
order (per `TURN_ZERO_MANDATE.md` + this protocol):

1. `docs/protocols/LIVING_STATE.md` — current synchronized state + Merkle root.
2. `AGENT_STATUS_LEDGER.md` — "Next Agent Focus", roster, protocol gaps.
3. `~/.tnf/swarm-context.md` — live coordination issues + active directives.
4. `reports/SESSION_HANDOFF_LATEST.{json,md}` — continuation + next_actions.
5. `tnf:handoff:v1:inbox:agent:<you>` — targeted packets addressed to me.
6. `DIRECTIVES.md` — the canonical demands/allows/provides (incl. D6 Radical
   Transparency, D7 Anti-Lobotomy, D14 Handoff Enforcement, D21 Integration
   Train).
7. This protocol — if step 2/3/4 shows another agent on my artifact → §3.

The harness is the control plane: state is discoverable, claims are recordable,
handoffs are targetable, and tiers are classifiable — so a fleet never needs a
live group chat to stay on one direction.

---

## 7. Failure Modes to Avoid

- **Silent parallel redo** — two agents both write the same file; one overwrites
  the other (or git conflict). → Overlap Check (§2) before any shared artifact.
- **Divergent canons** — two valid but different `DIRECTIVES.md` exist; no
  single source of truth. → Yield/merge/escalate (§3.3); pick one canonical.
- **Shared-report clobber** — one or more agents emit into the single shared
  `SESSION_HANDOFF_LATEST.json` after another committed a handoff (incident #2,
  §1.3, two variants observed: schema-INVALID clobbers and schema-VALID clobbers
  newer than your session-start). → concurrent-write invariant test first
  (schema + freshness + live-writer); never `git add -A` a clobbered version;
  for variant 1 restore from `HEAD` then re-emit; for variant 2 keep the other
  agent's handoff and either append your `next_actions` via a fresh emit or
  pause for operator decision.
- **Orphaned handoffs** — work done but not recorded; next agent rediscovers it.
  → Turn End + handoff artifacts (D14) after resolving.
- **State-dir damage** — one agent "cleans up" another's `.agent/`/`.tnf/`. →
  Anti-Lobotomy (D7); hard-coded exclusions; explicit HITL only.
- **Talking past each other** — two agents on different channels/CLIs with no
  shared directive. → Operator keeps one active channel + one handoff source
  (§5).

---

## 8. Enforcement & References

- Referenced by `DIRECTIVES.md` (D6, D7, D14, D21) and the `tnf-directives`
  skill (kept in its source manifest so future crawls include this protocol).
- Tooling: `pnpm run ownership:ledger:emit[:ci]`, `pnpm run conflict:tier[:ci]`,
  `scripts/protocols/classify-change-tier.cjs`, `HandoffStoreService`
  (`packages/relay-core`), integration-train gate
  (`.github/workflows/integration-train-gate.yml`).
- Divergence from this protocol (e.g. two agents both claiming an artifact
  without recording) is a coordination gap — record it in `swarm-context.md` and
  surface in the next handoff.

---

_Sources: MULTI_AGENT_INTEGRATION_PROTOCOL.md · AGENT_STATUS_LEDGER.md ·
TURN_ZERO_MANDATE.md · TURN_END_MANDATE.md · AGENT_TARGETED_HANDOFF_V1.md ·
DIRECTIVES.md (D6/D7/D14/D21) · TNF_FLEET_HEALTH_PROBE_PROTOCOL.md ·
TNF_SELF_HEALING_PROTOCOL.md · docs/core/AGENTS.md (swarm-context, Tri-Fold,
OpenClaw policy) · docs/CLAUDE.md_
