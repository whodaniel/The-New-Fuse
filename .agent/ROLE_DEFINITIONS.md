# Agent Role Definitions (Restored — 2026-08-12)
[CLASS:INTEL] [STATUS:ACTIVE]

**Governed by:** master-of-taxonomies (director, taxonomy-governance)

## Canonical dacc_role Hierarchy (authority order)
1. **director** — Full fleet authority, role mutation rights, governance decisions
   - Agents: `tnf-cli` (tnf-cli-agent)
   - Authority config: `.tnf/authority/roles.json`

2. **orchestrator** — Workflow decomposition, task delegation, state management
   - Agents: *(pending promotion)*

3. **broker** — Task queue consumption, policy evaluation, agent dispatch
   - Agents: *(pending promotion)*

4. **worker** — Specialized execution, skill-bound, no delegation authority
   - Agents: 193 current workers (see registry_summary.json)
   - Live swarm: `tnf-thin-client` (requires cleanup; 2072 duplicates)

5. **participant** — Chat/interface agents, no fleet authority
   - Agents: *(pending assignment)*

## Worker Action Taxonomy (role-classification sub-skill)
Action-typed values for `worker_action` field:
- `code-generation`, `cli-coder`, `api-development`, `frontend-development`
- `database-design`, `security-audit`, `performance-optimization`, `devops-engineering`
- `taxonomy-governance`, `role-classification`, `skill-classification`, `protocol-map`
- `agent-registration`, `fleet-health`, `relay-monitoring`, `bridge-maintenance`
- `content-creation`, `research-analysis`, `data-processing`, `testing-validation`
- `documentation`, `narrative-synthesis`, `source-investigation`, `lineage-tracking`

## Platform Taxonomy (unified PLATFORM_TAXONOMY)
From union of AGENT_PLATFORM_TRAITS + BANK_TARGETS:
`antigravity`, `gemini`, `claude`, `jules`, `pi`, `vscode`, `browser`, `codex`, `opencode`, `kilo`, `augment`, `tnf`, `hermes`, `project`, `all`, `cursor`, `gemini-cli`, `qoder`, `openclaw`

## ID Band Allocation
- **Production Band (1-999M):** Official registered fleet agents.
- **Provisional Band (1e9-2e9):** Temporary or experimental agents (1,000,000,000 to 1,999,999,999).
- **Seeder Band (2e9-3e9):** Baseline/seed agents (2,000,000,000 to 2,999,999,999).

## Identity Schema
- `tnfId`: `TNF:<CATEGORY>:<PROVIDER>:<NAME>:<INSTANCE>` (UUID-based, stable)
- `federatedId`: Base58 Merkle entity hash (from `tnf/mcid/0.1` spec)
- `canonicalEntityId`: Hierarchical string identifier (e.g., `TNF:LOCAL:AGENT:...`)
- `idNumber`: Integer PK. Global unique monotonic identifier used internally for rapid indexing and routing.
- `vector_id`: Embedded vector identifier used for semantic search over agent history and capabilities, distinct from `idNumber`.

## Mirror Policy
`.claude/agents/` MUST be exact mirror of `.agent/agents/` — sync on every mutation via `master-of-taxonomies` governance operations.

## Cross-References
- Registry: `registry_summary.json`
- Profiles: `profiles/`
- Terminal role map: `session-discovery/terminal-role-map.json`
- Agent state: `AGENT_STATE_REGISTRY.md`