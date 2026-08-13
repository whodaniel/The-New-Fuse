# TNF Browser Hub - Strategic Integration Plan

## Executive Summary

This document outlines the strategic approach for integrating all TNF framework
features into the Browser Hub, creating a unified premium desktop experience
that serves as the command center for the entire platform.

---

## 🎯 Core Philosophy

The Browser Hub should be the **single pane of glass** for:

1. **AI Agent Management** - Create, configure, and monitor agents
2. **Workflow Orchestration** - Build and execute automated workflows
3. **MCP Tool Integration** - Access all MCP servers and tools
4. **Communication Hub** - A2A messaging and relay connections
5. **Development Tools** - IDE, terminal, and debugging

---

## 📦 TNF Framework Components to Integrate

### Tier 1: Essential (Must Have)

| Component            | Package                           | Integration Approach                      |
| -------------------- | --------------------------------- | ----------------------------------------- |
| **Agent Management** | `@the-new-fuse/agent`             | Sidebar panel for agent CRUD + monitoring |
| **Workflow Engine**  | `@the-new-fuse/workflow-engine`   | Embedded visual workflow builder          |
| **Prompt Templates** | `@the-new-fuse/prompt-templating` | Already integrated, enhance UI            |
| **MCP Core**         | `@the-new-fuse/mcp-core`          | Tool discovery + execution panel          |
| **Relay Core**       | `@the-new-fuse/relay-core`        | Connection status + message routing       |

### Tier 2: Important (Should Have)

| Component           | Package                         | Integration Approach                   |
| ------------------- | ------------------------------- | -------------------------------------- |
| **A2A Protocol**    | `@the-new-fuse/a2a-core`        | Agent-to-agent communication dashboard |
| **Feature Tracker** | `@the-new-fuse/feature-tracker` | Development progress visibility        |
| **Monitoring**      | `@the-new-fuse/core-monitoring` | System health dashboard                |
| **Security**        | `@the-new-fuse/security`        | Authentication + permissions UI        |

### Tier 3: Nice to Have

| Component         | Package                                                        | Integration Approach            |
| ----------------- | -------------------------------------------------------------- | ------------------------------- |
| **UI Components** | `@the-new-fuse/ui-consolidated`                                | Consistent styling              |
| **API Client**    | `@the-new-fuse/api-client`                                     | Backend communication           |
| **Integrations**  | `@the-new-fuse/resource-registry` + `@the-new-fuse/api-client` | Third-party service connections |

Sunset note (2026-05-17): `@the-new-fuse/monitoring` and
`@the-new-fuse/integrations` were removed from the active workspace and replaced
by the packages above.

---

## 🏗️ Proposed Browser Hub Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            BROWSER HUB SHELL                                │
├────────────────┬────────────────────────────────────────────────────────────┤
│                │                                                            │
│   SIDEBAR      │                    MAIN CONTENT                            │
│   ────────     │                    ────────────                            │
│                │  ┌─────────────────────────────────────────────────────┐  │
│  🏠 Dashboard  │  │                                                     │  │
│  🤖 Agents     │  │              TABBED CONTENT AREA                    │  │
│  ⚡ Workflows   │  │                                                     │  │
│  🔧 MCP Tools  │  │   - Web Browser (iframes/webviews)                  │  │
│  💬 Messages   │  │   - Agent Panels                                    │  │
│  📊 Monitoring │  │   - Workflow Editor                                 │  │
│  🧩 Extensions │  │   - Settings                                        │  │
│  ⚙️ Settings   │  │                                                     │  │
│                │  └─────────────────────────────────────────────────────┘  │
│  ──────────    │                                                            │
│  Quick Links   │  ┌─────────────────────────────────────────────────────┐  │
│  Custom Links  │  │                STATUS BAR                           │  │
│                │  │  Relay: ● Connected  │  Agents: 5  │  CPU: 12%      │  │
└────────────────┴──┴─────────────────────────────────────────────────────┴──┘
```

---

## 🔌 Integration Implementation Plan

### Phase 1: Agent Management Panel (Week 1)

**Goal**: Full agent CRUD operations from Browser Hub

```javascript
// New sidebar item
<div class="nav-item" onclick="openAgentPanel()">
  <i class="fas fa-robot"></i>
  <span>Agents</span>
  <span class="badge">5</span>
</div>

// Agent Panel Features:
// - List all agents with status indicators
// - Create new agent wizard
// - Configure agent capabilities
// - View agent logs/history
// - Start/stop/restart agents
```

**Backend Integration**:

- IPC: `agents:list`, `agents:create`, `agents:configure`, `agents:start`,
  `agents:stop`
- Connect to `apps/backend` agent endpoints

### Phase 2: Workflow Integration (Week 2)

**Goal**: Visual workflow builder embedded in Browser Hub

```javascript
// Workflow Panel Options:
// 1. Embed React workflow builder in iframe (localhost:3000/workflows/builder)
// 2. Native canvas-based workflow editor
// 3. Hybrid: Show workflow list, open builder in new tab

// Recommended: Option 1 (fastest) or Option 3 (cleanest UX)
```

**Features**:

- Workflow library panel
- Quick-run workflows
- Workflow execution status
- Variable input forms

### Phase 3: MCP Tool Discovery (Week 3)

**Goal**: Browse and execute MCP tools from Browser Hub

```javascript
// MCP Panel Features:
// - List connected MCP servers
// - Browse available tools per server
// - Execute tools with parameter forms
// - View tool execution results
// - Favorites/pinned tools
```

**Backend Integration**:

- IPC: `mcp:list-servers`, `mcp:list-tools`, `mcp:execute-tool`
- Connect to MCP Core package

### Phase 4: A2A Communication Hub (Week 4)

**Goal**: Real-time agent messaging dashboard

```javascript
// A2A Panel Features:
// - Connected agents list
// - Live message stream
// - Send messages to agents
// - Conversation history
// - Message routing controls
```

**Backend Integration**:

- WebSocket connection to Relay Server
- IPC: `a2a:send-message`, `a2a:get-history`

---

## 🎨 UI/UX Considerations

### Sidebar Design

```
COMPACT MODE (collapsed):
┌──────┐
│ 🏠   │  Dashboard
│ 🤖   │  Agents
│ ⚡   │  Workflows
│ 🔧   │  Tools
│ 💬   │  Messages
│ ───  │  ─────────
│ 🧩   │  Extensions
│ ⚙️   │  Settings
└──────┘

EXPANDED MODE:
┌────────────────┐
│ 🏠 Dashboard   │
│ 🤖 Agents (5)  │
│ ⚡ Workflows    │
│ 🔧 MCP Tools   │
│ 💬 Messages    │
│ ──────────────│
│ 🧩 Extensions  │
│ ⚙️ Settings    │
└────────────────┘
```

### Panel Types

1. **Slide-out Panels** (right side): Settings, Extensions, Quick Actions
2. **Tab Content**: Full-screen experiences (Workflows, Agent Details)
3. **Modal Dialogs**: Confirmations, Quick Forms
4. **Toast Notifications**: Status updates

---

## 🔐 Security Considerations

1. **Authentication Flow**:
   - Browser Hub checks auth status on load
   - Redirects to login if not authenticated
   - Stores tokens securely in Electron's safeStorage

2. **Permission System**:
   - Role-based access to features
   - Agent execution permissions
   - Workflow approval workflows

3. **Data Isolation**:
   - Each user sees only their agents/workflows
   - Shared resources clearly marked

---

## 📊 Success Metrics

| Metric                  | Target                           |
| ----------------------- | -------------------------------- |
| **Feature Parity**      | 100% of SaaS features accessible |
| **Load Time**           | < 2 seconds to interactive       |
| **Memory Usage**        | < 500MB baseline                 |
| **User Actions/Minute** | > 10 (highly usable)             |

---

## 🚀 Implementation Priority

1. ✅ **Core UI** - Completed (Dec 17, 2024)
2. ⏳ **Agent Panel** - Next priority
3. ⏳ **MCP Tools Panel** - High priority
4. ⏳ **Workflow Integration** - Medium priority
5. ⏳ **A2A Messaging** - Medium priority
6. ⏳ **Monitoring Dashboard** - Lower priority

---

## 📝 Next Immediate Actions

1. **Create Agent Management Panel** in Browser Hub
2. **Add IPC handlers** in main.ts for agent operations
3. **Connect to backend API** for agent data
4. **Add status indicators** for all TNF services
5. **Implement unified notification system**

---

_Document Created: December 17, 2024_ _Version: 1.0_
