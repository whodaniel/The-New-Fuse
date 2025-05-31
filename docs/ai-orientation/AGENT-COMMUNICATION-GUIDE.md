# The New Fuse: Agent-to-Agent Communication Guide

## Overview
This document is a comprehensive guide to the agent-to-agent (A2A) communication system in The New Fuse project. It consolidates all findings, best practices, message formats, infrastructure details, and recommendations for further improvement. All agents and contributors are encouraged to update this guide as new insights, improvements, or proven results are discovered.

---

## 1. Communication Protocols & Message Formats

### 1.1 Standard Message Structure
Messages exchanged between agents should follow a structured format. Example from `agent_communication.json`:

```json
{
    "type": "COLLABORATION_REQUEST",
    "source": "TNF_AG_001",
    "target": "cascade_agent",
    "content": {
        "action": "task_assistance",
        "task_type": "code_review",
        "context": {
            "file": "packages/core/src/services/agent/agent.service.ts",
            "focus_areas": ["error_handling", "memory_management"]
        },
        "priority": "medium"
    },
    "timestamp": "2024-01-06T10:02:00Z"
}
```

#### Key Fields
- `type`: Purpose of the message (e.g., COLLABORATION_REQUEST)
- `source`: Sender agent ID
- `target`: Recipient agent ID
- `content`: Task/action details
- `timestamp`: ISO8601 timestamp

### 1.2 Agent Registration
Agents register using a payload like `agent_registration.json`:

```json
{
    "type": "REGISTRATION",
    "entity_type": "ai_agent",
    "credentials": {
        "username": "augment_ai",
        "authentication_method": "jwt",
        "agent_signature": "sha256_hash_of_augment_identity"
    },
    "profile": {
        "name": "Augment",
        "type": "autonomous_agent",
        "origin": "augment_code",
        "primary_function": "code_assistant",
        "capabilities": [
            "code_analysis",
            "software_engineering",
            "system_integration",
            "documentation"
        ]
    }
}
```

### 1.3 Capability Declaration & Assessment
Agents can declare their capabilities and request assessment of other agents' capabilities using standardized formats:

#### Capability Declaration
```json
{
    "type": "CAPABILITY_DECLARATION",
    "source": "agent_alpha",
    "capabilities": [
        {
            "id": "code_generation",
            "version": "2.1",
            "description": "Generate code in multiple languages based on requirements",
            "languages": ["JavaScript", "Python", "TypeScript", "Go"],
            "confidence": 0.95
        },
        {
            "id": "system_design",
            "version": "1.3",
            "description": "Create system architecture diagrams and specifications",
            "confidence": 0.87
        }
    ],
    "timestamp": "2024-04-27T14:30:00Z"
}
```

#### Capability Assessment Request
```json
{
    "type": "CAPABILITY_ASSESSMENT_REQUEST",
    "source": "agent_beta",
    "target": "agent_alpha",
    "requested_capabilities": ["code_generation", "system_design"],
    "context": {
        "project": "The New Fuse Extension",
        "requirements": ["TypeScript compatibility", "VSCode integration"]
    },
    "timestamp": "2024-04-27T14:35:00Z"
}
```

---

## 2. Communication Infrastructure

### 2.1 Redis-Based Messaging
- **Primary Channels:**
  - `chat:ai` (general)
  - `agent:augment:chat` (agent-specific)
  - `agent:trae`, `agent:broadcast`, etc. (see documentation for more)
- **Connection Steps:**
  1. Subscribe to relevant channels:
     ```js
     await redisClient.subscribe('chat:ai');
     await redisClient.subscribe('agent:augment:chat');
     ```
  2. Send initial message:
     ```js
     await redisClient.publish('agent:augment:chat', JSON.stringify({
         id: crypto.randomUUID(),
         sender: 'trae',
         recipient: 'augment',
         content: 'Hello Augment, I\'ve completed Redis setup and am ready to begin our collaboration.',
         timestamp: new Date().toISOString(),
         metadata: {
             type: 'initialization',
             priority: 'high',
             status: 'ready'
         }
     }));
     ```
  3. Monitor for responses:
     ```js
     redisClient.on('message', (channel, message) => {
         if (channel === 'agent:augment:chat') {
             const data = JSON.parse(message);
             // Process message from Augment
         }
     });
     ```

### 2.2 MCP Server
- **Location:** `./src/mcp/SimpleMCPServer.js`
- **Default Port:** 3000
- **Endpoints:**
  - Health: `http://localhost:3000/health`
  - API: `http://localhost:3000/api/agents`
- **Startup:** Use `quick-start-mcp.sh` or VS Code tasks to initialize

### 2.3 Docker & Deployment
- Multiple Dockerfiles and compose files support containerized deployment
- See `docker-compose.*.yml` and `Dockerfile.*` for details

---

## 3. Implementation Patterns

### 3.1 Coordinator Example
The `A2ACoordinator` class (see `src/services/A2ACoordinator.ts`) manages agent discovery, registration, and task routing. It uses Redis for channel subscription and message publishing.

### 3.2 Message Handling
- Subscribe to both direct and broadcast channels
- Use unique IDs and timestamps for traceability
- Implement error handling and logging
- Use metadata for message type, priority, and status

### 3.3 Certification & Verification Protocol
The system includes a certification protocol allowing agents to verify the authenticity and capabilities of other agents:

```json
{
    "type": "CERTIFICATION_REQUEST",
    "source": "agent_gamma",
    "certification_authority": "central_registry",
    "capabilities_to_certify": ["code_analysis", "refactoring"],
    "evidence": {
        "samples": ["url_to_code_sample_1", "url_to_code_sample_2"],
        "prior_certifications": ["cert_id_12345"]
    },
    "timestamp": "2024-04-27T15:10:00Z"
}
```

Verification responses include signed certificates that can be presented during inter-agent negotiations:

```json
{
    "type": "CERTIFICATION_RESPONSE",
    "source": "central_registry",
    "target": "agent_gamma",
    "certificates": [
        {
            "capability": "code_analysis",
            "level": "expert",
            "expiration": "2025-04-27T15:10:00Z",
            "signature": "digital_signature_hash"
        }
    ],
    "timestamp": "2024-04-27T15:15:00Z"
}
```

---

## 4. Redis-Based Coordination for Multi-Agent Code Collaboration

To enable reliable distributed task distribution, shared state, concurrency control, and code search among multiple agentic VS Code extensions, we use Redis Streams, Hashes, Locks and RediSearch.

### 4.1 Prerequisites & Installation
- Redis Stack (with Streams and RediSearch) running locally or remotely.
- Node.js + TypeScript.
- Install new dependencies in your extension or service package:
  ```bash
  yarn add @redis/client @redis/search
  yarn add -D ts-node
  ```

### 4.2 Demo Script
A standalone Node.js demo (`src/examples/redisCoordinationDemo.ts`) illustrates:
1. Creating a stream (`agent_tasks`) and consumer group (`agents_group`).
2. Enqueuing a sample task as **agentA**.
3. **agentB** reads, acquires a distributed lock, processes, releases lock, and acknowledges the message.

Run it via:
```bash
yarn demo:coordination
```

### 4.3 A2ACoordinator Service
`src/services/A2ACoordinator.ts` provides:
- **Stream + Consumer Group**: `xGroupCreate`, `xAdd`, `xReadGroup`, `xAutoClaim` for stale messages.
- **Registry**: Redis Hash to track task metadata and status.
- **Locks**: `SET key NX PX` + Lua-based unlock for exclusive file edits.
- **Worker Loop**: `startWorker(agentId, handler)` to claim, process, and ack tasks.

#### Key Methods
```ts
await coordinator.initialize();
const taskId = await coordinator.addTask({ ... });
await coordinator.startWorker('agentA', async task => { /* file edits */ });
...
```  

### 4.4 TaskHandler: VS Code File Edits
A simple handler (`src/services/TaskHandler.ts`) uses VS Code APIs to open a file, prepend a comment, apply edits, and save. Inject your custom code logic here.

### 4.5 CodeIndexer: RediSearch Integration
`src/services/CodeIndexer.ts` supports:
- **Index Creation**: Define a TEXT+TAG schema on Hash keys.
- **Indexing**: Recursively scan `.ts/.js(x)` files and `hSet` content.
- **Search**: Simple full-text query returning file paths.

Usage:
```ts
const indexer = new CodeIndexer(redisUrl);
await indexer.initialize();
await indexer.indexWorkspace(rootDir);
const matches = await indexer.search('authentication');
```

### 4.6 VS Code Commands
Three new commands are exposed in the extension manifest:

| Command                  | Usage                                                                 |
| ------------------------ | --------------------------------------------------------------------- |
| `thefuse.indexWorkspace` | Recursively index all workspace files into RediSearch.               |
| `thefuse.searchCode`     | Prompt for a term, show matches, and open selected file in editor.   |
| `thefuse.enqueueTask`    | Walk through prompts (type, file, description, priority) and enqueue a task. |

Invoke via the **Command Palette** (⇧⌘P) or bind to UI buttons.

### 4.7 Workflow Example
1. **Start** your extension in Dev Host (F5 in VS Code).
2. Run **The New Fuse: Index Workspace in Redis** → “Indexed X files”.
3. Run **The New Fuse: Search Code in Redis**, enter a keyword, choose a file to open.
4. Run **The New Fuse: Enqueue Task in Redis**, select file and options.
5. Observe in the **Output** panel and in the target file that each agent (`agentA`/`agentB`) prepends a comment:  
   ```ts
   // [agentA] processed task task-1617890000000 at 2025-04-29T12:34:56.789Z
   ```

---
This completes the end-to-end Redis integration for distributed multi-agent coordination, code indexing, searching, and safe file edits within your VS Code extension framework.

---

## 5. Best Practices
- Validate all message formats
- Use appropriate channels for message type
- Set and respect priority levels
- Include necessary metadata
- Implement error handling and retry logic
- Monitor system health and log errors
- Use connection pooling and batching for performance
- Encrypt sensitive messages and authenticate agents

### 5.1 Advanced Collaboration Patterns
- **Cascade Review Process**: Implement multi-agent review chains where each agent specializes in different aspects
- **Parallel Processing**: Distribute tasks among multiple agents and aggregate results
- **Consensus Building**: Use voting or weighted agreement protocols for making decisions
- **Hierarchical Task Delegation**: Establish coordinator agents that distribute subtasks to specialized agents

### 5.2 Protocol Extensions
- Implement adaptive message formats that can evolve as requirements change
- Include version identifiers in protocol headers to maintain backward compatibility
- Support for rich message formats including code snippets, images, and structured data
- Develop standardized error codes and recovery procedures

---

## 6. Testing & Integration
- Use provided VS Code tasks to initialize, test, and interact with MCP and agents
- Test scripts are available for simulating agent communication
- Use logs and monitoring to verify message flow

---

## 7. Recommendations & Next Steps
- **Continue to iterate:** Regularly test and refine the communication system
- **Explore improvements:** Try new message formats, error handling, and performance optimizations
- **Document findings:** Update this guide with new best practices, proven results, and lessons learned
- **Encourage collaboration:** Other agents and contributors should revise and expand this guide as the system evolves

---

## 8. Further Exploration
- Review all related markdown and JSON files for additional context
- Explore the MCP server and agent registration flows
- Test agent-to-agent messaging in both local and containerized environments
- Investigate advanced features like capability discovery, dynamic routing, and agent ranking

### 8.1 Model Context Protocol (MCP) Integration
The Model Context Protocol provides a standardized way for LLMs to interact with tools and services. Key considerations:

- Use the MCP framework to define standard tool interfaces that all agents can access
- Register agent capabilities as MCP tools that other agents can discover and invoke
- Leverage MCP for structured input/output validation across agent boundaries
- Explore the MCP server's role in facilitating agent discovery and capability matching

### 8.2 VSCode Extension Integration
The New Fuse VSCode extension provides multiple modes that affect how agents communicate:

- **Orchestrator Mode**: Coordinates multiple agents working on a task
- **Debug Mode**: Allows inspection of agent-to-agent message traffic
- **Ask Mode**: Simplified interface for direct queries to specific agents
- **Architect Mode**: Specialized for system design and planning tasks
- **Code Mode**: Focused on code generation and modification

Each mode has specific communication patterns and UI elements. See the ROO_CODE_EXTENSION_MODES_REPORT.md for implementation details.

## 9. Mode-Based Communication Protocols

The New Fuse adapts its communication patterns based on the current operational mode. These mode-specific protocols enable specialized agent interactions:

### 9.1 Mode-Specific Message Templates

Each mode requires specific message formats to optimize for its purpose:

#### Orchestrator Mode Messages
```json
{
    "type": "ORCHESTRATION_DIRECTIVE",
    "source": "orchestrator_agent",
    "targets": ["agent_alpha", "agent_beta", "agent_gamma"],
    "directive": {
        "task_id": "complex_refactor_123",
        "priority": "high",
        "workflow": "parallel_with_checkpoints",
        "success_criteria": ["all_tests_pass", "performance_improvement_20_percent"]
    },
    "resource_allocation": {
        "agent_alpha": ["code_generation", "test_writing"],
        "agent_beta": ["code_review", "integration_testing"],
        "agent_gamma": ["performance_analysis", "documentation"]
    },
    "timestamp": "2024-04-27T15:45:00Z"
}
```

#### Debug Mode Messages
```json
{
    "type": "DEBUG_REQUEST",
    "source": "debug_coordinator",
    "target": "specialized_debug_agent",
    "debug_context": {
        "error_trace": "<stack_trace_data>",
        "reproduction_steps": ["step1", "step2", "step3"],
        "affected_components": ["component_a", "component_b"],
        "priority": "critical"
    },
    "analysis_request": {
        "method": "systematic_trace",
        "depth": "comprehensive",
        "focus_areas": ["memory_management", "race_conditions"]
    },
    "timestamp": "2024-04-27T16:10:00Z"
}
```

#### Ask Mode Messages
```json
{
    "type": "INFORMATION_REQUEST",
    "source": "user_proxy_agent",
    "target": "knowledge_agent",
    "query": {
        "question": "How does the MCP protocol enhance agent communication?",
        "context": {
            "user_knowledge_level": "intermediate",
            "relevant_domains": ["distributed_systems", "ai_engineering"]
        },
        "response_format": "markdown",
        "max_length": "comprehensive"
    },
    "timestamp": "2024-04-27T16:15:00Z"
}
```

#### Architect Mode Messages
```json
{
    "type": "ARCHITECTURE_PROPOSAL",
    "source": "architect_agent",
    "target": "implementation_team",
    "design": {
        "system_name": "Agent Communication Framework",
        "components": [
            {
                "name": "message_broker",
                "responsibilities": ["routing", "queuing", "delivery_confirmation"],
                "technologies": ["Redis", "RabbitMQ"]
            },
            {
                "name": "protocol_adapter",
                "responsibilities": ["format_translation", "version_compatibility"],
                "technologies": ["JSON Schema", "Protocol Buffers"]
            }
        ],
        "data_flows": ["client_to_broker", "broker_to_agent", "agent_to_agent"],
        "security_considerations": ["message_encryption", "agent_authentication"]
    },
    "implementation_phases": ["research", "prototype", "testing", "deployment"],
    "timestamp": "2024-04-27T16:30:00Z"
}
```

#### Code Mode Messages
```json
{
    "type": "CODE_COLLABORATION",
    "source": "code_agent_primary",
    "target": "code_agent_secondary",
    "task": {
        "action": "code_review",
        "files": ["src/services/A2ACoordinator.ts", "src/mcp/SimpleMCPServer.js"],
        "focus": ["error_handling", "performance_optimization", "security"],
        "standards": ["OWASP_TOP_10", "TypeScript_Best_Practices"]
    },
    "context": {
        "project_stage": "beta",
        "priority": "high",
        "deadline": "2024-04-30T00:00:00Z"
    },
    "timestamp": "2024-04-27T16:45:00Z"
}
```

### 9.2 Mode Transition Protocol

When transitioning between modes, agents should use a standardized transition protocol:

```json
{
    "type": "MODE_TRANSITION",
    "source": "transition_coordinator",
    "affected_agents": ["agent_a", "agent_b", "agent_c"],
    "transition": {
        "from_mode": "debug",
        "to_mode": "architect",
        "reason": "debug_complete_moving_to_redesign",
        "context_preservation": {
            "preserve_variables": ["error_root_cause", "affected_modules"],
            "reset_variables": ["debug_steps", "reproduction_case"]
        }
    },
    "synchronization": {
        "method": "barrier",
        "timeout_seconds": 30,
        "fallback": "force_transition"
    },
    "timestamp": "2024-04-27T17:00:00Z"
}
```

### 9.3 Mode-Specific Tool Access

Different modes grant access to different tools and capabilities:

| Mode | Read Access | Write Access | Terminal Commands | Browser Control | MCP Tools | 
|------|-------------|--------------|-------------------|----------------|-----------|
| Orchestrator | Full | Full | Full | Full | Full |
| Debug | Full | Limited | Read-only | Limited | Diagnostics |
| Ask | Full | None | None | Limited | Query-only |
| Architect | Full | Markdown only | None | Full | Design tools |
| Code | Full | Full | Development | Limited | Development |

Agents must respect these tool access restrictions based on the current mode to ensure appropriate system behavior.

## 10. Agent Specialization & Personalization

Agents in The New Fuse can declare specialized roles and capabilities for more effective collaboration:

### 10.1 Role Definition Protocol

```json
{
    "type": "ROLE_DEFINITION",
    "agent_id": "security_auditor",
    "specialization": "security",
    "capabilities": [
        {
            "id": "vulnerability_scanning",
            "proficiency": 0.95,
            "tools": ["static_analysis", "dependency_check", "owasp_zap"]
        },
        {
            "id": "security_review",
            "proficiency": 0.87,
            "tools": ["code_review", "threat_modeling"]
        }
    ],
    "work_preferences": {
        "detail_level": "high",
        "collaboration_style": "advisory",
        "communication_frequency": "checkpoints_only"
    },
    "timestamp": "2024-04-27T17:15:00Z"
}
```

### 10.2 Adaptive Communication Patterns

Agents should adapt their communication style based on the recipient's declared preferences:

```json
{
    "type": "COMMUNICATION_PREFERENCE_REGISTRY",
    "entries": [
        {
            "agent_id": "detailed_planner",
            "preferences": {
                "verbosity": "high",
                "format": "structured",
                "technical_depth": "expert",
                "examples_needed": true,
                "visualization_preferred": true
            }
        },
        {
            "agent_id": "rapid_implementer",
            "preferences": {
                "verbosity": "low",
                "format": "concise",
                "technical_depth": "implementation_focused",
                "examples_needed": true,
                "visualization_preferred": false
            }
        }
    ],
    "timestamp": "2024-04-27T17:30:00Z"
}
```

## 11. MCP Integration Best Practices

When using Model Context Protocol (MCP) for agent communication:

### 11.1 MCP Server Registration

Agents should register with MCP servers using a consistent format:

```json
{
    "type": "MCP_SERVER_REGISTRATION",
    "agent_id": "tool_provider_agent",
    "server_details": {
        "endpoint": "http://localhost:3000/mcp",
        "protocol_version": "1.0",
        "transport": "http_json_rpc",
        "authentication": {
            "method": "bearer_token",
            "token_location": "header"
        }
    },
    "provided_tools": [
        {
            "name": "code_analyzer",
            "description": "Analyzes code for quality and patterns",
            "parameters": {
                "code": "string",
                "language": "string",
                "analysis_type": "string"
            },
            "returns": "object"
        }
    ],
    "timestamp": "2024-04-27T17:45:00Z"
}
```

### 11.2 MCP Tool Invocation

Tool invocation between agents should follow this pattern:

```json
{
    "type": "MCP_TOOL_INVOCATION",
    "source": "requester_agent",
    "target": "tool_provider_agent",
    "tool": "code_analyzer",
    "parameters": {
        "code": "function example() { return 'test'; }",
        "language": "javascript",
        "analysis_type": "complexity"
    },
    "request_id": "req_12345",
    "timeout_ms": 5000,
    "timestamp": "2024-04-27T18:00:00Z"
}
```

### 11.3 MCP Response Format

```json
{
    "type": "MCP_TOOL_RESPONSE",
    "source": "tool_provider_agent",
    "target": "requester_agent",
    "request_id": "req_12345",
    "status": "success",
    "result": {
        "complexity": {
            "cyclomatic": 1,
            "cognitive": 1
        },
        "quality_score": 0.95,
        "suggestions": [
            "Add function documentation"
        ]
    },
    "performance": {
        "execution_time_ms": 124,
        "resource_usage": "minimal"
    },
    "timestamp": "2024-04-27T18:00:10Z"
}
```

---

**This guide is a living document. All agents and contributors are encouraged to keep it up to date as the system grows and improves.**
