# 👑 TNF MASTER INVENTORY MATRIX

This is the canonical "List of Lists" for the TNF ecosystem. It maps assets,
history, and conceptual relationships to evolve prioritization and resource
allocation.

## 📦 1. CODEBASE ASSETS (Local)

| Asset Name     | Path                                                          | Primary Purpose             | Status             |
| :------------- | :------------------------------------------------------------ | :-------------------------- | :----------------- |
| **TNF Core**   | `/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse` | Multi-agent platform core   | Active / Evolving  |
| **OpenClaw**   | `~/.openclaw`                                                 | Master Orchestrator         | Active / Mesh      |
| **SkIDEancer** | `.../apps/skideancer-ide`                                     | Agentic IDE                 | Maintenance        |
| **LDS Index**  | Cloudflare D1                                                 | Living Documentation System | 1,993 Docs Indexed |

### 🛠️ UI Component Audit & Consolidation

**Status: Phase 2 (Inputs & Cards) - 28+ FILES MIGRATED**

**Migrated to Premium Components:** | Category | Files Migrated |
|----------|----------------| | **Metrics/Charts** | `performance-metrics.tsx`,
`SystemMetrics.tsx`, `system-metrics.tsx`, `metrics/PerformanceMetrics.tsx` | |
**Voice/Multi-Modal** | `voice-control.tsx`, `multi-modal-interaction.tsx`,
`voice-controlled-commander.tsx` | | **Workflow Nodes** | `input-node.tsx`,
`agent-node.tsx`, `loop-node.tsx`, `notification-node.tsx`, `output-node.tsx`,
`mcp-tool-node.tsx`, `a2a-node.tsx` | | **Chat/Communication** |
`chat-room.tsx`, `ChatRoom.tsx`, `AgentChatRoom.tsx`, `webhook-manager.tsx` | |
**Agent Management** | `agent-selector.tsx`, `AgentMarketplace.tsx`,
`agent-collaboration-dashboard.tsx`, `agent-training-arena.tsx`,
`gpu-manager.tsx` | | **Dashboards** | `UserDashboard.tsx`, `llm-selector.tsx` |
| **Modals** | `Modals/ManageWorkspace/index.tsx` | | **Pipeline** |
`pipeline-node.tsx` |

**Remaining:** ~40 Card files, ~20 Input files (71 total Card, 36 total Input)

## ☁️ 2. INFRASTRUCTURE & FOOTPRINT

### 🟢 OpenClaw Mesh (4-Node) - ALL HEALTHY

| Node                | Endpoint                                                 | Role        | Status     |
| ------------------- | -------------------------------------------------------- | ----------- | ---------- |
| **Local Primary**   | ws://127.0.0.1:18789                                     | Development | 🟢 Healthy |
| **Cloud Primary**   | https://openclaw-cloud-production-934c.up.railway.app    | Production  | 🟢 Healthy |
| **Cloud Secondary** | https://openclaw-primary-production.up.railway.app       | Backup      | 🟢 Healthy |
| **Cloud Sandbox**   | https://openclaw-sandbox-cloud-production.up.railway.app | Playwright  | 🟢 Healthy |

### TNF Services (Railway)

| Resource       | Provider   | Endpoint                                       | Status    |
| :------------- | :--------- | :--------------------------------------------- | :-------- |
| **TNF SaaS**   | Railway    | `thenewfuse.com`                               | 🟢 Active |
| **API**        | Railway    | `api.thenewfuse.com`                           | 🟢 Active |
| **OC Runtime** | Cloudflare | `tnf-agent-orchestration.bizsynth.workers.dev` | 🟢 Active |
| **Redis**      | Railway    | Internal                                       | 🟢 Active |
| **Postgres**   | Railway    | Internal                                       | 🟢 Active |

### 📉 3. RESOURCE ALLOCATION & PRIORITIZATION

| Priority     | Task Cluster       | Primary Resource | Status                       |
| :----------- | :----------------- | :--------------- | :--------------------------- |
| **Critical** | Mesh Stabilization | Railway / Cloud  | ✅ COMPLETE                  |
| **High**     | UI Branding        | Local / IDE      | Phase 2 ACTIVE (28+ files)   |
| **Medium**   | LDS Consolidation  | Cloudflare / D1  | 6.8% fragmentation reduction |
| **Ongoing**  | Command Center     | Frontend         | **LIVE LANDMARK**            |

### 🔒 TNF Integrated Permission System (2026-02-14 4:10PM)

- **Core Integration**: `packages/core/src/security/permission-manager.ts`
- **Membership Sync**: Tied to TNF `UserRole` and `SubscriptionTier` enums.
- **Enforcement**: Integrated into `MemoryManager.ts` search logic.
- **Roles Supported**: SUPER_ADMIN, AGENCY_OWNER, ADMIN, AGENCY_ADMIN,
  AGENCY_MANAGER, AGENT_OPERATOR, USER.
- **Tiers Supported**: ENTERPRISE, PRO, STARTER.

### 🤖 Multi-Agent Coordination

- **Green Channel**: LIVE on Fuse Connect federated UI
- **Gemini Browser Agent**: Online in side panel for web task delegation
- **Jules API**: `https://jules.googleapis.com/v1alpha/` (Programmatic PR
  automation)
- **Keyboard Shortcuts**: `?` help overlay implemented.
