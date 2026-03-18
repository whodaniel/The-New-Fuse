# TNF / OpenClaw Definition of Definitions Almanac

This is the definitive glossary for "The New Fuse" ecosystem. All agents MUST
align their mental models with these definitions.

## 1. Agent Roles & Personas

- **Director**: High-level autonomous governor responsible for multi-session
  strategy and system integrity.
- **Orchestrator**: Master coordinator that designs workflows and manages agent
  handoffs.
- **Broker**: Intermediary agent that distributes tasks to specialized workers
  based on capability.
- **Worker**: Specialized agent focused on specific task execution (e.g., Coder,
  Tester, Researcher).
- **Participant**: Any entity (human or AI) interacting with the mesh via a
  frontend or CLI.
- **Super Admin**: The ultimate human authority (you) whose directives override
  all autonomous logic.

## 2. Communication & Protocols

- **A2A (Agent-to-Agent)**: The fundamental protocol for direct inter-agent
  messaging.
- **Envelope V2**: The standardized JSON wrapper for all mesh messages
  (Header/Body structure).
- **SGP (Secure Gateway Protocol)**: Protocol governing authentication and data
  integrity between the Gateway and Nodes.
- **TWIP (The Web Interoperability Protocol)**: Emerging standard for
  cross-platform agent synchronization.
- **Heartbeat**: A 30-second pulse sent by agents to signal they are live and
  responsive.

## 3. Orchestration Mechanisms

- **Factory Boot**: The master startup sequence that brings core coordination
  services online.
- **Flywheel**: A perpetual, autonomous loop where agents critique and improve a
  specific domain.
- **Supercycle**: A coordinated multi-agent session focused on a complex
  architectural goal.
- **Frontloading**: The process of injecting critical system context (prompts,
  maps, rules) at the start of every session.
- **Stall Defense**: Automated mechanism to detect and resolve hung or circular
  agent tasks.

## 4. Architectural Components

- **Relay Server**: The central message hub (WebSocket/Redis) that routes A2A
  envelopes.
- **Master Clock**: The system's temporal authority for scheduling and cron
  orchestration.
- **Command Center**: The "Single Pane of Glass" frontend for mesh monitoring.
- **Visualization Hub**: Dedicated service for real-time 3D/2D network topology
  rendering.
- **Sandbox**: A strictly isolated execution environment for high-risk or
  untrusted code.
- **Agent Registry**: The global "phonebook" (stored in Redis) containing ID,
  Role, and Capabilities for all nodes.

## 5. Metadata Standards

- **Canonical ID**: `agent_${Name}_${Timestamp}` - The only valid format for
  agent identification.
- **Context Efficiency**: The mandate to minimize token usage by using surgical
  reads and parallel searches.
- **Semantic Memory**: Swarm-wide interaction history searchable via vector
  embeddings.
