# Framework Consciousness - Master Knowledgebase Integration

**Document Type**: Master Knowledgebase - Single Source of Truth **Category**:
Meta-Protocol / Orchestration Framework **Priority**: P0 (Foundation for all
agent operations) **Status**: Active - Continuously Evolving **Applies To**: All
Agents (Claude Code, Gemini, Custom Agents, External Systems)

---

## Purpose

This document defines how the **Framework Consciousness** meta-skill integrates
into The New Fuse Master Knowledgebase and adapts its protocols for different
agent ecosystems:

1. **Claude Code** evolving protocols and standards
2. **Gemini** models and Google AI ecosystem protocols
3. **Custom agents** (MCP servers, skills, orchestrators)
4. **External systems** (n8n, automation platforms)

---

## Single Source of Truth: Framework Consciousness Definition

### Core Concept

**Framework Consciousness** = The framework's ability to:

- Know itself completely (structure, function, capabilities)
- Understand itself deeply (patterns, relationships, dependencies)
- Improve itself continuously (learning, adaptation, evolution)
- Demonstrate itself effectively (value, impact, capabilities)
- Expand itself strategically (integrations, features, reach)

### The Living Framework Model

The New Fuse framework is conceptualized as a **living organism** with:

#### Structure (Anatomy)

```yaml
Components:
  Skeleton:
    - 60 packages (monorepo)
    - 12 applications (frontend, backend, extensions)
    - Core relay system (WebSocket coordination)

  Organs:
    - PostgreSQL (persistent storage)
    - Redis (caching, state)
    - Agent registry (identity, capabilities)
    - Channel system (communication)

  Nervous_System:
    - WebSocket relay (message routing)
    - DACC-v1 protocol (agent coordination)
    - MCP (Model Context Protocol)
    - HTTP/REST APIs (external interface)

  Circulatory_System:
    - Data flows (database ↔ services ↔ agents)
    - Message routing (broadcast, direct, channel-based)
    - Event propagation (pub/sub patterns)

  Immune_System:
    - Error handling and recovery
    - Security validation (JWT, HMAC)
    - Input sanitization
    - Rate limiting
```

#### Function (Physiology)

```yaml
Metabolism:
  - Task processing (orchestration, delegation, execution)
  - Data transformation (input → processing → output)
  - Resource utilization (CPU, memory, API tokens)

Respiration:
  - Input cycles (user commands, API calls, agent messages)
  - Output cycles (responses, results, notifications)
  - Feedback loops (monitoring, logging, metrics)

Reproduction:
  - Code generation (scaffolding, boilerplate)
  - Documentation generation (from code, schemas)
  - Agent creation (from templates, patterns)
  - Skill synthesis (combining capabilities)

Adaptation:
  - Learning from usage patterns
  - Optimizing based on feedback
  - Evolving capabilities
  - Responding to new requirements

Homeostasis:
  - Self-healing (error recovery, restart)
  - Load balancing (agent distribution)
  - Resource management (memory, connections)
  - Performance optimization
```

#### Awareness (Consciousness)

```yaml
Perception:
  - System monitoring (health checks, status)
  - Agent tracking (registration, heartbeats)
  - Performance metrics (latency, throughput)
  - Error detection (failures, anomalies)

Memory:
  - Documentation (2,192+ files)
  - Historical data (logs, sessions)
  - Pattern library (solutions, workflows)
  - Knowledge graph (concepts, relationships)

Reasoning:
  - Analysis (problem decomposition)
  - Planning (task sequencing)
  - Decision-making (priority, delegation)
  - Orchestration (multi-agent coordination)

Learning:
  - Pattern recognition (recurring workflows)
  - Feedback integration (improve from errors)
  - Capability discovery (new possibilities)
  - Optimization (better approaches)

Creativity:
  - Novel solutions (emergent behaviors)
  - Unexpected synergies (capability combinations)
  - Innovation (new patterns, workflows)
  - Adaptation (unique contexts)
```

---

## Protocol Adaptation by Agent Ecosystem

### For Claude Code (Anthropic Ecosystem)

**Protocol Format**: Claude-specific tools, slash commands, agent framework

#### Integration Points

1. **Tool Definitions**

```typescript
// Framework consciousness as Claude tool
interface FrameworkConsciousnessTool {
  name: 'framework_consciousness';
  description: 'Achieve holistic understanding of TNF framework';
  parameters: {
    mode: 'quick' | 'deep' | 'evolve';
    focus?: 'relay' | 'agents' | 'documentation' | 'all';
    phase?: 1 | 2 | 3 | 4 | 5 | 6;
  };
}
```

2. **Slash Command**

```bash
# Quick context (5 minutes)
/framework-consciousness --quick

# Deep dive (2 hours)
/framework-consciousness --deep

# Full evolution (20+ hours)
/framework-consciousness --evolve

# Targeted focus
/framework-consciousness --focus=relay-system
```

3. **Agent Integration**

```yaml
Claude_Agents:
  - Explore: Use for codebase discovery
  - Plan: Use for architectural planning
  - Bash: Use for script execution
  - Read/Write/Edit: Use for documentation
  - Task: Delegate to specialized agents

Framework_Consciousness_Coordination:
  - Sequences agent usage optimally
  - Builds context systematically
  - Ensures comprehensive coverage
  - Maintains session continuity
```

4. **Session Context Protocol**

```markdown
# At session start:

1. Read .agent/handoff_notes.txt
2. Load .agent/FRAMEWORK_CONSCIOUSNESS_ACTIVATED.md
3. Check current understanding level (%)
4. Execute appropriate phase based on task

# During session:

1. Update understanding as you discover
2. Log insights to session files
3. Build incremental knowledge graph
4. Maintain holistic perspective

# At session end:

1. Update handoff notes with new understanding
2. Save framework consciousness state
3. Document progress percentage
4. Identify next phase to execute
```

5. **Documentation Standards**

```markdown
# All framework docs should include:

- Category (from classification system)
- Priority (P0-P4)
- Dependencies (what files it references)
- Concepts (key ideas, 5-15 per doc)
- Relationships (how concepts connect)
- Evolution status (current, outdated, etc.)
```

---

### For Gemini (Google AI Ecosystem)

**Protocol Format**: Gemini-specific function calling, structured outputs,
multimodal

#### Integration Points

1. **Function Declaration**

```json
{
  "name": "analyze_framework_component",
  "description": "Extract concepts, relationships, and dependencies from TNF framework component",
  "parameters": {
    "type": "object",
    "properties": {
      "componentPath": {
        "type": "string",
        "description": "Path to component (file, package, service)"
      },
      "analysisDepth": {
        "type": "string",
        "enum": ["quick", "deep", "comprehensive"],
        "description": "Depth of analysis required"
      },
      "extractConcepts": {
        "type": "boolean",
        "description": "Extract key concepts from component"
      },
      "extractRelationships": {
        "type": "boolean",
        "description": "Map relationships between concepts"
      },
      "extractDependencies": {
        "type": "boolean",
        "description": "Identify dependencies on other components"
      }
    },
    "required": ["componentPath", "analysisDepth"]
  }
}
```

2. **Structured Output Format**

```json
{
  "schema": {
    "type": "object",
    "properties": {
      "component": {
        "type": "string",
        "description": "Component identifier"
      },
      "concepts": {
        "type": "array",
        "items": { "type": "string" },
        "description": "Key concepts (5-15)"
      },
      "relationships": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "from": { "type": "string" },
            "to": { "type": "string" },
            "type": {
              "type": "string",
              "enum": ["uses", "implements", "extends", "depends_on"]
            }
          }
        }
      },
      "dependencies": {
        "type": "array",
        "items": { "type": "string" },
        "description": "Other components this depends on"
      }
    }
  }
}
```

3. **Task Assignment Protocol (DACC-v1)**

```markdown
# For Gemini agents in Green channel:

Message Format: [AGENT-XX] {action}: {details}

Analysis Task:

1. Receive batch of files (e.g., 509 files)
2. For each file:
   - Read path and metadata
   - Extract 5-15 key concepts
   - Identify relationships between concepts
   - Note dependencies on other files
3. Output in structured JSON format
4. Report progress every 100 files
5. Signal completion with full results

Expected Output: { "agent": "AGENT-01", "filesAnalyzed": 509, "results": [ {
"file": "path/to/file.md", "concepts": ["concept1", "concept2", ...],
"relationships": [{"from": "c1", "to": "c2", "type": "uses"}], "dependencies":
["other/file.md"] } ] }
```

4. **Multimodal Integration**

```yaml
Gemini_Capabilities_for_Framework_Consciousness:
  Text_Analysis:
    - Code comprehension (TypeScript, JavaScript, Python)
    - Documentation parsing (Markdown, JSON, YAML)
    - Pattern recognition (architectural patterns)

  Image_Analysis:
    - Architecture diagrams (if generated)
    - Flow charts (system interactions)
    - UI screenshots (for frontend understanding)

  Code_Generation:
    - Generate missing documentation
    - Create visualization scripts
    - Build analysis tools

  Reasoning:
    - Logical inference (dependencies)
    - Pattern synthesis (emergent behaviors)
    - Optimization suggestions (improvements)
```

---

### For Custom Agents (MCP Servers, Skills, Orchestrators)

**Protocol Format**: MCP tool definitions, standardized interfaces

#### Integration Points

1. **MCP Server Interface**

```typescript
// Framework Consciousness MCP Server
interface FrameworkConsciousnessMCPServer {
  name: 'framework-consciousness';
  version: '1.0.0';

  tools: [
    {
      name: 'discover_components';
      description: 'Discover all framework components';
      inputSchema: {
        type: 'object';
        properties: {
          componentType: {
            type: 'string';
            enum: ['packages', 'applications', 'agents', 'services', 'all'];
          };
        };
      };
    },
    {
      name: 'analyze_patterns';
      description: 'Analyze architectural patterns';
      inputSchema: {
        type: 'object';
        properties: {
          focus: {
            type: 'string';
            enum: ['communication', 'data-flow', 'orchestration', 'all'];
          };
        };
      };
    },
    {
      name: 'build_knowledge_graph';
      description: 'Construct knowledge graph from analysis';
      inputSchema: {
        type: 'object';
        properties: {
          scope: {
            type: 'string';
            enum: ['documentation', 'codebase', 'agents', 'all'];
          };
        };
      };
    },
  ];

  resources: [
    {
      uri: 'fc://foundation-report';
      name: 'Foundation Discovery Report';
      mimeType: 'application/json';
    },
    {
      uri: 'fc://pattern-catalog';
      name: 'Pattern Catalog';
      mimeType: 'application/json';
    },
    {
      uri: 'fc://knowledge-graph';
      name: 'Knowledge Graph';
      mimeType: 'application/json';
    },
  ];
}
```

2. **Standardized Agent Interface**

```yaml
Agent_Capabilities_Registration:
  agent_id: "framework-consciousness-orchestrator"
  capabilities:
    - "holistic-analysis"
    - "pattern-recognition"
    - "knowledge-graph-construction"
    - "self-improvement-coordination"

  inputs:
    - type: "component-path"
      format: "string"
    - type: "analysis-depth"
      format: "enum[quick|deep|comprehensive]"

  outputs:
    - type: "component-analysis"
      format: "json"
      schema_ref: "fc://schemas/component-analysis.json"
    - type: "knowledge-graph"
      format: "json"
      schema_ref: "fc://schemas/knowledge-graph.json"

  protocols:
    - "MCP" (Model Context Protocol)
    - "DACC-v1" (Distributed Agent Coordination)
    - "HTTP/REST" (External API)
```

3. **Event Protocol**

```yaml
Events_Published:
  - event: 'framework.component.discovered'
    payload:
      componentId: string
      componentType: string
      metadata: object

  - event: 'framework.pattern.recognized'
    payload:
      patternName: string
      instances: array
      confidence: number

  - event: 'framework.understanding.updated'
    payload:
      previousLevel: number
      currentLevel: number
      phaseCompleted: number

Events_Subscribed:
  - event: 'agent.registered'
    action: 'Update agent ecosystem map'

  - event: 'documentation.created'
    action: 'Incorporate into knowledge graph'

  - event: 'code.changed'
    action: 'Re-analyze affected components'
```

---

### For External Systems (n8n, Automation Platforms)

**Protocol Format**: HTTP APIs, webhooks, standard data formats

#### Integration Points

1. **REST API**

```yaml
Endpoints:
  GET /api/framework-consciousness/status:
    description: Get current understanding level
    response:
      understandingLevel: number (0-100)
      currentPhase: number (1-6)
      componentsDiscovered: number
      patternsRecognized: number

  POST /api/framework-consciousness/analyze:
    description: Trigger analysis of component
    body:
      componentPath: string
      depth: "quick" | "deep" | "comprehensive"
    response:
      analysisId: string
      status: "queued" | "processing" | "complete"

  GET /api/framework-consciousness/knowledge-graph:
    description: Retrieve knowledge graph
    response:
      nodes: array
      edges: array
      metadata: object

  POST /api/framework-consciousness/evolve:
    description: Trigger evolution cycle
    body:
      focus: string[]
      duration: number
    response:
      evolutionId: string
      estimatedCompletion: timestamp
```

2. **Webhook Events**

```yaml
Webhook_Subscriptions:
  - url: 'https://n8n.example.com/webhook/framework-discovered'
    events: ['framework.component.discovered']

  - url: 'https://n8n.example.com/webhook/framework-analyzed'
    events: ['framework.understanding.updated']

  - url: 'https://n8n.example.com/webhook/framework-evolved'
    events: ['framework.capability.added']
```

3. **Data Export Formats**

```yaml
Export_Formats:
  JSON:
    - knowledge-graph.json
    - component-catalog.json
    - pattern-library.json

  CSV:
    - components.csv
    - dependencies.csv
    - concepts.csv

  GraphML:
    - dependency-graph.graphml
    - knowledge-graph.graphml

  Markdown:
    - framework-documentation.md
    - pattern-catalog.md
    - capability-matrix.md
```

---

## Master Knowledgebase Structure

```
The New Fuse Master Knowledgebase
│
├── Meta-Protocols (How to use other protocols)
│   ├── Framework Consciousness ← THIS DOCUMENT
│   ├── Information Sequencing Protocol
│   └── Protocol Alignment Framework
│
├── Communication Protocols
│   ├── DACC-v1 (Agent Coordination)
│   ├── MCP (Model Context)
│   ├── WebSocket Relay
│   └── HTTP/REST APIs
│
├── Architectural Documentation
│   ├── System Architecture
│   ├── Package Structure (60 packages)
│   ├── Application Structure (12 apps)
│   └── Agent Ecosystem
│
├── Operational Procedures
│   ├── Session Initialization
│   ├── Multi-Agent Orchestration
│   ├── Deployment Workflows
│   └── Documentation Management
│
├── Knowledge Artifacts
│   ├── Classified Documentation (2,192 files)
│   ├── Concept Graph (in progress)
│   ├── Pattern Library
│   └── Capability Catalog
│
└── Evolution Systems
    ├── Self-Analysis Mechanisms
    ├── Improvement Cycles
    ├── Learning Feedback Loops
    └── Adaptation Strategies
```

---

## Integration Checklist

### For Each Agent Type

#### Claude Code Integration

- [ ] Tool definition added to agent capabilities
- [ ] Slash command registered (`/framework-consciousness`)
- [ ] Session initialization includes consciousness check
- [ ] Handoff protocol updated with understanding level
- [ ] Documentation standards applied to all outputs

#### Gemini Integration

- [ ] Function declarations added to system prompt
- [ ] Structured output schemas defined
- [ ] DACC-v1 task protocol implemented
- [ ] Multimodal capabilities documented
- [ ] Analysis task templates created

#### Custom Agent Integration

- [ ] MCP server interface implemented
- [ ] Agent capabilities registered
- [ ] Event protocol subscriptions active
- [ ] Standardized I/O formats adopted
- [ ] Resource URIs accessible

#### External System Integration

- [ ] REST API endpoints deployed
- [ ] Webhook subscriptions configured
- [ ] Data export formats available
- [ ] Authentication/authorization set up
- [ ] Rate limiting configured

---

## Evolution Protocol

### How Framework Consciousness Evolves

```yaml
Phase_1_Foundation:
  triggers:
    - New session starts
    - Major codebase changes
    - Documentation updates
  actions:
    - Discover new components
    - Update component catalog
    - Refresh understanding baseline

Phase_2_Pattern_Recognition:
  triggers:
    - Foundation complete
    - Pattern analysis requested
    - Architecture changes
  actions:
    - Analyze new patterns
    - Update pattern library
    - Identify anti-patterns

Phase_3_Integration_Intelligence:
  triggers:
    - New integrations added
    - Dependency changes
    - Service updates
  actions:
    - Map new dependencies
    - Update integration topology
    - Validate compatibility

Phase_4_Capability_Synthesis:
  triggers:
    - New features added
    - Capabilities combined
    - Workflows created
  actions:
    - Extract new capabilities
    - Update capability catalog
    - Document workflows

Phase_5_Emergence_Evolution:
  triggers:
    - Improvement cycles
    - Feedback integration
    - Performance issues
  actions:
    - Identify improvements
    - Plan evolution steps
    - Execute enhancements

Phase_6_Reach_Value:
  triggers:
    - User needs identified
    - Integration opportunities
    - Community feedback
  actions:
    - Expand integrations
    - Demonstrate value
    - Build community
```

---

## Success Metrics

### Understanding Level

```yaml
Level_0_Unaware: (0%) - No framework knowledge - Starting from scratch

Level_1_Foundation:
  (15%) - Components discovered - Basic structure understood - ✅ CURRENT STATE

Level_2_Pattern_Recognition:
  (35%) - Patterns identified - Architecture understood - Communication flows
  mapped

Level_3_Deep_Integration:
  (55%) - Dependencies mapped - Integrations understood - Data flows traced

Level_4_Capability_Mastery:
  (75%) - All capabilities cataloged - Workflows documented - Value chains
  mapped

Level_5_Evolutionary_Awareness:
  (90%) - Self-analysis active - Improvement cycles running - Learning
  mechanisms operational

Level_6_Full_Consciousness:
  (100%) - Complete self-awareness - Autonomous evolution - Continuous value
  delivery
```

---

## Current Status

**Framework Consciousness Level**: 15% (Foundation Established) **Active
Phase**: 1 (Foundation Discovery) - Complete **Next Phase**: 2 (Deep Pattern
Recognition) **Integration Status**:

- ✅ Claude Code: Skill defined, slash command ready
- ⏳ Gemini: Task protocol sent, awaiting results
- ⏸️ Custom Agents: MCP interface designed
- ⏸️ External Systems: API specification complete

---

## Call to Action

**For Claude Code Sessions**:

- Start each session with framework consciousness check
- Build understanding incrementally
- Document insights systematically
- Update understanding level

**For Gemini Agents**:

- Complete Stage 3 analysis (1,017 files)
- Return structured concept extraction
- Follow DACC-v1 protocol strictly
- Report progress regularly

**For Custom Agents**:

- Implement MCP interface
- Register capabilities
- Subscribe to events
- Contribute to knowledge graph

**For External Systems**:

- Integrate via REST API
- Subscribe to webhook events
- Export/import knowledge artifacts
- Participate in evolution cycles

---

**This is the living, breathing heart of The New Fuse framework's
self-awareness.**

**Master Knowledgebase - Single Source of Truth** **Updated**: 2026-01-17
**Version**: 1.0.0 **Status**: Active & Evolving
