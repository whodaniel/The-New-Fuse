# Drizzle ORM Migration Guide

**For Developers**: How to use Drizzle ORM in The New Fuse

## Quick Start

### Import Repositories

```typescript
// Use Drizzle repositories (recommended)
import { drizzleUserRepository, drizzleAgentRepository } from '@the-new-fuse/database/drizzle';

// Or use compatibility aliases (works with existing code)
import { UserRepository, AgentRepository } from '@the-new-fuse/database/drizzle';
```

### Basic CRUD Operations

```typescript
// Create
const user = await drizzleUserRepository.create({
  email: 'user@example.com',
  name: 'John Doe',
  hashedPassword: hashedPw,
});

// Read
const user = await drizzleUserRepository.findByEmail('user@example.com');
const user = await drizzleUserRepository.findById(userId);

// Update
const updated = await drizzleUserRepository.update(userId, {
  name: 'Jane Doe',
});

// Delete (soft delete)
await drizzleUserRepository.softDelete(userId);
```

## Key Differences from Prisma

### 1. Repository Pattern vs Direct Client

**Prisma (Old):**
```typescript
import { PrismaService } from '@the-new-fuse/database';

constructor(private prisma: PrismaService) {}

const user = await this.prisma.user.findUnique({
  where: { email }
});
```

**Drizzle (New):**
```typescript
import { drizzleUserRepository } from '@the-new-fuse/database/drizzle';

const user = await drizzleUserRepository.findByEmail(email);
```

### 2. Field Name Changes

| Prisma Field | Drizzle Field |
|--------------|---------------|
| `user.password` | `user.hashedPassword` |
| `agent.config` | `agent.config` (same) |
| All other fields | Same as Prisma |

### 3. No More Transactions (Simplified)

**Prisma (Old):**
```typescript
await this.prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: userData });
  const session = await tx.session.create({ data: sessionData });
  return user;
});
```

**Drizzle (New):**
```typescript
// Sequential operations (simpler, still reliable)
const user = await drizzleUserRepository.create(userData);
const session = await drizzleUserRepository.createSession(user.id, token, expiresAt);
```

> **Note**: We simplified transaction usage for Phase 2. Complex transactions can be added back in Phase 4 if needed using Drizzle's transaction API.

### 4. Query Building

**Prisma (Old):**
```typescript
const agents = await this.prisma.agent.findMany({
  where: {
    userId,
    status: 'ACTIVE',
    deletedAt: null,
  },
  orderBy: { createdAt: 'desc' },
  skip: 10,
  take: 20,
});
```

**Drizzle (New):**
```typescript
// Use repository methods (preferred)
const agents = await drizzleAgentRepository.findByStatusAndUserId('ACTIVE', userId);

// Or use the query builder directly
import { db } from '@the-new-fuse/database/drizzle';
import { agents } from '@the-new-fuse/database/drizzle';
import { and, desc, eq, isNull } from 'drizzle-orm';

const result = await db
  .select()
  .from(agents)
  .where(and(
    eq(agents.userId, userId),
    eq(agents.status, 'ACTIVE'),
    isNull(agents.deletedAt)
  ))
  .orderBy(desc(agents.createdAt))
  .offset(10)
  .limit(20);
```

## Available Repositories

### 1. DrizzleUserRepository (15 methods)

```typescript
import { drizzleUserRepository } from '@the-new-fuse/database/drizzle';

// User operations
await drizzleUserRepository.create(data);
await drizzleUserRepository.findById(id);
await drizzleUserRepository.findByEmail(email);
await drizzleUserRepository.findByUsername(username);
await drizzleUserRepository.update(id, data);
await drizzleUserRepository.updatePassword(id, hashedPassword);
await drizzleUserRepository.softDelete(id);

// Session operations
await drizzleUserRepository.createSession(userId, token, expiresAt);
await drizzleUserRepository.findSessionByToken(token);
await drizzleUserRepository.deleteSession(token);
await drizzleUserRepository.deleteExpiredSessions();
await drizzleUserRepository.findUserBySessionToken(token);
```

### 2. DrizzleAgentRepository (23 methods)

```typescript
import { drizzleAgentRepository } from '@the-new-fuse/database/drizzle';

// Basic CRUD
await drizzleAgentRepository.create(data);
await drizzleAgentRepository.findById(id);
await drizzleAgentRepository.update(id, data);
await drizzleAgentRepository.softDelete(id);

// Search & Filter
await drizzleAgentRepository.findByNameAndUserId(name, userId);
await drizzleAgentRepository.findWithPagination(userId, page, limit);
await drizzleAgentRepository.findByStatusAndUserId(status, userId);
await drizzleAgentRepository.findByCapability(capability, userId);
await drizzleAgentRepository.searchAgents(userId, query);

// Registration
await drizzleAgentRepository.createRegistration(data);
await drizzleAgentRepository.findRegistrationByToken(token);
await drizzleAgentRepository.updateRegistrationHeartbeat(registrationId);
await drizzleAgentRepository.findRegistrationWithDetails(registrationId);

// Capabilities & Directory
await drizzleAgentRepository.createCapability(data);
await drizzleAgentRepository.createDirectoryEntry(data);
await drizzleAgentRepository.createOnboardingEvent(data);
```

### 3. DrizzleChatRepository (12 methods)

```typescript
import { drizzleChatRepository } from '@the-new-fuse/database/drizzle';

// Chat operations
await drizzleChatRepository.createChat(data);
await drizzleChatRepository.findChatById(id);
await drizzleChatRepository.createMessage(data);
await drizzleChatRepository.findMessagesByChatId(chatId, limit);

// Chat messages
await drizzleChatRepository.createChatMessage(data);
await drizzleChatRepository.findChatMessagesByUserId(userId, limit);
await drizzleChatRepository.deleteChatMessage(id);
await drizzleChatRepository.deleteExpiredMessages();
```

### 4. DrizzleTaskRepository (18 methods)

```typescript
import { drizzleTaskRepository } from '@the-new-fuse/database/drizzle';

// Task operations
await drizzleTaskRepository.createTask(data);
await drizzleTaskRepository.findTaskById(id);
await drizzleTaskRepository.findTasksByStatus(status, userId);
await drizzleTaskRepository.updateTask(id, data);

// Pipeline operations
await drizzleTaskRepository.createPipeline(data);
await drizzleTaskRepository.findPipelineById(id);

// Execution tracking
await drizzleTaskRepository.createExecution(data);
await drizzleTaskRepository.completeExecution(id, output);
await drizzleTaskRepository.failExecution(id, error);
```

### 5. DrizzleWorkflowRepository (20 methods)

```typescript
import { drizzleWorkflowRepository } from '@the-new-fuse/database/drizzle';

// Workflow operations
await drizzleWorkflowRepository.createWorkflow(data);
await drizzleWorkflowRepository.findWorkflowById(id);
await drizzleWorkflowRepository.findWorkflowWithSteps(id);

// Step management
await drizzleWorkflowRepository.createStep(data);
await drizzleWorkflowRepository.updateStep(id, data);
await drizzleWorkflowRepository.reorderSteps(workflowId, stepIds);

// Execution tracking
await drizzleWorkflowRepository.createExecution(data);
await drizzleWorkflowRepository.findExecutionById(id);
await drizzleWorkflowRepository.updateExecutionStatus(id, status);

// Templates
await drizzleWorkflowRepository.createTemplate(data);
await drizzleWorkflowRepository.findTemplatesByCategory(category);
```

## Migration Checklist

When migrating a service from Prisma to Drizzle:

- [ ] Replace `PrismaService` import with repository imports
- [ ] Remove Prisma dependency injection from constructor
- [ ] Replace Prisma queries with repository method calls
- [ ] Update field names (e.g., `password` → `hashedPassword`)
- [ ] Remove transaction wrappers (use sequential operations)
- [ ] Test all CRUD operations
- [ ] Verify error handling still works
- [ ] Update tests to use Drizzle repositories

## Common Patterns

### Pagination

```typescript
const { data, total } = await drizzleAgentRepository.findWithPagination(
  userId,
  page,
  limit
);

return {
  data,
  pagination: {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  },
};
```

### Search with Multiple Criteria

```typescript
const agents = await drizzleAgentRepository.searchAgents(userId, {
  name: 'Assistant',
  type: 'CHAT',
  capability: 'code_analysis',
});
```

### Soft Delete Pattern

```typescript
// Soft delete (sets deletedAt timestamp)
await drizzleUserRepository.softDelete(userId);

// All queries automatically filter out soft-deleted records
const user = await drizzleUserRepository.findById(userId);
// Returns null if soft-deleted
```

## Advanced Usage

### Direct Database Access

If you need custom queries not covered by repositories:

```typescript
import { db, sql, agents } from '@the-new-fuse/database/drizzle';
import { eq, and, isNull } from 'drizzle-orm';

// Type-safe query builder
const result = await db
  .select({
    id: agents.id,
    name: agents.name,
    status: agents.status,
  })
  .from(agents)
  .where(and(
    eq(agents.userId, userId),
    isNull(agents.deletedAt)
  ));

// Raw SQL (use sparingly)
const result = await db.execute(sql`
  SELECT id, name FROM agents WHERE user_id = ${userId}
`);
```

### Creating Custom Repository Methods

Add new methods to existing repositories in:
`packages/database/src/drizzle/repositories/*.repository.ts`

```typescript
// Example: Add to agent.repository.ts
async findAgentsByTag(tag: string): Promise<Agent[]> {
  return db
    .select()
    .from(agents)
    .where(
      and(
        sql`${agents.tags}::jsonb @> ${JSON.stringify([tag])}::jsonb`,
        isNull(agents.deletedAt)
      )
    );
}
```

## Performance Tips

1. **Use Pagination**: Always paginate large result sets
2. **Select Only Needed Fields**: Use `.select()` to limit returned data
3. **Index Lookups**: Repository methods use indexed fields (id, email, etc.)
4. **Batch Operations**: Use `Promise.all()` for independent queries
5. **Avoid N+1**: Use joins or batch queries instead of loops

## Need Help?

- Review migrated files in `apps/backend/src/` for examples
- Check [MIGRATION_PROGRESS_REPORT.md](./MIGRATION_PROGRESS_REPORT.md) for status
- See [PRISMA_TO_DRIZZLE_MIGRATION_PLAN.md](./PRISMA_TO_DRIZZLE_MIGRATION_PLAN.md) for full plan
- Repository source: `packages/database/src/drizzle/repositories/`
