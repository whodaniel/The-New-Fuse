# TNF Resource Registry - Comprehensive Typed Index

## Overview

This is the **master index of all TNF resources**, broken down by type with full
metadata. This registry is continuously updated by the CodebaseIndexer agent and
serves as the **source of truth** for what exists in the TNF ecosystem.

---

## 🤖 Agent Types

### 1. **Jules CLI Agent**

**Type**: Command-line interface agent  
**Spawnable**: YES (multiple parallel instances)  
**Location**: `packages/agent/src/jules/`  
**Capabilities**:

- Code analysis
- File operations
- Terminal command execution
- Parallel task processing

**Metadata**:

```json
{
  "agentType": "jules-cli",
  "version": "1.0.0",
  "maxParallelInstances": 10,
  "spawnPolicy": "on-demand",
  "defaultCapabilities": [
    "code-analysis",
    "file-operations",
    "terminal-execution"
  ],
  "resourceRequirements": {
    "cpu": "low",
    "memory": "medium",
    "diskIO": "high"
  },
  "lifecycle": {
    "startupTime": "< 2s",
    "shutdownGracePeriod": "5s",
    "heartbeatInterval": "5s"
  }
}
```

**Spawn Example**:

```typescript
const julesInstance = await lifecycleManager.spawnAgent({
  role: 'jules-cli',
  capabilities: ['code-analysis', 'file-operations'],
  autoStart: true,
});
```

---

### 2. **Browser Automation Agent**

**Type**: Web browser controller  
**Spawnable**: YES (one per browser session)  
**Location**: `.agent/skills/browser-automation/`  
**Capabilities**:

- Chrome control
- Web scraping
- Form filling
- Inter-LLM communication (via extension)

**Metadata**:

```json
{
  "agentType": "browser-automation",
  "version": "1.0.0",
  "maxParallelInstances": 5,
  "spawnPolicy": "session-based",
  "defaultCapabilities": [
    "browser-control",
    "web-scraping",
    "gemini-communication"
  ],
  "dependencies": ["chrome-browser", "fuse-connect-extension"],
  "lifecycle": {
    "startupTime": "< 5s",
    "requiresPreFlight": true,
    "preFlightChecks": ["chrome-running", "extension-loaded"]
  }
}
```

---

### 3. **Relay Communication Agent**

**Type**: Message routing coordinator  
**Spawnable**: NO (singleton)  
**Location**: `packages/relay-core/`  
**Capabilities**:

- WebSocket relay management
- Channel orchestration
- Message routing
- Inter-agent communication

**Metadata**:

```json
{
  "agentType": "relay-coordinator",
  "version": "1.0.0",
  "maxParallelInstances": 1,
  "spawnPolicy": "singleton",
  "defaultCapabilities": [
    "relay-management",
    "channel-routing",
    "message-broadcast"
  ],
  "ports": [3001],
  "lifecycle": {
    "startupTime": "< 1s",
    "criticalService": true
  }
}
```

---

### 4. **Orchestrator Agent (TNF Core)**

**Type**: Master coordinator  
**Spawnable**: NO (singleton, always running)  
**Location**: `apps/backend/src/modules/orchestrator/`  
**Capabilities**:

- Task routing
- Agent lifecycle management
- Heartbeat monitoring
- System orchestration

**Metadata**:

```json
{
  "agentType": "orchestrator-master",
  "version": "1.0.0",
  "maxParallelInstances": 1,
  "spawnPolicy": "always-on",
  "defaultCapabilities": [
    "task-routing",
    "agent-management",
    "health-monitoring",
    "system-coordination"
  ],
  "ports": [3000],
  "lifecycle": {
    "startupTime": "< 3s",
    "criticalService": true,
    "autoRestart": true
  }
}
```

---

### 5. **CodebaseIndexer Agent** (NEW)

**Type**: Continuous codebase analyzer  
**Spawnable**: YES (one per analysis task)  
**Location**: TBD (will create)  
**Capabilities**:

- Code parsing
- AST analysis
- Dependency graphing
- Synergy detection
- Resource cataloging

**Metadata**:

```json
{
  "agentType": "codebase-indexer",
  "version": "1.0.0",
  "maxParallelInstances": 3,
  "spawnPolicy": "cron-based",
  "defaultCapabilities": [
    "code-parsing",
    "ast-analysis",
    "dependency-mapping",
    "synergy-detection"
  ],
  "schedule": {
    "fullIndex": "0 0 * * *", // Daily midnight
    "incrementalIndex": "*/30 * * * *", // Every 30min
    "synergyAnalysis": "0 */6 * * *" // Every 6hr
  },
  "lifecycle": {
    "startupTime": "< 10s",
    "executionTimeout": "30m"
  }
}
```

---

## 🌐 External Resources

### Vital Websites

#### 1. **Anthropic Documentation**

**URL**: https://docs.anthropic.com  
**Type**: API Documentation  
**Update Frequency**: Weekly  
**Monitored For**:

- New features
- API changes
- Best practices
- Protocol updates

**Metadata**:

```json
{
  "resourceType": "documentation",
  "vendor": "Anthropic",
  "criticality": "high",
  "monitoringAgent": "web-scraper",
  "checkFrequency": "daily",
  "lastChecked": "2025-12-28T03:00:00Z",
  "changeDetection": {
    "method": "content-hash",
    "alertOn": ["api-change", "breaking-change"]
  }
}
```

#### 2. **Google Gemini API Docs**

**URL**: https://ai.google.dev/docs  
**Type**: API Documentation  
**Update Frequency**: Bi-weekly  
**Monitored For**:

- Gemini protocol changes
- New capabilities
- Rate limit changes

**Metadata**:

```json
{
  "resourceType": "documentation",
  "vendor": "Google",
  "criticality": "high",
  "monitoringAgent": "web-scraper",
  "checkFrequency": "daily"
}
```

#### 3. **Railway Status**

**URL**: https://railway.app/status  
**Type**: Service Status  
**Update Frequency**: Real-time  
**Monitored For**:

- Outages
- Maintenance windows
- Performance degradation

**Metadata**:

```json
{
  "resourceType": "status-page",
  "vendor": "Railway",
  "criticality": "critical",
  "monitoringAgent": "uptime-monitor",
  "checkFrequency": "every-5-minutes",
  "alerting": {
    "onOutage": true,
    "onMaintenance": true
  }
}
```

#### 4. **npm Registry**

**URL**: https://registry.npmjs.org  
**Type**: Package Registry  
**Update Frequency**: Continuous  
**Monitored For**:

- Security updates for dependencies
- Breaking changes
- Deprecation warnings

**Metadata**:

```json
{
  "resourceType": "package-registry",
  "vendor": "npm",
  "criticality": "high",
  "monitoringAgent": "dependency-checker",
  "checkFrequency": "daily",
  "trackedPackages": [
    "@anthropic-ai/sdk",
    "@modelcontextprotocol/sdk",
    "ioredis",
    "bullmq"
  ]
}
```

---

## 📊 Visualizers

### 1. **Agent Network Visualizer**

**Type**: Real-time network graph  
**Location**: `packages/ui-consolidated/src/components/visualizers/AgentNetwork.tsx`  
**Purpose**:
Show agent connections, message flow, task delegation  
**Data Source**: Redis pub/sub + AgentInbox stats  
**Update Frequency**: Real-time (WebSocket)

**Metadata**:

```json
{
  "visualizerType": "network-graph",
  "framework": "React + D3.js",
  "dataSource": "redis-pubsub",
  "updateMethod": "websocket",
  "interactivity": ["zoom", "drag", "click-details"],
  "exportFormats": ["svg", "png", "json"]
}
```

**Integration Opportunities**:

- Show task flow from Router → Agent Inbox
- Highlight overloaded agents (> 50 pending tasks)
- Visualize delegation chains
- Display heartbeat status per agent

---

### 2. **System Health Dashboard**

**Type**: Metrics dashboard  
**Location**: `packages/ui-consolidated/src/components/visualizers/HealthDashboard.tsx`  
**Purpose**:
System-wide health metrics  
**Data Source**: OrchestratorService + HeartbeatMonitoringService  
**Update Frequency**: Every 5 seconds

**Metadata**:

```json
{
  "visualizerType": "metrics-dashboard",
  "framework": "React + Recharts",
  "dataSource": "orchestrator-api",
  "metrics": [
    "active-agents",
    "stalled-agents",
    "failed-agents",
    "tasks-per-second",
    "avg-task-duration",
    "inbox-load-distribution"
  ]
}
```

**Integration Opportunities**:

- Add inbox load metrics (pending tasks per agent)
- Show task delegation rate
- Display codebase index freshness
- Alert on synergy opportunities detected

---

### 3. **Codebase Synergy Map**

**Type**: Dependency + synergy graph  
**Location**: TBD (NEW - will create)  
**Purpose**: Visualize code dependencies + detected synergies  
**Data Source**: CodebaseIndexer agent  
**Update Frequency**: On-demand + daily

**Metadata**:

```json
{
  "visualizerType": "synergy-graph",
  "framework": "React + Cytoscape.js",
  "dataSource": "codebase-indexer",
  "features": [
    "dependency-graph",
    "synergy-highlighting",
    "refactor-suggestions",
    "duplicate-detection"
  ]
}
```

**What It Will Show**:

- Packages/modules as nodes
- Dependencies as edges
- **Detected synergies** highlighted in green
- **Duplicated functionality** highlighted in yellow
- **Unused code** highlighted in red
- **Suggested integrations** with dashed edges

---

## 🔍 High-Level Audit Criteria

### 1. **Synergy Opportunities**

- **Duplicate functionality** across packages
  - Example: Multiple HTTP clients (consolidate to one)
  - Example: Multiple logging implementations
- **Complementary capabilities** that could be integrated
  - Example: Browser automation + Relay communication = Inter-LLM messenger
  - Example: Jules CLI + Codebase Indexer = Automated refactoring
- **Shared dependencies** that could be factored out
- **Cross-cutting concerns** that need centralized handling

### 2. **Architecture Consistency**

- **Naming conventions** - Are they consistent?
- **Error handling patterns** - Standardized?
- **TypeScript usage** - Proper typing everywhere?
- **API design** - RESTful? Consistent? Documented?

### 3. **Performance Opportunities**

- **Redundant processing** - Same data processed multiple times?
- **Cacheable operations** - What should be cached?
- **Parallelization opportunities** - What can run in parallel?
- **Bottlenecks** - Where are the slowest parts?

### 4. **Security & Best Practices**

- **Environment variables** - Properly managed?
- **Secrets** - Encrypted and stored correctly?
- **Input validation** - Everywhere it's needed?
- **Rate limiting** - On external APIs?

### 5. **Documentation Coverage**

- **README files** - Up to date?
- **JSDoc comments** - On public APIs?
- **Architecture diagrams** - Current and accurate?
- **Onboarding docs** - Complete?

---

## 📁 Resource Types Taxonomy

```typescript
type ResourceType =
  | 'agent' // Agent instances
  | 'service' // Backend services
  | 'package' // npm packages (internal)
  | 'dependency' // npm packages (external)
  | 'api-endpoint' // HTTP/WebSocket endpoints
  | 'database' // Database tables/schemas
  | 'queue' // Bull queues
  | 'channel' // Redis channels
  | 'skill' // Agent skills
  | 'context' // Agent contexts
  | 'prompt' // Prompt templates
  | 'visualizer' // UI visualizers
  | 'external-site' // Monitored websites
  | 'configuration' // Config files
  | 'workflow'; // Defined workflows

interface Resource {
  id: string;
  type: ResourceType;
  name: string;
  location: string;
  metadata: Record<string, any>;
  relationships: {
    dependsOn: string[]; // Resource IDs this depends on
    usedBy: string[]; // Resource IDs that use this
    synergizesWith: string[]; // Detected synergy opportunities
  };
  health: {
    status: 'healthy' | 'degraded' | 'failed' | 'unknown';
    lastChecked: Date;
    issues: string[];
  };
  metrics: {
    usageFrequency: 'high' | 'medium' | 'low';
    lastUsed: Date;
    performanceScore: number; // 0-100
  };
}
```

---

## 🔄 Continuous Indexing Process

### Daily (Full Index)

```
12:00 AM → CodebaseIndexer spawns
  ↓
Parse entire codebase
  ↓
Build dependency graph
  ↓
Detect all resources
  ↓
Analyze for synergies
  ↓
Update registry
  ↓
Generate report → Inbox
  ↓
Shutdown
```

### Every 30 Minutes (Incremental)

```
XX:00, XX:30 → CodebaseIndexer spawns
  ↓
Check git diff since last index
  ↓
Parse changed files only
  ↓
Update affected resources
  ↓
Quick synergy check
  ↓
Update registry (delta)
  ↓
Shutdown
```

### Every 6 Hours (Synergy Analysis)

```
00:00, 06:00, 12:00, 18:00 → CodebaseIndexer spawns
  ↓
Load full resource graph
  ↓
Run synergy detection algorithms
  ↓
Compare with previous analysis
  ↓
Generate synergy opportunities report
  ↓
Send to inbox of designated architect agent
  ↓
Shutdown
```

---

## 📍 Registry Storage

**Location**: Redis + JSON files

### Redis Keys:

```
registry:resources:{type}:{id} → Resource JSON
registry:index:{type} → SET of resource IDs
registry:relationships:{id} → Relationship data
registry:synergies → ZSET (score = opportunity value)
registry:last-index → Timestamp
```

### JSON Files (Backup):

```
.agent/registry/
├── agents.json
├── services.json
├── packages.json
├── visualizers.json
├── external-sites.json
├── synergies.json
└── metadata.json
```

---

## 🎯 Next Steps

1. **Create CodebaseIndexer Agent**
2. **Implement Resource Registry**
3. **Build Synergy Analyzer**
4. **Create Codebase Synergy Map Visualizer**
5. **Set up continuous indexing cron jobs**
6. **Integrate with existing visualizers**

---

**Version**: 1.0  
**Last Updated**: Dec 28, 2025  
**Maintained By**: CodebaseIndexer Agent (automated)
