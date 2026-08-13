# The New Fuse (TNF) - Master Architecture Schema

This document contains the unified architectural schema and database relationships for The New Fuse ecosystem. It is formatted as an interactive Mermaid graph, optimized for ingestion by NotebookLM and other visual mind-mapping tools.

```mermaid
flowchart TD
    %% Styling and Themes
    classDef frontend fill:#3182ce,stroke:#2b6cb0,color:#fff,stroke-width:2px,rx:5px,ry:5px
    classDef backend fill:#e53e3e,stroke:#c53030,color:#fff,stroke-width:2px,rx:5px,ry:5px
    classDef data fill:#38a169,stroke:#2f855a,color:#fff,stroke-width:2px,rx:5px,ry:5px
    classDef agent fill:#805ad5,stroke:#6b46c1,color:#fff,stroke-width:2px,rx:5px,ry:5px
    classDef infra fill:#718096,stroke:#4a5568,color:#fff,stroke-width:2px,rx:5px,ry:5px
    classDef database fill:#d69e2e,stroke:#c05621,color:#fff,stroke-width:2px,rx:5px,ry:5px
    classDef pkg fill:#cbd5e0,stroke:#a0aec0,color:#2d3748,stroke-width:1px,stroke-dasharray: 5 5

    subgraph The New Fuse Ecosystem [The New Fuse Ecosystem]
        
        %% --- FRONTEND LAYER ---
        subgraph FrontendLayer [Frontend & Interfaces]
            ReactApp[React Web App]:::frontend
            ViteDev[Vite Dev Server :3000]:::frontend
            TauriApp[Tauri Desktop App]:::frontend
            OpenClawCLI[OpenClaw CLI / Terminal]:::frontend
            Dashboard[Intelligence Dashboard]:::frontend
        end

        %% --- INFRASTRUCTURE ---
        subgraph Infrastructure [Infrastructure & DevOps]
            DockerCompose[Docker Compose]:::infra
            TurboBuild[Turbo Monorepo Build]:::infra
            CloudRuntime[CloudRuntime Cloud Deploy]:::infra
            Cloudflare[Cloudflare Wasm]:::infra
        end

        %% --- BACKEND LAYER ---
        subgraph BackendServices [Backend API & Routing]
            APIGateway[API Gateway :3005]:::backend
            BackendAPI[Backend API Server :3001]:::backend
            RelayServer[Relay WS Server :3000]:::backend
            WorkflowEngine[Workflow Execution Engine]:::backend
            
            pkgAPI["@tnf/api"]:::pkg
            pkgAuth["@tnf/core-auth"]:::pkg
            pkgResource["@tnf/resource-registry"]:::pkg
            pkgN8N["@tnf/n8n-workflows"]:::pkg
        end

        %% --- AGENT ORCHESTRATION ---
        subgraph AgentSystem [Autonomous Agent Swarm]
            Orchestrator[Master Orchestrator]:::agent
            AgentRegistry[Agent Discovery Registry]:::agent
            TaskAgents[Specialized Task Agents]:::agent
            MCPIntegration[Model Context Protocol Hub]:::agent
            TWIPLayer[Terminal Window Identity Protocol]:::agent
            
            pkgClaude["@tnf/claude-skills"]:::pkg
            pkgCoordination["@tnf/agent-coordination"]:::pkg
        end

        %% --- DATA & CACHE ---
        subgraph DataLayer [Data persistence & ORM]
            PostgreSQL[(PostgreSQL :5433)]:::data
            RedisCache[(Redis Cache :6380)]:::data
            DrizzleORM(Drizzle ORM : 6.19.0):::data
        end
        
        %% --- DATABASE SCHEMA DOMAINS ---
        subgraph DatabaseSchema [PostgreSQL Database Domains]
            UserMgmt[(1. User Management\nUser, AuthSession, AuthEvent)]:::database
            AgentMgmt[(2. Agent System\nAgent, AgentMetadata)]:::database
            ChatMgmt[(3. Chat System\nChat, Message, ChatRoom)]:::database
            WorkflowMgmt[(4. Workflow System\nWorkflow, Step, Execution)]:::database
            TaskMgmt[(5. Task System\nPipeline, Task)]:::database
            CodeExec[(6. Code Execution\nUsage, Session)]:::database
            NFTMgmt[(7. NFT & Marketplace\nAgentNFT, Share, Listing)]:::database
            WalletMgmt[(8. Wallet & Chain\nWallet, Transaction)]:::database
            SysConfig[(9. System Config\nRegistry, LLMConfig, Sync)]:::database
        end

        %% --- EXTERNAL INTEGRATIONS ---
        subgraph IntegrationServices [Integrations & Bridges]
            BrowserHub[Browser Automation Hub]:::infra
            FileSystemMCP[File System MCP]:::infra
            ExternalAPIs[LLM APIs / Third-Party]:::infra
            WebPilot[WebPilot Runtime]:::infra
        end
    end

    %% --- CONNECTIONS & FLOW ---
    
    %% User to System
    ReactApp -->|REST / WS| APIGateway
    Dashboard -->|REST| APIGateway
    TauriApp -->|REST| APIGateway
    OpenClawCLI -->|TWIP / WS :18789| RelayServer
    
    %% Gateway Routing
    APIGateway --> BackendAPI
    APIGateway --> RelayServer
    
    %% Backend Internal
    BackendAPI --> WorkflowEngine
    BackendAPI -.-> pkgAPI
    BackendAPI -.-> pkgAuth
    BackendAPI -.-> pkgResource
    WorkflowEngine -.-> pkgN8N
    
    %% Agent Communication
    BackendAPI --> AgentRegistry
    RelayServer --> Orchestrator
    Orchestrator -.-> pkgCoordination
    Orchestrator <--> TaskAgents
    TaskAgents <--> MCPIntegration
    TWIPLayer --> RelayServer
    
    %% Skills & Tools
    TaskAgents -.-> pkgClaude
    MCPIntegration --> BrowserHub
    MCPIntegration --> FileSystemMCP
    MCPIntegration --> WebPilot
    TaskAgents --> ExternalAPIs

    %% Data Access
    BackendAPI --> DrizzleORM
    AgentRegistry --> DrizzleORM
    WorkflowEngine --> DrizzleORM
    Orchestrator --> RedisCache
    RelayServer --> RedisCache
    
    %% Database Mapping
    DrizzleORM --> PostgreSQL
    PostgreSQL --> UserMgmt
    PostgreSQL --> AgentMgmt
    PostgreSQL --> ChatMgmt
    PostgreSQL --> WorkflowMgmt
    PostgreSQL --> TaskMgmt
    PostgreSQL --> NFTMgmt
    PostgreSQL --> WalletMgmt
    PostgreSQL --> CodeExec
    PostgreSQL --> SysConfig

    %% Infrastructure Hosting
    Infrastructure -.-> FrontendLayer
    Infrastructure -.-> BackendServices
    Infrastructure -.-> DataLayer

    %% --- CLICK EVENTS (For NotebookLM / Visualizers) ---
    click ReactApp href "#frontend-layer" "View Frontend Docs"
    click BackendAPI href "#backend-services" "View Backend Specs"
    click PostgreSQL href "#database-schema" "View Database Overview"
    click Orchestrator href "#agent-swarm" "View Agent Coordination"
    click OpenClawCLI href "https://docs.openclaw.ai/cli" "OpenClaw Documentation"
```

## Schema Domains Overview

1. **User Management**: Manages human identities, authentication sessions, and RBAC roles.
2. **Agent System**: Manages AI personas, capabilities, and system prompts.
3. **Chat System**: Handles threads, human-to-agent, and agent-to-agent ephemeral/persistent messages.
4. **Workflow & Task Systems**: Orchestrates step-by-step logic, pipeline tasks, and tracks execution states.
5. **Blockchain & Marketplace**: On-chain fractional ownership (NFTs), wallets, and agent revenue distributions.
6. **System & Code Execution**: Tracks LLM quotas, registers safe compute environments, and logs sandbox usage. 
