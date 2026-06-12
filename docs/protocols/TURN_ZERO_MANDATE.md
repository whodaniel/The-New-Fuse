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

## Operating Loop

Always execute in this order: Inspect -> Act -> Verify.

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

1. Read state files:
   - `docs/protocols/LIVING_STATE.md`
   - `AGENT_STATUS_LEDGER.md` (if present)
2. Read frontload policy files:
   - `.agent/SYSTEM_PROMPT.md`
   - `.agent/context/resource-map.md`
   - `.agent/context/agent-onboarding.md`
   - `.agent/workflows/frontload.md`
3. Read the canonical session handoff:
   - `docs/protocols/reports/SESSION_HANDOFF_LATEST.json` (preferred)
   - `docs/protocols/reports/SESSION_HANDOFF_LATEST.md` (fallback)
   - `.agent/handoff_notes.txt` (legacy fallback)
4. Ingest codebase structure:
   - `apps/frontend/src/data/codebase_map.json`
5. Verify integrity:
   - confirm current Merkle/root integrity artifacts if required by active
     protocol
6. Synchronize repo:
   - run `git pull --rebase` (or `--autostash` when local edits are present)
7. Confirm active directive before implementation.

## Enforcement Targets

The following must reference this canonical file:

- `docs/core/AGENTS.md`
- `docs/TNF_SESSION_ONBOARDING.md`
- `scripts/tnf-onboard.cjs`
