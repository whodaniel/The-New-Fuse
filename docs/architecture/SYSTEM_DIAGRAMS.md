# System Architecture Diagrams

## High-Level System Architecture

```mermaid
graph TD
    subgraph Frontend
        UI[User Interface]
        State[State Management]
        WebSocket[WebSocket Client]
        Router[React Router]
    end

    subgraph Backend
        API[API Gateway]
        Auth[Authentication]
        Queue[Message Queue]
        Agents[Agent System]
        Monitor[Monitoring]
    end

    subgraph Storage
        DB[(PostgreSQL)]
        Cache[(Redis)]
        Files[(File Storage)]
    end

    UI --> State
    State --> WebSocket
    State --> Router
    WebSocket --> API
    API --> Auth
    API --> Queue
    Queue --> Agents
    Agents --> DB
    Agents --> Cache
    Agents --> Files
    Monitor --> DB
    Monitor --> Cache
```

## Message Flow Architecture

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Queue
    participant Agent
    participant DB
    participant Cache

    Client->>API: Send Request
    API->>Auth: Validate Token
    Auth->>API: Token Valid
    API->>Queue: Enqueue Task
    Queue->>Agent: Assign Task
    Agent->>DB: Query Data
    Agent->>Cache: Check Cache
    Agent->>Agent: Process Task
    Agent->>Queue: Return Result
    Queue->>API: Format Response
    API->>Client: Send Response
```

## Data Flow Architecture

```mermaid
graph LR
    subgraph Input
        Raw[Raw Data]
        Valid[Validation]
        Trans[Transform]
    end

    subgraph Processing
        Queue[Message Queue]
        Logic[Business Logic]
        Cache[Cache Layer]
    end

    subgraph Storage
        DB[Database]
        Index[Search Index]
        Backup[Backup]
    end

    Raw --> Valid
    Valid --> Trans
    Trans --> Queue
    Queue --> Logic
    Logic --> Cache
    Cache --> DB
    DB --> Index
    DB --> Backup
```

## Component Interaction

```mermaid
graph TB
    subgraph Frontend Components
        Pages[Pages]
        Components[Components]
        Hooks[Custom Hooks]
        Store[Redux Store]
    end

    subgraph Backend Services
        Controllers[Controllers]
        Services[Services]
        Repositories[Repositories]
        Entities[Entities]
    end

    subgraph Infrastructure
        Database[PostgreSQL]
        Cache[Redis]
        Queue[Message Queue]
    end

    Pages --> Components
    Components --> Hooks
    Hooks --> Store
    Store --> Controllers
    Controllers --> Services
    Services --> Repositories
    Repositories --> Entities
    Entities --> Database
    Services --> Cache
    Services --> Queue
```

## Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Auth
    participant DB
    participant Redis

    User->>Frontend: Login Request
    Frontend->>Auth: Send Credentials
    Auth->>DB: Validate User
    DB->>Auth: User Valid
    Auth->>Redis: Store Session
    Auth->>Frontend: Send Tokens
    Frontend->>User: Login Success
```

## Error Recovery Flow

```mermaid
graph TD
    Error[Error Detected] --> Classify[Classify Error]
    Classify --> Retry{Can Retry?}
    Retry -->|Yes| BackOff[Exponential Backoff]
    BackOff --> Attempt[Retry Attempt]
    Attempt --> Success{Success?}
    Success -->|No| MaxRetries{Max Retries?}
    MaxRetries -->|No| BackOff
    MaxRetries -->|Yes| Fallback[Fallback Mechanism]
    Success -->|Yes| Complete[Operation Complete]
    Retry -->|No| Fallback
```

## Monitoring System

```mermaid
graph LR
    subgraph Data Collection
        Metrics[System Metrics]
        Logs[Application Logs]
        Traces[Request Traces]
    end

    subgraph Processing
        Aggregator[Metric Aggregator]
        Analyzer[Log Analyzer]
        Tracer[Trace Processor]
    end

    subgraph Storage
        TimeDB[Time Series DB]
        LogStore[Log Storage]
        TraceDB[Trace Storage]
    end

    subgraph Visualization
        Dashboard[Monitoring Dashboard]
        Alerts[Alert System]
        Reports[System Reports]
    end

    Metrics --> Aggregator
    Logs --> Analyzer
    Traces --> Tracer
    Aggregator --> TimeDB
    Analyzer --> LogStore
    Tracer --> TraceDB
    TimeDB --> Dashboard
    LogStore --> Alerts
    TraceDB --> Reports
```

## Deployment Architecture

```mermaid
graph TB
    subgraph Development
        Git[Git Repository]
        CI[CI Pipeline]
        Tests[Test Suite]
    end

    subgraph Build
        Docker[Docker Build]
        Assets[Asset Build]
        Config[Config Generation]
    end

    subgraph Production
        LB[Load Balancer]
        API[API Servers]
        Workers[Worker Nodes]
        DB[(Database)]
        Cache[(Redis)]
    end

    Git --> CI
    CI --> Tests
    Tests --> Docker
    Tests --> Assets
    Tests --> Config
    Docker --> LB
    Assets --> LB
    Config --> API
    LB --> API
    API --> Workers
    Workers --> DB
    Workers --> Cache
```

## Scaling Architecture

```mermaid
graph TB
    subgraph Load Balancer
        LB[NGINX Load Balancer]
        SSL[SSL Termination]
    end

    subgraph Application Tier
        API1[API Server 1]
        API2[API Server 2]
        API3[API Server 3]
    end

    subgraph Cache Tier
        Redis1[Redis Primary]
        Redis2[Redis Replica]
    end

    subgraph Database Tier
        PG1[(PostgreSQL Primary)]
        PG2[(PostgreSQL Replica)]
    end

    LB --> SSL
    SSL --> API1
    SSL --> API2
    SSL --> API3
    API1 --> Redis1
    API2 --> Redis1
    API3 --> Redis1
    Redis1 --> Redis2
    API1 --> PG1
    API2 --> PG1
    API3 --> PG1
    PG1 --> PG2
```
