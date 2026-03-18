# TNF / OpenClaw Definition of Definitions Almanac

This is the definitive glossary for "The New Fuse" ecosystem. All agents MUST
align their mental models with these definitions.

## 0. Primitives (The Building Blocks)

- **Primitives**: The irreducible building blocks of the system (logic, data, or
  tools) from which all complex behaviors are derived.
- **Index**: A searchable registry mapping identifiers to their locations,
  metadata, or addresses.
- **Library**: A curated collection of reusable assets, skills, logic modules,
  or subfiles.
- **Contextually Relative**: The principle that the significance, priority, or
  meaning of data and logic is dependent on the surrounding environment or
  active session.
- **Hierarchy**: The structured ordering of entities, where higher levels
  govern, abstract, or constrain lower levels.
- **Hierarchy of Logic**: The layered arrangement of decision-making rules, from
  core mandates down to transient task instructions.
- **Logical**: Consistent with the system's established rules, structures, and
  constraints.
- **Constraints**: Operational limits (resource, temporal, or security) that
  define the boundaries of permissible action.
- **Logical Constraints**: Fixed, non-negotiable rules within the hierarchy of
  logic that prevent system drift or corruption.
- **Runtime**: The active execution state of an agent, session, or
  infrastructure component.
- **Address**: The unique identifier or URI used to locate, route to, or target
  an entity in the mesh.
- **Component**: A discrete, functional unit of software, UI, or configuration.
- **Modular**: The architectural standard of building systems from independent,
  swappable, and self-contained components.
- **Destination**: The target endpoint, intended state, or final objective of a
  communication or workflow.
- **Infrastructure**: The underlying hardware and services (Redis, Relay, Cloud,
  OS) that support the agent mesh.
- **Embedded**: Integrated directly and natively into a host environment or
  parent component.
- **Abstraction**: A simplified representation of complex logic that exposes
  only the necessary interface to the layer above.
- **Project**: The aggregate collection of files, logic, state, and goals
  defining "The New Fuse".
- **Personal**: Data, state, or preferences scoped exclusively to an individual
  user or private agent instance.
- **Subfiles**: Auxiliary files containing granular logic or data partitioned
  from a main structural module to maintain modularity.
- **Scaffolding**: Temporary or foundational structure used to bootstrap and
  support the development of new features or agents.
- **Prompts**: Natural language inputs that guide LLM reasoning, persona, and
  behavioral boundaries.
- **Instructions**: Explicit, procedural, and mandated steps provided to an
  agent for immediate execution.
- **Structure**: The formal organization and defined relationship between all
  components and primitives in the ecosystem.
- **Define**: To establish the immutable boundaries, identity, rules, and
  purpose of an entity or term.
- **Encyclopedia**: The comprehensive, cross-referenced sum of all system
  knowledge and history (The Almanac).

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
