# TNF Agent Classification Audit — 2026-06-14

Status: AUDIT COMPLETE. NO CODE CHANGES YET — awaiting operator decision.
Companion to:
`docs/protocols/reports/AGENT_CLASSIFICATION_AUDIT_2026-06-14.json` Session key:
`agent:local-subdirector:session:2026-06-12T03:17:10.901505Z`

---

## 1. What the operator asked for

TNF (the framework/protocol/harness) must classify and track all agent
definitions across its ecosystem. An "agent" in TNF is any role-fulfillment
pair: a role (`code-generation`, `orchestrator`, `cli-coder`, `browser-driver`)
plus a fulfillment stack (`model`, `tools`, `prompting docs`, transport).
Hermes, kilo, opencode, jules, claude-code, pi-coding-agent — all are agents
from TNF's view, with different qualities on user accounts and in session
metadata. Local surfaces (tnf CLI, web UI, Tauri, VSCode, Chrome ext, Electron)
and the closed SAAS (thenewfuse.com) both consume the same registry.

## 2. What the audit found

### 2.1 Two parallel registry surfaces, neither canonical for "role + fulfillment"

- **In-memory relay registry**
  (`packages/relay-core/src/services/agent-registry.service.ts`). Registry agent
  shape:
  `agentId, sourceId, canonicalEntityId, operationalHandle, runtimeSessionId, aliases, platform, name, capabilities[], registeredAt, lastHeartbeat, lastActivity, status, messageCount, violations, channel`.
  LOSS: `assignAgentId(info)` extracts only 4 of any incoming fields
  (`platform, name, capabilities, channel`) — every other field on the
  registration payload is **dropped** before the agent is stored. If a kilo
  agent sends
  `{ role: 'cli-coder', fulfillment: { model: 'qwen3-coder', tools: [...], prompt_doc: 'kilo-coder.md' } }`,
  the fulfillment object is destroyed.

- **DB-backed Master Agent Registry**
  (`packages/relay-core/src/services/MasterAgentRegistry.ts`
  - `packages/database/src/drizzle/schema/agents.ts`). Drives
    `tnf control-plane` (115 agents, 15 models, 13 MCPs, 122 skills per
    LIVING_STATE). 12 tables, but `agentType` is a flat 100+ value enum that
    mixes roles, platforms, IDE types, and specific products (see
    `enums.ts:25-141`).

### 2.2 The AgentType enum is the smoking gun

`packages/database/src/drizzle/schema/enums.ts:25-141` is a single Postgres enum
that conflates:

| Category                  | Examples                                                                           |
| ------------------------- | ---------------------------------------------------------------------------------- |
| Core role primitives      | `BASIC`, `CHAT`, `WORKFLOW`, `TASK`, `ASSISTANT`, `TOOL`                           |
| System/orchestration role | `ORCHESTRATOR`, `BROKER`, `MONITOR`, `VALIDATOR`, `ROUTER`, `SCHEDULER`, `GATEWAY` |
| CLI role unroller         | `CLI_CODER`, `CLI_DEBUGGER`, `CLI_DEVOPS`, …                                       |
| IDE platform              | `IDE_VSCODE`, `IDE_CURSOR`, `IDE_WINDSURF`, `IDE_JETBRAINS`, `IDE_NEOVIM`, …       |
| Browser products          | `BROWSER_GEMINI`, `BROWSER_CLAUDE`, `BROWSER_CHATGPT`, `BROWSER_COPILOT`, …        |
| GitHub products           | `GITHUB_JULES`, `GITHUB_COPILOT`, `GITHUB_ACTIONS`                                 |
| Domain specialties        | `CODE_GENERATOR`, `CODE_REVIEWER`, `DATA_ANALYST`, `INFRA_KUBERNETES`, `DOC_API`,  |
| TNF framework             | `TNF_CORE`, `TNF_ONBOARDING`, `TNF_COORDINATOR`, `TNF_HANDOFF`, `TNF_HEARTBEAT`    |

The "CLI\_\*" prefix is the closest thing to a role concept, but it's a bucket,
not a typed primitive. There is **no `CLI_KILO`, `CLI_OPENCODE`, `IDE_PI`,
`BROWSER_KILOCLAUDE`, `API_OPENCODE`**. These external products are forced into
`CLI_CODER` or `BROWSER_CHATGPT` etc. — losing identity.

Also: Postgres enums require a migration to extend. Skipping enums → schema
migration can be locked behind ops review for the SAAS tenant.

### 2.3 The broker ignores fulfillment entirely

`packages/relay-core/src/broker-agent.ts:879-912` reads only: `role`,
`capabilities[]`, `status`, `itinerary.lane`. No fulfillment lookup. So when a
`tnf:master:tasks:realtime` task arrives, the broker can match role/capability
but cannot, for example, prefer kilo-on-gpt-oss-120b over kilo-on-glm-5 based on
model availability, or fail-over a persona prompt when a provider 429s.

### 2.4 User accounts have no agent-qualities link

`packages/database/src/drizzle/schema/users.ts:24-43` exposes: `role` (enum),
`roles` (string[]), `preferences` (jsonb). No FK to `agents`, no
`activeAgentIds[]`, no `agentQualities` jsonb. Answering "what agents does
Daniel currently have running and on which models?" requires a join over
`agents.userId` filtered by `lastHeartbeat > now-300s`. That's workable but
undocumented.

### 2.5 `.agent/agents/` (171) and `.claude/agents/` (121) aren't a registry

`tnf-onboard.cjs` counts them but no canonical mapping enforces uniqueness or
folds them into `agents` table. Persona `.md` files are NOT yet reflected in the
DB. The bridge-layer job is to ingest them — none exists yet.

### 2.6 Bridge intake

`packages/relay-core/src/agent-registry-bridge.ts` writes only:
`{ id, canonicalEntityId, operationalHandle, name, platform, capabilities }`.
Even if upstream carries fulfillment, the bridge never forwards it.

## 3. Gap matrix (consolidated)

| #   | Gap                                                                         | Evidence                            | Impact                                                                             |
| --- | --------------------------------------------------------------------------- | ----------------------------------- | ---------------------------------------------------------------------------------- |
| 1   | No role/fulfillment split. AgentType enum conflates role+platform+product.  | `enums.ts:25-141`                   | Adding kilo/opencode requires DB migration; current code sticks them in CLI_CODER. |
| 2   | In-memory registry drops all but 4 fields from incoming info.               | `agent-registry.service.ts:122-139` | Fulfillment metadata is destroyed on registration.                                 |
| 3   | Broker dispatch decisions ignore fulfillment.                               | `broker-agent.ts:879-912`           | Cannot route by model, tools, or prompt-doc availability.                          |
| 4   | kilo/opencode/claude-code/pi-coding-agent absent from enum.                 | `enums.ts:25-141`                   | Identity is lost when these agents register today.                                 |
| 5   | User schema has no link to agents owned/active.                             | `users.ts:24-43`                    | "Daniel's active agents + current models" requires ad-hoc join, not a column.      |
| 6   | Persona `.md` files in `.agent/agents/` and `.claude/agents/` not ingested. | `tnf-onboard.cjs` totals only       | Two parallel persona stores, no single source of truth.                            |

## 4. Proposed first actions (not implemented yet)

These come from Best-Known Assimilation (codify learnings before treating work
complete) and Architecture Before Syntax (define boundaries first). All
additive, non-breaking:

1. **DB migration**: Add `role` (new enum: action-typed) and `fulfillment`
   (jsonb:
   `{ vendor, model, transport, protocol_version, prompt_doc_uri, tools[] }`) to
   `agents` table. Soft-deprecate `type` column with a compatibility shim that
   derives `type` from `role` if missing.
2. **In-memory registry**: change `assignAgentId` to preserve all unrecognized
   fields on a generic `info_record` map, plus mirror to DB row.
3. **Bridge intake**: extend payload passthrough — `role`, `fulfillment`,
   `persona_doc_uri`. Backward-compatible: old clients omitting them keep
   working.
4. **Broker**: add a fulfillment-aware selection step after role/capability
   filter. Read model, prompt_doc_uri from the candidate registry; if multiple
   candidates satisfy, prefer the one whose fulfillment matches the task's
   `itinerary.modelHint` or model-affinity preference.
5. **Seeder**: admin command
   `tnf agents seed --from .agent/agents .claude/agents` to bootstrap entries
   for kilo, opencode, claude-code, pi-coding-agent, and the 171→121 persona
   overlap, each with role-derived fulfillment skeleton.
6. **User link**: optional `activeAgentIds[]` (uuid[]) on `users` for hot-path
   queries (cached on heartbeat ack); full source-of-truth remains join.
7. **CLI**: `tnf agents classify <path>` to derive role+fulfillment from a
   persona `.md` (look for YAML frontmatter and known sections) and idempotently
   upsert into the registry.

## 5. Do not break

- The `AGENT_REGISTER` envelope shape is additive — extension won't break
  existing bridge emitters.
- Merkle root integrity is a hash of the canonical record; new optional jsonb
  fields don't affect existing entries' hash.
- Phase 7 directive conversion ledger is unrelated. Don't touch.
- The "system boundary" rule in TURN_ZERO_MANDATE.md: TNF is the primary control
  plane. Nothing in this work changes that. Hermes stays inside TNF.

## 6. Awaiting operator decision

Pick any of:

A. **Approve all 7 actions in order**, I proceed sequentially with verification
gates at each step. B. **Approve actions 1+2** (DB + in-memory) only, then we
re-surface. C. **Pivot to the CLI ingestor** (action 7) first — fastest moral
win, no DB work, gives us a tool to populate 1+2 once they're in. D. **Different
ordering / scope** — tell me what's most urgent.

While deciding, no code is touched.
