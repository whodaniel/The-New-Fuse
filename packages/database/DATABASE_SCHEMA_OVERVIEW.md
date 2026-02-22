# Database Schema Overview

## Entity Relationship Summary

This document provides a comprehensive overview of the database schema, including all models, their relationships, and key design decisions.

## Table of Contents

1. [Schema Statistics](#schema-statistics)
2. [Core Domains](#core-domains)
3. [Entity Relationships](#entity-relationships)
4. [Indexes and Performance](#indexes-and-performance)
5. [Data Integrity](#data-integrity)
6. [Security Considerations](#security-considerations)

---

## Schema Statistics

- **Total Models**: 28
- **Enums**: 12
- **Foreign Key Relationships**: 40+
- **Indexes**: 60+ (including unique constraints)
- **Soft Delete Support**: 11 models
- **Database**: PostgreSQL 13+
- **ORM**: Drizzle 6.19.0

---

## Core Domains

### 1. User Management

**Models**: `User`, `AuthSession`, `LoginAttempt`, `AuthEvent`

```
User (Core Identity)
├── AuthSession (1:N) - Active login sessions
├── LoginAttempt (1:N) - Security audit trail
├── AuthEvent (1:N) - Authentication events
├── Agent (1:N) - Owned agents
├── Pipeline (1:N) - Owned pipelines
├── Task (1:N) - Created tasks
├── Workflow (1:N) - Created workflows
├── ChatRoom (1:N) - Owned chat rooms
└── Message (1:N) - Sent messages
```

**Key Fields**:
- `email` (unique): User email
- `username` (unique): Optional username
- `roles[]`: Array of UserRole enums
- `isActive`: Account status
- `emailVerified`: Email verification status
- `deletedAt`: Soft delete timestamp

**Security Features**:
- Password hashing (bcrypt recommended)
- Session management via AuthSession
- Login attempt tracking
- Soft delete support

### 2. Agent System

**Models**: `Agent`, `AgentMetadata`, `AgentNFT`

```
Agent (AI Agent Entity)
├── AgentMetadata (1:1) - Extended metadata
├── AgentNFT (1:1) - NFT representation
├── Wallet (1:1) - Blockchain wallet
├── Chat (1:N) - Agent conversations
├── Message (1:N) - Agent messages
├── CodeExecutionUsage (1:N) - Execution history
├── Pipeline (1:N) - Agent pipelines
├── Task (1:N) - Assigned tasks
├── Workflow (1:N) - Agent workflows
└── WorkflowStep (1:N) - Workflow step assignments
```

**Key Fields**:
- `type`: AgentType enum (BASIC, CHAT, WORKFLOW, etc.)
- `status`: AgentStatus enum (ACTIVE, INACTIVE, etc.)
- `capabilities[]`: AgentCapability enum array
- `systemPrompt`: Agent behavior configuration
- `config`: JSON configuration

**Agent Types**:
- BASIC: General-purpose agent
- CHAT: Conversational agent
- WORKFLOW: Workflow execution agent
- TASK: Task-specific agent
- ASSISTANT: AI assistant
- ANALYSIS: Data analysis agent
- CONVERSATIONAL: Advanced chat agent
- IDE_EXTENSION: IDE integration agent
- API: API interaction agent

### 3. Chat System

**Models**: `Chat`, `ChatRoom`, `Message`, `ChatMessage`

```
Chat (1:1 Conversation)
├── Agent (N:1) - Associated agent
└── Message (1:N) - Chat messages

ChatRoom (Group Conversation)
├── User (N:1) - Room owner
└── Message (1:N) - Room messages

Message (Universal Message)
├── User (N:1) - Sender (optional)
├── Agent (N:1) - Agent sender (optional)
├── Chat (N:1) - Parent chat (optional)
├── ChatRoom (N:1) - Parent room (optional)
├── Message (N:1) - Parent message (threads)
└── Message (1:N) - Replies
```

**Message Types**:
- USER: Human message
- AGENT: AI agent message
- SYSTEM: System notification
- ASSISTANT: Assistant response
- TOOL: Tool execution result

**Design Notes**:
- Message can belong to EITHER Chat OR ChatRoom (XOR constraint recommended)
- Message sender can be EITHER User OR Agent
- Supports threaded conversations via parent-child relationships
- Ephemeral messages with expiration
- Soft delete via `isDeleted` flag

### 4. Workflow System

**Models**: `Workflow`, `WorkflowStep`, `WorkflowExecution`

```
Workflow (Process Definition)
├── User (N:1) - Creator
├── Agent (N:1) - Executing agent (optional)
├── WorkflowStep (1:N) - Workflow steps
└── WorkflowExecution (1:N) - Execution history

WorkflowStep (Step Definition)
├── Workflow (N:1) - Parent workflow
├── Agent (N:1) - Step executor (optional)
└── order: Integer - Execution order

WorkflowExecution (Execution Instance)
├── Workflow (N:1) - Workflow definition
├── status: ExecutionStatus
├── input: JSON
└── output: JSON
```

**Workflow Statuses**:
- DRAFT: Being designed
- PUBLISHED: Ready for execution
- ARCHIVED: No longer active
- ACTIVE: Currently running
- PAUSED: Temporarily stopped
- COMPLETED: Successfully finished
- FAILED: Execution failed

**Design Features**:
- Steps ordered by `order` field
- `nextSteps[]` array for conditional branching
- `conditions` and `transformations` as JSON
- Execution tracking with input/output
- Statistics collection

### 5. Pipeline & Task System

**Models**: `Pipeline`, `Task`, `TaskExecution`

```
Pipeline (Task Container)
├── User (N:1) - Owner
├── Agent (N:1) - Executing agent
└── Task (1:N) - Pipeline tasks

Task (Work Unit)
├── Pipeline (N:1) - Parent pipeline (optional)
├── Agent (N:1) - Assigned agent (optional)
├── User (N:1) - Creator
└── TaskExecution (1:N) - Execution attempts

TaskExecution (Execution Record)
├── Task (N:1) - Parent task
├── status: String
└── output: JSON
```

**Task Priorities**:
- LOW: Can be delayed
- MEDIUM: Normal priority
- HIGH: Important
- URGENT: Immediate attention

**Task Statuses**:
- PENDING: Waiting to start
- IN_PROGRESS: Currently executing
- COMPLETED: Successfully finished
- FAILED: Execution failed
- CANCELLED: User cancelled

### 6. Code Execution System

**Models**: `CodeExecutionUsage`, `CodeExecutionSession`

```
CodeExecutionUsage (Execution Record)
├── Agent (N:1) - Executing agent
├── language: CodeExecutionLanguage
├── tier: CodeExecutionTier
├── status: CodeExecutionStatus
├── executionTime: Int (ms)
├── memoryUsage: Int (bytes)
└── computeUnits: Float

CodeExecutionSession (Collaborative Session)
├── ownerId: String (should be FK to User)
├── collaborators[]: String array
└── files: JSON
```

**Supported Languages**:
- JAVASCRIPT
- TYPESCRIPT
- PYTHON
- RUBY
- SHELL
- HTML
- CSS

**Execution Tiers**:
- BASIC: Limited resources
- STANDARD: Normal resources
- PREMIUM: Enhanced resources
- ENTERPRISE: Maximum resources

### 7. NFT & Marketplace System

**Models**: `AgentNFT`, `FractionalShare`, `RevenueStream`, `RevenueDistribution`, `MarketplaceListing`, `MarketplaceOffer`

```
AgentNFT (NFT Representation)
├── Agent (1:1) - Associated agent
├── FractionalShare (1:N) - Ownership shares
├── RevenueStream (1:N) - Revenue sources
└── MarketplaceListing (1:N) - Active listings

FractionalShare (Ownership)
├── AgentNFT (N:1) - Parent NFT
├── ownerAddress: String
└── shareAmount: Decimal

RevenueStream (Income Source)
├── AgentNFT (N:1) - Parent NFT
├── RevenueDistribution (1:N) - Distribution events
└── tokenAddress: String

MarketplaceListing (Sale Listing)
├── AgentNFT (N:1) - NFT for sale
├── MarketplaceOffer (1:N) - Incoming offers
└── status: MarketplaceStatus

MarketplaceOffer (Purchase Offer)
├── MarketplaceListing (N:1) - Target listing
└── status: OfferStatus
```

**Marketplace Features**:
- Fractional ownership support
- Revenue sharing among shareholders
- On-chain transaction tracking
- Smart account integration
- Automated distribution

### 8. Wallet & Blockchain System

**Models**: `Wallet`, `Transaction`

```
Wallet (Blockchain Wallet)
├── Agent (1:1) - Associated agent (optional)
└── Transaction (1:N) - Transaction history

Transaction (Blockchain Transaction)
├── Wallet (N:1) - Source wallet
├── hash: String (unique)
├── blockNumber: Int
└── status: TransactionStatus
```

**Wallet Types**:
- SMART_ACCOUNT: Smart contract wallet
- EOA: Externally Owned Account
- MULTI_SIG: Multi-signature wallet

**Transaction Types**:
- TRANSFER: Token transfer
- CONTRACT_CALL: Smart contract interaction
- CONTRACT_DEPLOYMENT: Deploy contract
- NFT_MINT: Mint NFT
- NFT_TRANSFER: Transfer NFT

### 9. System & Configuration

**Models**: `RegisteredEntity`, `LLMConfig`, `BusinessMetric`, `ErrorLog`, `SyncState`, `SyncConflict`

```
RegisteredEntity (Service Registry)
- type: EntityType
- status: EntityStatus
- capabilities[]
- dependencies[]

LLMConfig (AI Provider Configuration)
- provider: String
- modelName: String
- apiKey: String (should be encrypted)
- enabled: Boolean
- priority: Int

SyncState (Synchronization Tracking)
- resourceType: String
- resourceId: String
- version: Int
- checksum: String

SyncConflict (Conflict Resolution)
- resourceType: String
- resourceId: String
- conflictType: String
- localVersion: JSON
- remoteVersion: JSON
```

---

## Entity Relationships

### One-to-One Relationships

1. **Agent → AgentMetadata**: Extended metadata storage
2. **Agent → AgentNFT**: NFT representation
3. **Agent → Wallet**: Blockchain wallet

### One-to-Many Relationships

1. **User → Agent**: User owns multiple agents
2. **User → Task**: User creates multiple tasks
3. **User → Workflow**: User creates multiple workflows
4. **Agent → Chat**: Agent has multiple conversations
5. **Agent → Message**: Agent sends multiple messages
6. **Workflow → WorkflowStep**: Workflow has multiple steps
7. **Workflow → WorkflowExecution**: Workflow has multiple executions
8. **AgentNFT → FractionalShare**: NFT has multiple shareholders
9. **Wallet → Transaction**: Wallet has transaction history

### Many-to-Many Relationships

None directly modeled (using join tables or arrays where needed)

**Potential M:N**:
- CodeExecutionSession.collaborators (currently String array, should be join table)
- Message threads (currently self-referential 1:N)

---

## Indexes and Performance

### Existing Indexes

**Primary Keys**: All models have UUID primary key
**Unique Constraints**:
- User.email
- User.username
- AuthSession.token
- CodeExecutionUsage.executionId
- Transaction.hash
- AgentNFT.tokenId
- AgentNFT.agentId
- Wallet.address

**Explicit Indexes**:
- CodeExecutionUsage: agentId, clientId, createdAt, language, tier, status
- Transaction: walletId, hash, status, createdAt
- SyncState: (resourceType, resourceId, tenantId) composite unique

### Missing Indexes (Added via Migration)

See `migrations/add_production_indexes_and_constraints.sql` for complete list:

- **Foreign Key Indexes**: 40+ indexes on FK columns
- **Status Indexes**: All status enums
- **Timestamp Indexes**: createdAt, updatedAt, expiresAt
- **Composite Indexes**: Common query patterns
- **Partial Indexes**: Sparse data with WHERE clauses

---

## Data Integrity

### Soft Delete Implementation

**Models with Soft Delete**:
- User
- Agent
- Chat
- Pipeline
- Task
- Workflow
- LLMConfig
- RegisteredEntity
- ChatRoom

**Middleware**: `soft-delete.middleware.ts` automatically:
- Filters out deleted records
- Converts DELETE to UPDATE
- Provides restore functionality

### Cascade Delete Configurations

**Current State**:
- ✅ User → AuthSession: CASCADE
- ✅ User → LoginAttempt: CASCADE
- ✅ User → AuthEvent: CASCADE
- ✅ Agent → AgentMetadata: CASCADE
- ⚠️ Many relations lack onDelete specification

**Recommended Configuration**:
```drizzle
// Audit data - keep on parent delete
onDelete: Restrict

// Dependent data - delete with parent
onDelete: Cascade

// Optional relations - nullify on parent delete
onDelete: SetNull
```

### Data Validation

**Enum Constraints**: 12 enums enforce valid values
**Unique Constraints**: Prevent duplicates
**Required Fields**: Non-nullable fields enforce data presence
**Default Values**: Sensible defaults for optional fields

**Missing Validations**:
- Message: XOR constraint (Chat XOR ChatRoom)
- Message: Sender XOR constraint (User XOR Agent)
- Decimal precision for crypto amounts
- Email format validation

---

## Security Considerations

### Sensitive Data

**Encrypted Fields Needed**:
- ✅ User.hashedPassword (application-level)
- ❌ User.refreshToken (plain text - should hash)
- ❌ LLMConfig.apiKey (plain text - should encrypt)

**Recommendations**:
1. Encrypt LLMConfig.apiKey with AES-256-GCM
2. Hash or encrypt User.refreshToken
3. Implement key rotation for encrypted fields
4. Use environment variables for encryption keys

### Access Control

**Role-Based Access**:
- User.roles[] array supports multiple roles
- 7 role types (USER, ADMIN, SUPER_ADMIN, etc.)
- Application-level enforcement

**Recommended Enhancements**:
- Row-Level Security (RLS) in PostgreSQL
- Organization-based multi-tenancy
- Audit logging for sensitive operations

### Audit Trail

**Current Audit Models**:
- AuthEvent: Authentication events
- LoginAttempt: Login tracking
- ErrorLog: Error tracking
- SyncConflict: Data sync issues

**Recommendations**:
- Add created_by/updated_by fields
- Implement change tracking
- Add audit log for sensitive operations

---

## Common Query Patterns

### Active Agents by User

```typescript
const agents = await drizzle.agent.findMany({
  where: {
    userId: currentUserId,
    status: AgentStatus.ACTIVE,
    deletedAt: null,
  },
  include: {
    metadata: true,
    nft: true,
  },
});
```

### Recent Messages in Chat

```typescript
const messages = await drizzle.message.findMany({
  where: {
    chatId: chatId,
    isDeleted: false,
  },
  orderBy: {
    timestamp: 'desc',
  },
  take: 50,
  include: {
    sender: true,
    agent: true,
  },
});
```

### Pending Tasks for Agent

```typescript
const tasks = await drizzle.task.findMany({
  where: {
    assignedToId: agentId,
    status: {
      in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS],
    },
    deletedAt: null,
  },
  orderBy: [
    { priority: 'desc' },
    { createdAt: 'asc' },
  ],
});
```

### Active Marketplace Listings

```typescript
const listings = await drizzle.marketplaceListing.findMany({
  where: {
    status: MarketplaceStatus.ACTIVE,
    OR: [
      { expiresAt: null },
      { expiresAt: { gt: new Date() } },
    ],
  },
  include: {
    agentNFT: {
      include: {
        agent: true,
      },
    },
    offers: {
      where: {
        status: OfferStatus.PENDING,
      },
    },
  },
});
```

---

## Schema Evolution

### Migration Strategy

1. **Never edit applied migrations**
2. **Always test in staging first**
3. **Create backups before migrations**
4. **Use `migrate deploy` in production**
5. **Monitor performance after index changes**

### Planned Enhancements

From `SCHEMA_DESIGN_SOLUTIONS.md`:

1. **Multi-tenancy**: Organization model
2. **Verifiable Credentials**: W3C-compliant credentials
3. **Enhanced Workflows**: WorkflowStepEdge table
4. **Better Validation**: JSON schema validation middleware
5. **Encryption**: Secure credential storage

### Deprecation Policy

- Mark models as deprecated in comments
- Add `deprecatedAt` field if needed
- Maintain backward compatibility for 2+ versions
- Provide migration guides for breaking changes

---

## Quick Reference

### Model Count by Domain

| Domain | Models | Key Features |
|--------|--------|--------------|
| User Management | 4 | Auth, sessions, audit |
| Agent System | 3 | AI agents, metadata, NFT |
| Chat System | 4 | Conversations, rooms, messages |
| Workflow System | 3 | Workflows, steps, executions |
| Task System | 3 | Pipelines, tasks, executions |
| Code Execution | 2 | Usage tracking, sessions |
| NFT/Marketplace | 6 | NFTs, shares, marketplace |
| Blockchain | 2 | Wallets, transactions |
| System/Config | 6 | Registry, LLM, monitoring |
| **Total** | **28** | |

### Enum Summary

| Enum | Values | Usage |
|------|--------|-------|
| UserRole | 7 | User permissions |
| AgentType | 9 | Agent classifications |
| AgentStatus | 9 | Agent states |
| AgentCapability | 22 | Agent abilities |
| MessageRole | 5 | Message types |
| WorkflowStatus | 7 | Workflow states |
| WorkflowExecutionStatus | 5 | Execution states |
| PipelineStatus | 5 | Pipeline states |
| TaskStatus | 5 | Task states |
| TaskPriority | 4 | Task priorities |
| CodeExecutionLanguage | 7 | Programming languages |
| CodeExecutionTier | 4 | Resource tiers |

---

## Documentation

For more detailed information:

- **Schema Design**: `SCHEMA_DESIGN_SOLUTIONS.md`
- **Implementation Guide**: `IMPLEMENTATION_GUIDE.md`
- **Production Guide**: `DATABASE_PRODUCTION_GUIDE.md`
- **Analysis**: `SCHEMA_ANALYSIS.md`
- **Resolution Summary**: `SCHEMA_RESOLUTION_SUMMARY.md`

---

**Last Updated**: 2025-11-18
**Schema Version**: 1.0.0
**Drizzle Version**: 6.19.0
