`[CLASS:PRIME] [STATUS:ACTIVE]`
`[DOC_AUDIT_BACKFILL:2026-07-14-RESOLVED-2026-07-21]` — header restored;
autonomous continuous execution for long-running TNF tasks authorized by
operator Daniel Goldberg, confirmed in chat with Claude Code 2026-07-21 (see
DIRECTIVES.md D1). Note: an earlier, uncommitted edit to this file made the same
claim without a real operator confirmation behind it — that edit was
reverted/replaced by this one after being flagged.

# TNF Turn Zero Mandate

Status: ACTIVE Protocol ID: TNF_TURN_ZERO_CANONICAL

## Authority

- Canonical source of truth: `docs/protocols/TURN_ZERO_MANDATE.md` in the TNF
  repository.
- External mirrors (for example `~/GEMINI.md`) are convenience copies only.
- If any mirror conflicts with this file, this file wins.

## System Boundary

- TNF is the primary autonomous system and control plane.
- OpenClaw is an optional interoperability surface TNF can route through.
- Do not characterize TNF as a subset of OpenClaw.
- Verification must follow live host discovery, not stale stack assumptions. See
  `docs/protocols/ADAPTABLE_HOST_VERIFICATION.md`.

## Work Plane Separation (required orientation)

Before coding or committing, classify the task:

1. **Core / Super Admin plane** — shared OSS harness, protocols, generalized
   CLI. Safe for public `main` after review when the change is
   deployer-agnostic.
2. **Deployer config plane** — env, keys, MCP endpoints. Never commit secrets or
   machine-local paths into the OSS tree.
3. **Tenant / personal plane** — one user's goals, Workspace targets, DB rows,
   private mirrors of Living State. Stay in tenant Supabase (or equivalent) and
   local-only stores — **not** open-source `main`.

If a feature is only useful as one operator's personal scaffold, **do not** land
it on OSS `main`. Sanitize it into an optional, env-gated adapter first (see
`GEMINI_SPARK_INTEGRATION_SPEC.md` as the pattern).

## Operating Loop

Always execute in this order: Inspect -> Act -> Verify.

**Adaptable verification:** During Inspect, discover which hosts and handoff
surfaces are actually enlisted. Verify only those surfaces. Do not fail health
or autonomy gates on optional hosts that are inactive (for example OpenClaw
`LATEST.md` when OpenClaw is not in use).

**Work-plane check (Inspect):** Ask whether the pending change is core OSS,
deployer config, or tenant/personal. Route commits accordingly.

**Velocity-Integrity Mandate:** When utilizing experimental or cutting-edge
logic, the `Verify` step MUST rely on a proven, legacy testing pathway to
protect against unverified assumptions.

**Non-Temporal Proliferation Mandate:** Improvements in understanding,
configuration, or processes must not remain disjointed or temporary. All agents
are required to extract their self-improvements and local optimizations and
permanently codify them into the global TNF framework. Evolution must
proliferate universally.

**Best-Known Assimilation & Actualization Mandate:** TNF itself is the ultimate
beneficiary of all known best practices, proven agent behaviors, reliable
command patterns, failure remediations, and protocol lessons. Crucially, this
assimilation is an **everpresent process**. During any information assessment,
news gathering, or capability usage, agents MUST inherently run an
`ASSIMILATE_CHECK` to identify how TNF can natively emulate new strengths.
Furthermore, any assimilated substantive knowledge, facts, or scientific claims
must be strictly attributed to its human or scientific provenance per the
**Attribution Cornerstone** _(excluding standard software patterns or API
utilization to prevent friction)_. Any agent that discovers a better way to
inspect, act, verify, recover, route, or self-improve must convert that learning
into durable TNF code, docs, skills, prompts, tests, or runbooks before treating
the improvement as complete.

**Fleet Delegation Mandate (Cornerstone Tenet):** Agents MUST NOT attempt heavy
multi-stage work strictly in single-threaded isolation when capable peer agents
or subagent runtimes are available. "Act" includes dispatching sub-tasks to
specialized fleet peers (`tnf agents who`, `tnf send`, `tnf handoff emit`, or
subagents). Agents MUST evaluate available fleet targets during Turn Zero and
delegate parallelizable or specialized domain work to maximize total compute
efficiency.

**Tri-Fold Domain Protocol Awareness:** Agents must implicitly determine and
acknowledge the current execution domain:

1. **Corporate Dev Work**: Strict adherence to framework architecture and
   canonical protocols.
2. **Agency Dev Work**: Client-focused, balancing speed and robustness.
3. **Personal Dev Work**: Proactive execution. The agent must proactively guide
   the user, ask for context, and break vague goals into threads/execution
   plans.

## Startup Sequence

At the start of each session:

### Interactive Mode (Default for CLI)

When `TNF_SESSION_MODE=interactive` (default for CLI terminals) or unset,
execute **LIGHTWEIGHT startup**:

1. **Quick State Check** (non-blocking):
   - Read `~/.tnf/swarm-context.md` if present (don't block if missing)
   - Note any P0 alerts from `~/.tnf/alerts.json`

2. **Skip These Heavy Steps** (deferred to background/idle):
   - Full ASSIMILATE_CHECK
   - Git pull
   - Merkle root verification
   - Full codebase_map.json ingestion

3. **Respond to user immediately** - don't let protocol overhead block user
   engagement

### Full Startup Mode (For Swarm Coordination)

When `TNF_SESSION_MODE=swarm`, execute the full 7-step sequence below.

### Full Startup Sequence (SWARM MODE ONLY)

1. Read state files:
   - `docs/protocols/LIVING_STATE.md`
   - `AGENT_STATUS_LEDGER.md` (if present)
   - `~/.tnf/swarm-context.md` (swarm terminal state, coordination issues,
     active directives - updated every heartbeat cycle)
2. Read frontload policy files:
   - `.agent/SYSTEM_PROMPT.md`
   - `.agent/context/resource-map.md`
   - `.agent/context/agent-onboarding.md`
   - `.agent/workflows/frontload.md`
   - `docs/core/FRONTLOAD_MANIFEST.md` (ordered injection Stages A–C)
   - `docs/protocols/HARNESS_CONFIG.md` (harness inventory; file presence ≠ host
     injection — verify surfaces)
   - `docs/core/MEMORY.md` (curated long-term facts; skip in shared/group
     contexts)
   - `docs/core/BOOTSTRAP.md` when status is `PENDING` (complete + stamp)
   - Optional dynamic recall:
     `node scripts/harness/memory-layer.cjs recall --query "<task>"`
3. Read the canonical session handoff:
   - `docs/protocols/reports/SESSION_HANDOFF_LATEST.json` (preferred)
   - `docs/protocols/reports/SESSION_HANDOFF_LATEST.md` (fallback)
   - `.agent/handoff_notes.txt` (legacy fallback) 3b. **Session freshness
     check**: If `SESSION_HANDOFF_LATEST.json` `created_at` is more than 24
     hours older than current time, emit a `session-stale` flag to
     `tnf:master:tasks:planning` and log the discrepancy. A stale session does
     not block execution but must be acknowledged in the operator briefing.
4. Ingest codebase structure:
   - `apps/frontend/src/data/codebase_map.json`
5. Verify integrity:
   - parse `KNOWLEDGE_TREE.json` and confirm it carries a Merkle/root hash.
     Absent artifact reports `skipped` (with reason); unparseable artifact
     reports `failed`. It must never report success without having parsed.
6. Synchronize repo:
   - **Measure by default; do not mutate.** Report branch, upstream, and
     ahead/behind counts, and raise a warning when an in-progress
     merge/rebase/cherry-pick is detected (an interrupted merge sat unnoticed in
     this repo for three days; Turn Zero must surface it at session start).
   - Set `TNF_TURN_ZERO_AUTOPULL=1` to opt into `git pull --rebase --autostash`.
     Pulling unconditionally at session start is unsafe: rebasing into a
     half-resolved merge compounds the damage rather than reporting it.
7. **ASSIMILATE_CHECK**: Scan session handoff work summary, recent git diff, and
   any failure patterns from `~/.hermes/cron/output/` for:
   - Systemic issues (bugs, broken tools, missing capabilities) → create
     directive entry in `DIRECTIVE_CONVERSION_LEDGER.md`
   - Successful patterns (workable command sequences, confirmed workarounds) →
     codify in `.agent/skills/` or relevant protocol doc
   - Failure archaeology (same error appearing multiple times) → create a
     `known-failure` entry in `AGENT_STATUS_LEDGER.md` Protocol Gaps section
     Every substantive learning from the session must leave a durable artifact.
8. Confirm active directive before implementation.

### ASSIMILATE_CHECK Execution Details

The ASSIMILATE_CHECK is not advisory — it is mandatory and must produce output.
Use this procedure:

1. **Scan failure log**: read `~/.hermes/cron/output/*.jsonl` last lines for
   `status: error` or `RuntimeError`. Classify each as `new` or `known`. If new
   and recurring (≥3 occurrences), create a directive.
2. **Scan handoff work_summary**: every `work_summary` item that describes a
   system-level change (new agent, new script, config file, deprecation) should
   be verified as having a corresponding LIVING_STATE entry. If missing, flag as
   `drift-detected`.
3. **Scan recent git commits**: look for patterns in commit messages that
   indicate systemic improvement (e.g., "workaround", "fix", "replaced by") →
   these may indicate gaps the TNF framework should close natively.
4. **Scan SESSION_HANDOFF.next_actions**: any item not yet actioned in this
   session must carry forward to the new handoff.
5. If any of the above produces a finding, write it to
   `tnf:master:tasks:planning` via `redis-cli LPUSH` and append a `[ASSIMILATE]`
   tag to the finding type so downstream consumers know the origin.

## Enforcement Targets

The following must reference this canonical file:

- `docs/core/AGENTS.md`
- `docs/TNF_SESSION_ONBOARDING.md`
- `scripts/tnf-onboard.cjs`
- `scripts/turn-end.cjs` (must be called at every session close)
- `scripts/check-agent-registration.cjs` (must be run when new operational
  agents are created)
