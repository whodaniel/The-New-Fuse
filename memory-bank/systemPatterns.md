# System Patterns

*   **Architecture Overview:** Modular system designed for extensibility, observability, resilience, and security. Can be deployed standalone, distributed, containerized, or serverless. Core components include Backend (NestJS), Frontend (React), VS Code Extension, Agent System, Workflow System, and communication protocols (MCP, A2A). Governed by the [Master Information Architecture](docs/MASTER_INFORMATION_ARCHITECTURE.md). (FTUE Report May 2025: "Solid Architectural Foundation" noted as a strength).
*   **Key Technical Decisions:**
    *   Use Model Context Protocol (MCP) as the primary data exchange mechanism: Standardizes communication between agents and components.
    *   Employ NestJS for the backend: Provides a structured framework for Node.js applications.
    *   Utilize React for the frontend: Enables building interactive user interfaces.
    *   Use PostgreSQL with Prisma ORM: Provides relational database storage and type-safe database access.
    *   Support multiple communication methods: WebSockets (key for VS Code to Chrome extension communication, noted as a strength in FTUE Report May 2025), REST APIs, gRPC, Redis Pub/Sub ensure flexibility.
*   **Design Patterns:**
    *   Modularity: Components are designed for independent deployment and maintenance.
    *   Extensibility: System allows adding new capabilities and integrations easily.
    *   Observability: Built-in logging, monitoring, and tracing.
    *   Resilience: Fault tolerance and graceful degradation are core goals.
    *   Security (Zero-trust): Authentication and authorization applied at each layer.
    *   Event-Driven Architecture: Used for internal component integration.
    *   UI Component Consolidation: Strive for single, reusable UI components (e.g., `AgentCard`).
*   **Component Relationships:** MCP acts as the central hub for data exchange. The VS Code extension integrates various features like agent communication, MCP management, and UI panels. Backend services handle core logic, state, and persistence. See diagrams in `docs/MASTER_INFORMATION_ARCHITECTURE.md` and `docs/architecture/overview.md` (VS Code Extension).
*   **Critical Implementation Paths:**
    *   **Data Flow:** Data sources -> MCP Layer -> Transport -> Processing -> Storage/Analytics (as per Master Information Architecture).
    *   **Information Lifecycle:** Creation -> Validation -> Processing -> Storage -> Retrieval -> Presentation.
    *   **Agent Communication:** Via MCP, A2A protocol (using ACAProtocolAdapter), or specific VS Code protocols (Workspace State, File, Command).
    *   **Workflow Execution:** Orchestrated steps involving multiple agents and actions.
