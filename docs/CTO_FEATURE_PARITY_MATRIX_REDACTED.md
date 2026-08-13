# CTO Feature Parity Matrix — Target platform + MiniMax 2.7 vs TNF

> **Mission**: Ensure TNF has every capability that Target platform Computer and
> MiniMax 2.7 provide. **Status**: 🔴 In Progress | 🟡 Partial | 🟢 Done | ⚪
> Not Applicable

---

## Layer 1: AI Model Integration

| Capability                   | Target platform | MiniMax 2.7 | TNF | Gap                                                    |
| ---------------------------- | --------------- | ----------- | --- | ------------------------------------------------------ |
| Multi-provider LLM routing   | 🟢              | 🟢          | 🟢  | A2A v0.3.0 spec supports routing                       |
| MiniMax-Text-01              | 🟢              | 🟢          | 🟡  | Added to ai.controller.ts but not yet streaming        |
| MiniMax M2 MoE (456B params) | 🟢              | 🟢          | ⚪  | Inference endpoint needed                              |
| Lightning Attention          | 🟢              | 🟢          | ⚪  | Algorithm not implemented                              |
| Sparse MoE routing           | 🟢              | 🟢          | ⚪  | Agent routing only                                     |
| 1M token context             | 🟢              | 🟢          | ⚪  | Not implemented                                        |
| Streaming responses          | 🟢              | 🟢          | 🟡  | ai.controller.ts only non-streaming                    |
| OpenAI-compatible API        | 🟢              | 🟢          | 🟢  | Already supported                                      |
| Anthropic Claude             | 🟢              | 🟢          | 🟢  | Already supported                                      |
| Gemini                       | 🟢              | 🟢          | 🟢  | Via MCP and direct API                                 |
| BYOK (bring your own key)    | 🟢              | 🟢          | 🟢  | LLMProviderService supports custom API keys            |
| Model selection per-agent    | 🟢              | 🟢          | 🟡  | agent.factory.ts has defaults but no runtime selection |
| Vision/image understanding   | 🟢              | 🟢          | 🟡  | No dedicated endpoint yet                              |
| Text-to-speech               | 🟢              | 🟢          | ⚪  | Not implemented                                        |
| Function calling / tools     | 🟢              | 🟢          | 🟢  | A2A v0.3.0 supports skill declarations                 |
| System prompt per agent      | 🟢              | 🟢          | ⚪  | Agent personality not persisted                        |

---

## Layer 2: Agent Orchestration

| Capability                                   | Target platform | MiniMax 2.7 | TNF | Gap                                              |
| -------------------------------------------- | --------------- | ----------- | --- | ------------------------------------------------ |
| Agent creation (on-demand)                   | 🟢              | 🟢          | 🟢  | create_agent tool available                      |
| Scheduled agents                             | 🟢              | 🟢          | 🟢  | Master Clock super-cycle                         |
| Agent roles/personas                         | 🟢              | 🟢          | 🟡  | Agent factory has defaults but no persona system |
| Multi-agent collaboration                    | 🟢              | 🟢          | 🟢  | DACC-v1 + relay channels                         |
| Agent-to-agent messaging                     | 🟢              | 🟢          | 🟢  | WebSocket relay                                  |
| Agent heartbeat/monitoring                   | 🟢              | 🟢          | 🟢  | Master Clock 3s heartbeat                        |
| Agent stall detection                        | 🟢              | 🟢          | 🟢  | Master Clock 5s threshold                        |
| Agent recovery/restart                       | 🟢              | 🟢          | 🟢  | Master Clock recovery loop                       |
| Agent capability discovery                   | 🟢              | 🟢          | 🟢  | A2A AgentCard + DACC-v1                          |
| Agent identity (canonical ID)                | 🟢              | 🟢          | 🟢  | buildCanonicalEntityId in relay-core             |
| Agent signing (message auth)                 | 🟢              | 🟢          | 🟢  | [AGENT-XX] signed messages                       |
| Agent self-registration                      | 🟢              | 🟢          | 🟢  | Via relay AGENT_REGISTER                         |
| Multi-session concurrency                    | 🟢              | 🟢          | 🟢  | Multiple WS connections supported                |
| Agent memory/persistence                     | 🟢              | 🟢          | 🟡  | Git + handoff_notes, no agent-native DB          |
| Agent hierarchy (Director/Orch/Broker/Agent) | 🟢              | 🟢          | 🟢  | Master Clock enforces hierarchy                  |
| Agent skills bank                            | 🟢              | 🟢          | 🟢  | 476+ skills in .agent/skills/                    |
| Skill invocation by other agents             | 🟢              | 🟢          | 🟢  | get_agent_bank_resources MCP tool                |

---

## Layer 3: Web & Hosting

| Capability                   | Target platform | MiniMax 2.7 | TNF | Gap                           |
| ---------------------------- | --------------- | ----------- | --- | ----------------------------- |
| Managed web pages (zo.space) | 🟢              | N/A         | 🔴  | **NO equivalent — P0 gap**    |
| API routes (HTTPS)           | 🟢              | N/A         | 🟢  | Via backend API               |
| Custom domains               | 🟢              | N/A         | 🟡  | Via CloudRuntime/Vercel (manual)   |
| Static asset hosting         | 🟢              | N/A         | 🟡  | Assets in /public             |
| WebSocket hosting            | 🟢              | N/A         | 🟢  | relay-server                  |
| Auto-scaling                 | 🟢              | N/A         | ⚪  | Not managed                   |
| Zero-config deployment       | 🟢              | N/A         | 🔴  | Manual CloudRuntime setup required |
| Preview deployments          | 🟢              | N/A         | ⚪  | Not implemented               |
| Branch previews              | 🟢              | N/A         | ⚪  | Not implemented               |
| Built-in CDN                 | 🟢              | N/A         | ⚪  | Not implemented               |
| SSL/TLS auto-cert            | 🟢              | N/A         | 🟢  | CloudRuntime provides              |
| Health check endpoints       | 🟢              | N/A         | 🟡  | /health exists                |
| Background workers           | 🟢              | N/A         | 🟡  | Master Clock + cron jobs      |
| Cron/scheduled tasks         | 🟢              | N/A         | 🟢  | Super-cycle scheduler         |
| Persistent services          | 🟢              | N/A         | 🟡  | CloudRuntime services but manual   |

---

## Layer 4: Communication Channels

| Capability                          | Target platform | MiniMax 2.7 | TNF | Gap                          |
| ----------------------------------- | --------------- | ----------- | --- | ---------------------------- |
| Chat (web UI)                       | 🟢              | 🟢          | 🟢  | MultiAgentChat, ChatPage     |
| SMS/text messaging                  | 🟢              | N/A         | 🟢  | Twilio/OpenClaw              |
| Email                               | 🟢              | N/A         | 🟢  | Gmail integration            |
| Telegram                            | 🟢              | N/A         | 🟢  | Via OpenClaw                 |
| WebSocket real-time                 | 🟢              | 🟢          | 🟢  | relay-core                   |
| Redis pub/sub (distributed)         | 🟢              | N/A         | 🟢  | Redis transport              |
| HTTP webhooks                       | 🟢              | 🟢          | 🟢  | API endpoints                |
| SSE (Server-Sent Events)            | 🟢              | 🟢          | ⚪  | Not implemented              |
| A2A (Agent-to-Agent) protocol       | 🟢              | 🟢          | 🟢  | A2A v0.3.0 spec + TNF custom |
| Channel system (Green/Blue/Red/etc) | 🟢              | 🟢          | 🟢  | 6 channels + custom          |
| Channel persistence                 | 🟢              | 🟢          | 🟡  | In-memory + Redis            |

---

## Layer 5: Data & Storage

| Capability                   | Target platform | MiniMax 2.7 | TNF | Gap                       |
| ---------------------------- | --------------- | ----------- | --- | ------------------------- |
| File storage                 | 🟢              | N/A         | 🟢  | Workspace + S3            |
| Structured data (datasets)   | 🟢              | N/A         | 🟢  | DuckDB + datapackage.json |
| Relational database          | 🟢              | N/A         | 🟢  | PostgreSQL (CloudRuntime)      |
| In-memory cache              | 🟢              | N/A         | 🟢  | Redis                     |
| Vector storage               | 🟢              | N/A         | ⚪  | Not implemented           |
| Time-series / logging        | 🟢              | N/A         | 🟢  | Loki (Grafana stack)      |
| Object storage (S3)          | 🟢              | N/A         | 🟡  | MinIO locally             |
| Data versioning              | 🟢              | N/A         | 🟡  | Git + snapshots           |
| Time travel (restore points) | 🟢              | N/A         | 🟡  | Via System snapshots      |

---

## Layer 6: Developer Experience

| Capability             | Target platform | MiniMax 2.7 | TNF | Gap                                          |
| ---------------------- | --------------- | ----------- | --- | -------------------------------------------- |
| CLI tool (tnf)         | 🟢              | N/A         | 🟢  | 100+ commands                                |
| MCP server             | 🟢              | N/A         | 🟢  | 5 MCP servers configured                     |
| VS Code extension      | 🟢              | N/A         | 🟢  | apps/vscode-extension                        |
| Chrome extension       | 🟢              | N/A         | 🟢  | apps/chrome-extension                        |
| Desktop app (Tauri)    | 🟢              | N/A         | 🟢  | apps/tauri-desktop                           |
| Electron desktop       | 🟢              | N/A         | 🟡  | apps/electron-desktop (partial)              |
| API docs (REST)        | 🟢              | 🟢          | 🟡  | Swagger/OpenAPI missing                      |
| SDK / client libraries | 🟢              | 🟢          | ⚪  | Not published                                |
| GitHub integration     | 🟢              | N/A         | 🟢  | GitHub PAT auth                              |
| CI/CD pipeline         | 🟢              | N/A         | 🟢  | GitHub Actions                               |
| Local dev environment  | 🟢              | N/A         | 🟡  | docker-compose but Docker blocked in sandbox |
| TypeScript-first       | 🟢              | 🟢          | 🟢  | Full TypeScript monorepo                     |
| Hot reload             | 🟢              | N/A         | 🟡  | Vite in frontend                             |
| Error monitoring       | 🟢              | N/A         | ⚪  | Not integrated                               |

---

## Layer 7: Security & Compliance

| Capability                    | Target platform | MiniMax 2.7 | TNF | Gap                       |
| ----------------------------- | --------------- | ----------- | --- | ------------------------- |
| Agent message signing         | 🟢              | 🟢          | 🟢  | DACC-v1 signed messages   |
| Bearer token auth             | 🟢              | 🟢          | 🟢  | API routes                |
| OAuth 2.0                     | 🟢              | N/A         | 🟢  | Google OAuth              |
| API key management            | 🟢              | 🟢          | 🟢  | Settings > Advanced       |
| Secret management (env vars)  | 🟢              | 🟢          | 🟢  | CloudRuntime env vars          |
| SQL injection protection      | 🟢              | 🟢          | 🟢  | Parameterized queries     |
| Input validation/sanitization | 🟢              | 🟢          | 🟢  | Security-hardening.js     |
| Rate limiting                 | 🟢              | N/A         | ⚪  | Not implemented           |
| Audit logging                 | 🟢              | 🟢          | 🟢  | AuditLogViewer + Loki     |
| Permission/role system        | 🟢              | N/A         | 🟢  | SUPER_ADMIN, MEMBER, etc. |
| Workspace isolation           | 🟢              | N/A         | 🟢  | Multi-tenant workspaces   |
| Encrypted at rest             | 🟢              | N/A         | 🟢  | CloudRuntime PostgreSQL        |
| Encrypted in transit          | 🟢              | N/A         | 🟢  | HTTPS/WSS                 |
| JWT tokens                    | 🟢              | N/A         | 🟡  | Auth system exists        |

---

## Layer 8: Multi-Agent Intelligence

| Capability               | Target platform | MiniMax 2.7 | TNF | Gap                                 |
| ------------------------ | --------------- | ----------- | --- | ----------------------------------- |
| Agent collective (swarm) | 🟢              | 🟢          | 🟢  | 42+ agents defined                  |
| Skill bank (cross-LLM)   | 🟢              | N/A         | 🟢  | Claude + TNF + Gemini banks         |
| Federated inference      | 🟢              | N/A         | 🟡  | MCP bridge but no routing           |
| Task decomposition       | 🟢              | 🟢          | 🟢  | planning-with-files skill           |
| Self-improvement loop    | 🟢              | 🟢          | 🟢  | Continuous Improver agent           |
| Memory across sessions   | 🟢              | 🟢          | 🟢  | Git + handoff_notes                 |
| Goal decomposition       | 🟢              | 🟢          | 🟢  | BMAD + Manus planning               |
| Autonomous execution     | 🟢              | 🟢          | 🟢  | Jules agent + Master Clock          |
| Hierarchical task queues | 🟢              | 🟢          | 🟢  | Priority + voting system            |
| Agent specialization     | 🟢              | 🟢          | 🟢  | Role-based agents                   |
| Knowledge sharing        | 🟢              | N/A         | 🟡  | Skill bank but no knowledge graph   |
| Emergent coordination    | 🟢              | N/A         | 🟡  | Channel-based, no explicit protocol |

---

## Top Priority Gaps (P0)

### 1. 🔴 NO zo.space equivalent

TNF has no managed hosting for React/Hono routes. Every agent needs CloudRuntime
manually configured. **Action**: Build `TNF Hosted Spaces` — see
`docs/TNF_HOSTED_SPACES_ARCHITECTURE.md`

### 2. 🔴 No vector storage

AI agents need RAG. Currently no vector DB. **Action**: Add Meilisearch or
Qdrant to docker-compose. Create MCP tool for embedding search.

### 3. 🟡 MiniMax streaming not implemented

ai.controller.ts only does non-streaming. MiniMax benefits from streaming.
**Action**: Add `stream: true` to buildTextPayload. Implement SSE endpoint.

### 4. 🟡 Agent persona/memory not persisted

Agents have defaults but no runtime personality or memory. **Action**: Create
AgentPersonaService + AgentMemoryService in backend.

### 5. 🟡 Rate limiting

No API rate limiting — security and cost risk. **Action**: Add rate-limit
middleware to API gateway.

### 3. Memory & Knowledge

| Feature             | Target platform + MiniMax 2.7 | TNF                                                                                           | Status   | Notes                                                                                                  |
| ------------------- | ----------------------------- | --------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------ |
| Vector storage      | ✅ pgvector + embeddings      | ✅ pgvector + `AgentProfileVectorService`                                                     | 🟢 MATCH | Full RAG pipeline with IVFFlat index, chunked agent profiles, semantic discovery via `screenInquiry()` |
| Agent memory        | ✅ Session + filesystem       | ✅ `tnf_agent_definitions` + vectorized profile chunks (summary/capabilities/metadata/prompt) | 🟢 MATCH | TNF's agent memory is semantically queryable via cosine similarity                                     |
| Long-term context   | ✅ 1M token (MoE)             | ⚠️ Limited by context window                                                                  | 🟡 GAP   | Lightning Attention principles could extend TNF context                                                |
| Knowledge retrieval | ✅ Semantic search            | ✅ `similaritySearch()` + `searchByText()`                                                    | 🟢 MATCH | gRPC vector store client, OpenAI embeddings                                                            |

---

## Subagent Reports Pending

| Subagent                | Mission                                     | Status     |
| ----------------------- | ------------------------------------------- | ---------- |
| Feature Parity Analyzer | Compare TNF vs Target platform capabilities | ⏳ Pending |
| MiniMax 2.7 Deep Dive   | Lightning Attention + MoE integration       | ⏳ Pending |
| Federation Architect    | TNF ↔ Target platform inter-op protocol     | ⏳ Pending |
| Security Auditor        | Security posture vs threats                 | ⏳ Pending |

---

_Generated by CTO Agent — Target platform Computer + MiniMax 2.7_ _Last Updated:
2026-03-23_
