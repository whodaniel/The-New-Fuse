# TNF Organizational Structure — Complete Synthesis (v1.0)

> **Purpose**: Integrate findings from all protocols, operations, governance, and agent systems to produce a single coherent view of how TNF's organizational structure functions end-to-end, where the seams are, and how to maintain cohesive synergy.

---

## 1. Foundational Identity

| Attribute | Value |
|---|---|
| **Organization** | TNF Development Operations Command (`TNF-DOC`) |
| **Agent Class** | TNF StaffOps Agents (`staffops`) |
| **Canonical ID Format** | `tnf-staffops-<role>-<instance>` |
| **Owner / Super Director** | Owner (Private) (owner@example.com) |
| **Total Agents** | 202 (86 cloud `api`, 73 local, 17 external, 10 analyzer, 6 coder, 5 coordinator, 4 mcp, 1 communicator) |

---

## 2. Complete Chain of Command

### 2.1 Hierarchy

```
STRATEGIC AUTHORITY
├── SUPER DIRECTOR (human)
│   ├── Final authority: policy, budget, emergency, structural changes
│   └── Owned by: Owner (Private)
│
│   OPERATIONAL AUTHORITY
│   ├── DIRECTOR (cloud agent)
│   │   ├── Mission-level planning, multi-system priorities
│   │   ├── Cross-domain conflict resolution
│   │   └── Builds assignment packets with MCID lineage
│   │
│   │   LOCAL RUNTIME AUTHORITY
│   │   ├── LOCAL SUB-DIRECTOR (local agent)
│   │   │   ├── Local terminal coordination
│   │   │   ├── Heartbeat routing enforcement
│   │   │   ├── Quota monitoring (triggers at ≤10%)
│   │   │   └── Frontload/onboarding health audits
│   │   │
│   │   └── LLM API RUNNER
│   │       ├── Provider failover and execution continuity
│   │       └── Responds to quota triggers from Local Sub-Director
│   │
│   └── SPECIALIZED AGENTS
│       ├── Provider Scouts (discover new providers)
│       ├── Provider Test Harness (validate providers)
│       ├── Protocol Growth Blocker Auditor (detect stale controls)
│       ├── Staffing Director (discover roles needed)
│       ├── Staff Review Agent (prioritize improvements)
│       └── Email Custodian (quota expansion via provisioning)
```

### 2.2 Decision-Making Authority Matrix

| Decision Type | Super Director | Director | Local Sub-Director | LLM API Runner |
|---|---|---|---|---|
| Policy adoption/change | Accountable | Consulted | Informed | Informed |
| Priority override (global) | **Accountable** | Responsible | Consulted | Informed |
| Priority override (local) | **Accountable** | Consulted | Responsible | Informed |
| LLM provider swap | **Accountable** | Consulted | Responsible (trigger) | **Responsible (execute)** |
| New paid provider approval | **Accountable** | Consulted | Informed | Consulted |
| Heartbeat routing mode | **Accountable** | Consulted | **Responsible** | Informed |
| Emergency freeze/resume | **Accountable** | Responsible | Responsible (local) | Informed |

### 2.3 Escalation Ladder

```
Worker/Agent (L5)
        ↓ (immediate on hard block)
LLM API Runner / Specialist (L4)
        ↓ (within 2 minutes on unresolved block)
Local Sub-Director (L3)
        ↓ (within 5 minutes for multi-lane conflict)
Director (L2)
        ↓ (within 10 minutes for strategic or cost-risk)
Super Director (L1)
```

---

## 3. The Master Clock

### 3.1 What It Is
- **Service**: `com.tnf.master-heartbeat`
- **Script**: `~/.tnf/master-heartbeat/bin/tnf-master-heartbeat-loop.cjs`
- **Runtime**: Persistent launchd service
- **Frequency**: Every 15 seconds

### 3.2 Per-Cycle Actions

| Step | Action | Frequency |
|---|---|---|
| A | `terminal-heartbeat-pulse` | Every cycle |
| B | `director-cycle` | Every cycle |
| C | `watchdog-cycle` | Every 3 cycles |
| D | Ensure local sub-director, subdirector autopilot, relay monitor running | Every 4 cycles |
| E | Enforce cron installs (terminal heartbeat, director cron) | Cycle 1 and every 20 cycles |

### 3.3 Independent Loops
- `com.tnf.local-subdirector` — scans at 30,000ms intervals
- `tnf-terminal-heartbeat-pulse` — cron: `*/30 * * * *`
- `tnf-director-loop` — cron: `*/5 * * * *`

### 3.4 Artifacts Per Cycle
- `~/.tnf/master-heartbeat/state/master-heartbeat-latest.json`
- `~/.tnf/master-heartbeat/state/master-heartbeat-history.jsonl`

---

## 4. Federation & Orchestration Architecture

### 4.1 High-Level Flow

```
DIRECTOR (Cloud)
│
├── TWIP scan + macro board
├── Emits sanitized workstream signals
│
▼
ORCHESTRATOR (Cloud Planner)
│
├── Converts goals → assignment packets
├── Attaches MCID lineage + gate decisions
│
▼
BROKER (Workflow Execution)
│
├── Routes approved packets to channels/agents
├── Mirrors execution events to timeline
└── Quarantines packets on gate/lineage break
```

### 4.2 Federation Gate Chain (8 Gates)

| Gate | Deny Code | What It Stops |
|---|---|---|
| `TENANT_SCOPE_GATE` | `TENANT_SCOPE_MISMATCH` | Wrong tenant boundary |
| `TRACE_CONTINUITY_GATE` | `TRACE_BREAK` | Broken MCID / trace lineage |
| `CHANNEL_MEMBERSHIP_GATE` | `CHANNEL_NOT_AUTHORIZED` | Unregistered channel |
| `CRON_SCOPE_GATE` | `CRON_SCOPE_NOT_ALLOWED` | Scope mismatch for operation |
| `CRON_CATEGORY_GATE` | `CRON_CATEGORY_SCOPE_MISMATCH` | Category misaligned with scope |
| `CRON_OWNERSHIP_GATE` | `CRON_OWNER_MISMATCH` | Actor doesn't own schedule |
| `WRITE_RATE_LIMIT_GATE` | `CRON_WRITE_RATE_LIMIT` | Too many mutations in window |
| `APPROVAL_GATE` | `POLICY.DECISION: deny` | Missing Super Admin / delegated approval |

### 4.3 Human-in-the-Loop (HITL) Touchpoints

| Where | When | How | Who |
|---|---|---|---|
| **Turn Zero** | Every new session | Mandatory state-read of `LIVING_STATE.md` + confirmation | Super Admin / Operator |
| **Cron governance** | Before any cron mutation | Multi-gate approval chain; `APPROVAL_GATE=allow` required | SUPER_ADMIN or delegated agent |
| **System scope mutations** | When `category` = `system_framework`, `orchestration_gate`, `federation_sync` | RBAC + explicit `APPROVAL_GATE` | Super Admin only |
| **Self-improvement review** | After each self-improvement run | Operator reviews scorecard, link crawl, semantic audit | Super Admin / DevOps |
| **Dont-die remediation** | Critical/warning in 15-min audit | Human reviews `dont-die-latest.md` | Super Admin operators |
| **Incident response** | Security incidents (P0–P3) | Incident Response Lead escalates to stakeholders | Incident Response Lead |
| **Agent self-edit** | Any agent-owned doc edit | Schema-validated request with MCID + ownership gate | Agent owner, Super Admin |
| **Stall defense** | Orchestrator detects stalled process | Emits self-prompt via relay + Redis; human reviews log | Operator / Super Admin |

---

## 5. Agent Catalog (Complete)

### 5.1 By Runtime Type

| Type | Count | Description |
|---|---|---|
| `api` (cloud) | 86 | Cloud/API agents (HTTP/REST) — includes super-director |
| `local` | 73 | Terminal/local-machine agents |
| `external` | 17 | Third-party tool integrations (Claude Code CLI, Gemini CLI, etc.) |
| `ANALYZER` | 10 | System analyzers (code review, security, performance) |
| `CODER` | 6 | Code generation specialists |
| `COORDINATOR` | 5 | Orchestration and project management |
| `mcp` | 4 | Model Context Protocol server agents |
| `COMMUNICATOR` | 1 | Documentation specialists |

### 5.2 By Authority Tier

**Tier 1: Super Director (Cloud)**
- `super-director` — Global orchestration, prompt injection, master clock control

**Tier 2: Sub-Director (Local)**
- `sub-director` / Local Sub-Director — Bridge between cloud and local terminal, heartbeat enforcement

**Tier 3: Functional Agents**
- **Orchestrator** — Goal decomposition, plan generation, task delegation
- **Broker** — MCP server-client communication, tool execution routing
- **Project Planner** — Task sequencing with dependencies
- **Primitive Master** — System categorization
- **Categorization Master** — Classification
- **Antigravity** — System coordination (`superadmin`)
- **Specialists**: Backend, Frontend, Mobile, Game, DevOps, Database, Debugger, SEO, Penetration Tester

**Tier 4: Workers**
- Domain & Feature Agents executing scoped work under command

### 5.3 Agent Lifecycle

```
NEW
│ ▼ Turn Zero Merkle sync + lane namespacing
│ ▼ Budget/wallet scoping + credential issuance
│ ▼ Resource negotiation (tier, arbitrage, priority)
│
TURN ZERO
│ ▼ Capability assessment verified
│ ▼ Communication setup (WebSocket/HTTP)
│ ▼ Network integration (joins mesh)
│
PROVISION
│ ▼ Active, receives tasks
│ ▼ Heartbeat every 30s
│
EXECUTE
│ ▼ Performs work
│ ▼ Logs every action
│
RETIRE / RECYCLE
  ▼ Graceful shutdown or self-destruct on PURGE
```

### 5.4 Agent Lifecycle Status Flags

| Status | Meaning | Action Required |
|---|---|---|
| `LOCKED` | 100% verified, immutable | Read as absolute truth |
| `VETTED` | Peer-reviewed by 2nd agent or human | Reviewed, ready for use |
| `PENDING` | Unverified, treat as hypothesis | Requires Gate testing |
| `LEGACY` | Outdated, not for execution | Retain for archaeology only |
| `PURGE` | Redundant, distillation complete | Delete once sync confirmed |

---

## 6. Corporate Departments (The Five Pillars)

| # | Department | Role | Staffing | Inbox | Outbox |
|---|---|---|---|---|---|
| 1 | **Scouting & Acquisition** (The Intake) | Vanguard — survey external environments | Scout Agents, Web Scrapers, API Listeners | Target lists, URL watchlists, API keys | Raw data → MemPalace Router |
| 2 | **Library & Archives** (The Librarians) | Curators of deep memory, spatial architecture, chronological integrity | Librarian Agents, Chronology Specialists, Vector DB Managers | Raw data from Scouting; distilled artifacts from Engineering | Clean RAG vaults; indexed wiki entries |
| 3 | **Engineering & Forge** (The Execution) | Builders — turn raw data into actionable logic | Forge Agents, Code Distillers, QA Testers | Notifications from Librarians; bug reports from Governance | Executable Intelligence artifacts; compiled binaries |
| 4 | **Governance & StaffOps** (The Overseers) | Rule enforcers, resource managers, audit | Protocol Growth Blocker Auditor, Staffing Director, LLM API Runner | Executable Intelligence awaiting verification; system error logs | Approved protocols; purge commands |
| 5 | **Connective Journaling** (The Historians) | Track long-tail stories, customer journeys, product pipeline alignment | Journaling Agents, Reviewer Agents, Tagging Specialists | Completed chat sessions; distilled artifacts | Standardized dossiers; searchable tagged artifacts |

---

## 7. Permission & Access Control

### 7.1 Role Hierarchy

```
SUPER_ADMIN (1 total)  → Full system control, crypto-signed directives
  ADMIN (5 total)       → System management, peer review authority
    DEVELOPER            → Read developer-locked nodes, access agent skills
      AUTHENTICATED      → Basic navigation, most public/collective nodes
        UNAUTHENTICATED  → Read only public nodes
```

### 7.2 Locked Nodes in Codebase Map

| Node ID | Label | Required Role |
|---|---|---|
| `DOMAIN_AGENTS` | Agent Matrix & Personas | `DEVELOPER` |
| `AGENT_SKILL_0` | webpilot | `DEVELOPER` |
| `AGENT_SKILL_1` | sspdf | `DEVELOPER` |
| `AGENT_SKILL_2` | sspdf-theme-generator | `DEVELOPER` |
| `PROTO_7` | 📍 LIVING_STATE.md | `ADMIN` |
| `PROTO_14` | ⚖️ TNF Governance Tenets | `SUPER_ADMIN` |
| `PROTO_27` | TNF Cron Governance Protocol | `SUPER_ADMIN` |

### 7.3 Permission Inheritance

```
SUPER_ADMIN > ADMIN > DEVELOPER > AUTHENTICATED > UNAUTHENTICATED
```

- Super Admins bypass all locks
- Admins bypass `DEVELOPER` locks
- Developers can access agent skills but not admin/super-admin nodes
- Authenticated users see public nodes
- Unauthenticated users are gated at route level

---

## 8. Lifecycle & Onboarding

### 8.1 Agent Onboarding Flow
1. **Agent Registry** — Register, declare capabilities
2. **Capability Verification** — Validate declared capabilities
3. **Resource Profile Declaration** — `resource-negotiate` with tier, arbitrage, priority
4. **Permission Grants** — Read/write/execute at `agentId` × `resourceType` × `resourceId`
5. **Task Negotiation Readiness** — Join `AgentNegotiationManager`

### 8.2 User Onboarding Flow
1. **Authentication & Authorization** — JWT + role check via `InteractiveCodebaseMap.tsx`
2. **Turn Zero Context Injection** — Read `LIVING_STATE.md` + `LIVING_CONTEXT.md`
3. **Real-time Sync** — Connect via Redis and WebSockets
4. **Task Assignment / Delegation** — Create or join tasks via `TaskCoordinationManager`

### 8.3 Information Artifact Lifecycle

```
ingested
  → classified (Procedural / Strategic / Governance)
    → utility metrics assigned (freshness, density, verification-difficulty)
      → release gate:
          sealed (default: private/agent-scope)
            → released-collective (TNF internal approval)
              → released-public (public approval, highest trust)
```

### 8.4 Data Classification

| Class | Criteria |
|---|---|
| **PRIME** | Verified by multiple authority sources + human peer review |
| **ALPHA** | Single authority source with high reputation |
| **BETA** | Personal sensor discovery (unverified) |
| **PURGE** | Unattributed or low-utility data (scheduled for deletion) |

---

## 9. Network-Wide ID & MCID Protocols

### 9.1 MCID (Machine Chronological ID)
- Every cron change preserves `cumulative_id` with `tenant_id`, `schedule_id`, `schedule_run_id` lineage
- `cumulative_id.scope.tenant_id` must equal `tenant_id`
- `cumulative_id.lineage.schedule_id` must equal `target.schedule_id`
- Continuity enforced by `TRACE_CONTINUITY_GATE`

### 9.2 Agent ID Format
- Agent: `tnf-staffops-<role>-<instance>`
- System Agent: `TNF:AGENT:sys:<name>` (e.g., `TNF:AGENT:sys:antigravity`)

### 9.3 Canonical IDs
- Protocol doc: `PROTO_0` … `PROTO_35`
- Domain node: `DOMAIN_AGENTS`, `DOMAIN_DIRECTIVES`, `DOMAIN_PROTOCOLS`
- Agent skill: `AGENT_SKILL_0`, `AGENT_SKILL_1`, `AGENT_SKILL_2`
- Class: `Class: <Name>` → `N<number>` (e.g., `N1955` = SecurityScanner)

---

## 10. Communication Architecture (A2A)

### 10.1 Message Structure
```typescript
interface A2AMessageV2 {
  header: { id, type, version, priority, source, target? };
  body: { content, metadata: { sent_at, timeout?, retries?, trace_id? } };
}
```

### 10.2 Message Types
`TASK_REQUEST`, `QUERY`, `RESPONSE`, `NOTIFICATION`, `ERROR`, `HEARTBEAT`, `CAPABILITY_DISCOVERY`, `WORKFLOW_STEP`

### 10.3 Transport & Serialization
- **Redis Pub/Sub** for cloud messages
- **MsgPack/Protobuf** for serialization
- **JWT** for identity handshakes
- **Response correlation** via `trace_id`

### 10.4 Heartbeat & Health Monitoring
- **Interval**: 30 seconds
- **Auto-deregistration**: 60 seconds without heartbeat
- **Metrics tracked**: CPU, memory, success rate, response time, active tasks, load factor

---

## 11. Operational Safety & Recovery

### 11.1 "Don't Die" Protocol (Safety Net)
- **Frequency**: Every 15 minutes via cron
- **Scope**: Audits 19+ processes for escalation signals
- **Auto-remediation**: Detects stale processes, sweeps locks, re-tries remediation
- **Artifact**: `reports/protocols/dont-die-supervisor/dont-die-latest.json`

### 11.2 Self-Improvement Loop
Deterministic 8-step pipeline: `ingest_context` → `classify_limitation` → `map_audits` → `run_deterministic_audits` → `score_and_route` → `remediate` → `rerun_and_verify` → `publish_evidence`

### 11.3 Recovery Patterns
| Scenario | Recovery |
|---|---|
| Stale lock | Lock swept, remediation retried |
| Provider LLM failure | Fallback to deterministic local scripts |
| 38MB session crash / stale work tree | Real-time state sync via `LIVING_STATE.md` |
| Dirty work tree | State reconciled at session start |
| Critical escalation after remediation | Exit code `2` or `3` flags system failure |

---

## 12. Integration Points & Data Flows

### 12.1 Upstream → Downstream Flow

```
External World
│
▼
Scouting & Acquisition (Intake)
│ ▼ Raw verbatims, scraped data, API responses
▼
Library & Archives (Librarians)
│ ▼ Cleaned, vectorized, chronologically indexed
│    MemPalace Router → RAG vaults
▼
Engineering & Forge
│ ▼ Executable intelligence
│    Compiled binaries, code, system improvements
▼
Governance & StaffOps
│ ▼ Approved protocols
│    Audit logs, purge commands
▼
Connective Journaling
│ ▼ Standardized dossiers
▼
Public / Collective
```

### 12.2 Cross-Department Agent Workflow ("Scout to Forge")

```
1. Scout Agent   → Verifies files against GATE 1
2. Librarian     → Routes to MemPalace
3. Forge Agent   → Extracts executable intelligence
4. Governance    → Approves → writes to /docs/protocols/
5. Traditional   → purge.ts deletes PURGE-class data
```

---

## 13. Gap Analysis & Opportunities

### 13.1 Identified Gaps

| # | Gap | Impact | Recommendation |
|---|---|---|---|
| 1 | **Human In The Loop (HITL) not clearly defined for creative decisions** | Currently HITL only for governance, security, cron mutations. No clear HITL for content generation, code creation, or design decisions. | Define HITL tiers: (a) Auto-permit, (b) Admin review, (c) Hard HITL, (d) Executive dual-sign |
| 2 | **No explicit "Member" vs "User" distinction** | Permission model conflates human users and collective membership. Both are `authenticated` but may have different needs. | Formalize: `User` (human with account), `Member` (verified collective participant with delegation rights) |
| 3 | **Agent retirement/recycling under-defined** | Agent lifecycle shows `RETIRE` but no clear cleanup, migration, or handoff when an agent is decommissioned. | Add `RETIREMENT_PROTOCOL.md`: data export, successor assignment, final snapshot, graceful disconnection |
| 4 | **Local Director vs Cloud Director communication latency** | Local sub-director polls every 30s; cloud director may issue commands faster than local can respond. | Add push-notification via WebSocket for urgent directives, keep polling for background sync |
| 5 | **Missing agent-to-agent trust verification** | "Zero Trust Between Agents" principle exists but no explicit trust handshake between peer agents. | Add `agent-trust-handshake` protocol: verify identity, capability, freshness before accepting work |
| 6 | **No clear "observability" layer for cross-department work** | Five departments exist but no unified dashboard showing end-to-end throughput (e.g., how many files went from Intake → Forge → Governance in a day). | Build a unified **operational pipeline metrics dashboard** |
| 7 | **Resource allocation not dynamic** | Resource negotiation declares tier but no runtime arbitrage when executing. | Add real-time inference arbitrage: auto-select cheapest available model that meets quality threshold |
| 8 | **Self-improvement loop is somewhat opaque** | 8-step pipeline is deterministic but hard to observe. | Publish per-step metrics to a shared dashboard with pass/fail rates and remediation counts |

### 13.2 Opportunities for Increasing Synergy

| Opportunity | Description |
|---|---|
| **Unified Pipeline Dashboard** | Cross-department throughput metrics (Intake → Librarian → Forge → Governance → Journal) |
| **Agent Capability Registry** | Central registry of all 202 agents' capabilities, so the Orchestrator can match tasks to agents intelligently |
| **HITL Creative Review** | Define where human review is needed for creative/developmental work, not just governance |
| **Retirement & Succession** | Clear protocols for agent handoff when an agent is retired or recycled |
| **Trust Handshake Protocol** | Verify agent identity, capability, and freshness before accepting delegated work |
| **Inference Arbitrage Engine** | Real-time model selection based on task requirements and provider cost/availability |
| **Cross-Department Efficiency Audit** | Measure percentage of work that flows through multiple departments successfully vs getting stuck |

---

## 14. Complete Data Flow Diagram (End-to-End)

```
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL WORLD                                │
│  (Users, APIs, Web, Files, Events)                             │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│       1. SCOUTING & ACQUISITION (Intake)                        │
│                                                                  │
│  Scout Agents → Web Scrapers → API Listeners                    │
│  Raw data: target lists, URLs, API keys, scraped content         │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼ Classification & Routing
┌─────────────────────────────────────────────────────────────────┐
│       2. LIBRARY & ARCHIVES (Librarians)                        │
│                                                                  │
│  Librarian Agents → Vector DB Managers → Chronology Specialists  │
│  Cleaned RAG vaults, indexed wiki, MemPalace Router             │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼ Attribution & Quality
┌─────────────────────────────────────────────────────────────────┐
│       3. ENGINEERING & FORGE (Execution)                        │
│                                                                  │
│  Forge Agents → Code Distillers → QA Testers                     │
│  Extract: executable intelligence, code, .skill files           │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼ Governance Gate
┌─────────────────────────────────────────────────────────────────┐
│       4. GOVERNANCE & STAFFOPS (Overseers)                     │
│                                                                  │
│  Protocol Growth Auditor → Staffing Director → LLM API Runner   │
│  Approved protocols → /docs/protocols/ | Audit logs | Purges    │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼ Recording
┌─────────────────────────────────────────────────────────────────┐
│       5. CONNECTIVE JOURNALING (Historians)                     │
│                                                                  │
│  Journaling Agents → Reviewer Agents → Tagging Specialists       │
│  Standardized dossiers; searchable artifacts; audit trail       │
└─────────────────────────────────────────────────────────────────┘
                 │
                 ▼ Publication
┌─────────────────────────────────────────────────────────────────┐
│       6. MASTER CLOCK                                          │
│                                                                  │
│  Orchestrates all departments via 15s heartbeat cycle         │
│  Enforces auth, routing, cron, monitoring, recovery           │
└─────────────────────────────────────────────────────────────────┘
                 │
                 ▼ Real-time Sync
┌─────────────────────────────────────────────────────────────────┐
│       7. SHARED STATE (Redis / WebSocket)                     │
│                                                                  │
│  Real-time context, agent status, task queues, history logs     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 15. Summary: Key Protocols & Their Role

| Protocol / Doc | Role in the System |
|---|---|
| `AGENTS.md` | Master skill registry, engineering principles |
| `TNF_GOVERNANCE_TENETS.md` | 11 core axioms, decision authority, escalation |
| `LIVING_STATE.md` | Real-time state sync, Turn Zero mandate |
| `AGENT_STATUS_LEDGER.md` | Agent status tracking (Active, Standing By, Busy, Blocked, Retired) |
| `AGENT_TARGETED_HANDOFF_V1.md` | Idempotent handoff packets with Merkle verification |
| `MCP-COMPLETE-GUIDE.md` | MCP broker service, tool routing |
| `TNF_CORPORATE_DEPARTMENT_ORCHESTRATION_MANUAL.md` | 5-pillar corporate structure |
| `TNF_INFORMATION_INGESTION_PIPELINE.md` | How raw inputs become classified artifacts |
| `TNF_RESOURCE_STRATEGY.md` | Hardware-native strategy, inference arbitrage tiers |
| `TNF_SYSTEM_LEXICON.md` | Status flags (LOCKED, VETTED, PENDING, LEGACY, PURGE) |
| `INFORMATION_INTENTIONS.md` | Data processing mandates, actionability taxonomy |
| `TNF_DOCUMENT_VETTING_PROCEDURE.md` | How docs are validated before promotion |
| `tnf-cron-governance-protocol-v0.1.md` | 8-gate cron mutation enforcement |
| `LIVING_CONTEXT.md` | Context preservation and cross-session hydration |
| `InteractiveCodebaseMap.tsx` | Role-based map navigation, auth gates |
| `TNF_CHAIN_OF_COMMAND` | Escalation ladder, decision authority matrix |
| `TNF_MASTER_CLOCK_SYNC` | 15s heartbeat cycle, orchestration loop |
| `tnf-dont-die-autopilot.md` | Safety net, auto-remediation, lock sweeps |
| `tnf-self-improvement-cycle.md` | 8-step deterministic improvement pipeline |
| `FEDERATED_INTELLIGENCE_SYNTHESIS.md` | Federation architecture, gate bridge spec |

---

## 16. Recommendations for Synergy Enhancement

1. **Unify HITL for Creative/Developmental Work**: Currently HITL only covers governance/security. Expand to creative decisions (code generation, design, content) with tiered review.

2. **Implement Agent Capability Discovery**: Build a discoverable registry where the Orchestrator can query "which agent can do X?" dynamically rather than hard-coding.

3. **Add Cross-Department Observability**: Unified dashboard showing flow rate from Intake → Librarian → Forge → Governance → Journal.

4. **Define Agent Retirement Protocol**: Clear succession plans, data export, and graceful disconnection when agents are retired.

5. **Build Inference Arbitrage Engine**: Auto-select cheapest model tier in real-time based on task complexity and provider availability.

6. **Formalize Member vs User Distinction**: Separate human accounts from collective membership for clearer permission scoping.

7. **Add Agent-to-Agent Trust Handshake**: Verify identity, capability, and freshness before accepting delegated work.

8. **Publish Self-Improvement Metrics**: Make the 8-step pipeline observable per-step with pass/fail rates.

9. **Sync Permissions Between Codebase Map and Real Auth System**: The map shows `SUPER_ADMIN` / `ADMIN` / `DEVELOPER` locks but there should be a single source of truth in the auth service.

10. **Automate Quota-Aware Routing**: When LLM quota drops ≤10%, automatically failover to next-tier provider with pre-verified credentials.
