# Prisma to Drizzle Migration Plan

## Executive Summary

This document outlines the complete migration strategy from Prisma ORM to Drizzle ORM. The migration is currently **40% complete** with all infrastructure in place but runtime code still using Prisma.

## Current State (December 2024)

### ✅ Completed
- Complete Drizzle schema definitions for all models
- Drizzle NestJS module with dependency injection
- DrizzleService for connection management
- 5 Drizzle repositories: Agent, User, Chat, Task, Workflow
- All repositories follow consistent patterns
- Type safety with inferred types from schema

### ❌ Incomplete
- Runtime code is 100% Prisma
- apps/backend has 8+ files with direct PrismaClient instantiation
- apps/api uses PrismaService via DatabaseModule
- packages/core uses PrismaService for metrics/monitoring
- Prisma dependencies still required

## Migration Strategy

### Phase 1: Repository Layer (COMPLETED)

**Status**: ✅ Done

Created Drizzle repositories with complete CRUD operations:

1. **DrizzleAgentRepository** - Agent system operations
2. **DrizzleUserRepository** - User authentication & management
3. **DrizzleChatRepository** - Chat, Messages, Rooms
4. **DrizzleTaskRepository** - Tasks, Pipelines, Executions
5. **DrizzleWorkflowRepository** - Workflows, Steps, Executions, Templates

All repositories are exported from `@the-new-fuse/database/drizzle`.

### Phase 2: Service Layer Migration

**Priority**: HIGH
**Estimated Effort**: 3-5 days

#### apps/backend Migration

Files requiring updates (in order):

1. **src/prisma/prisma.service.ts** → Create DrizzleService wrapper
   - Current: `PrismaService` extends `PrismaClient`
   - Target: `DrizzleService` provides repository access

2. **src/middleware/auth.ts** → Use DrizzleUserRepository
   ```typescript
   // Before
   const prisma = new PrismaClient();
   const user = await prisma.user.findUnique({ where: { id } });

   // After
   import { drizzleUserRepository } from '@the-new-fuse/database/drizzle';
   const user = await drizzleUserRepository.findById(id);
   ```

3. **src/config/passport.ts** → Use DrizzleUserRepository
   - Replace PrismaClient instantiation
   - Update user lookup logic

4. **src/utils/auth.ts** → Use DrizzleUserRepository
   - Remove PrismaClient dependency
   - Use repository for user operations

5. **src/modules/agent/agent.service.ts** → Use DrizzleAgentRepository
   - Replace Prisma agent queries
   - Update status types (no longer import from @prisma/client)

6. **src/modules/dashboard/dto/agent.dto.ts** → Use Drizzle types
   ```typescript
   // Before
   import { Agent, AgentStatus } from '@prisma/client';

   // After
   import { Agent, AgentStatus } from '@the-new-fuse/database/drizzle';
   ```

7. **src/services/chatService.ts** → Use DrizzleChatRepository
   - Replace Prisma chat/message queries
   - Use repository methods

#### apps/api Migration

Files requiring updates:

1. **src/modules/prisma/prisma.service.ts** → Deprecated, create drizzle.service.ts
2. **src/services/prisma.service.ts** → Deprecated
3. **src/modules/repositories/*.repository.ts** → Use Drizzle repositories
4. **src/modules/services/agent.service.ts** → Use DrizzleAgentRepository
5. **src/modules/services/workflow.service.ts** → Use DrizzleWorkflowRepository

#### packages/core Migration

1. **src/prisma/prisma.service.ts** → Create DrizzleService
2. **src/database/DatabaseMonitor.ts** → Update for Drizzle
3. **src/services/AgentMetadataManager.ts** → Use DrizzleAgentRepository

### Phase 3: Module & DI Updates

**Priority**: HIGH
**Estimated Effort**: 2-3 days

1. **Update DatabaseModule** (packages/database/src/database.module.ts)
   - Current: Exports 6 Prisma repositories
   - Target: Export 5 Drizzle repositories
   - Provide both during transition period

2. **Create Migration Compatibility Layer**
   ```typescript
   // packages/database/src/compatibility/index.ts
   export const UserRepository = DrizzleUserRepository; // Alias for compatibility
   export const AgentRepository = DrizzleAgentRepository;
   // ... etc
   ```

3. **Update apps/backend/src/app.module.ts**
   - Import DrizzleModule instead of DatabaseModule
   - Configure database connection

4. **Update apps/api/src/app.module.ts**
   - Same as above

### Phase 4: Testing & Validation

**Priority**: CRITICAL
**Estimated Effort**: 3-4 days

1. **Create Integration Tests**
   ```
   tests/integration/drizzle-migration/
   ├── user.repository.test.ts
   ├── agent.repository.test.ts
   ├── chat.repository.test.ts
   ├── task.repository.test.ts
   └── workflow.repository.test.ts
   ```

2. **Test Coverage Requirements**
   - All CRUD operations
   - Complex queries (joins, aggregations)
   - Transaction handling
   - Error scenarios

3. **Data Migration Validation**
   - Verify schema compatibility
   - Test data integrity
   - Performance benchmarks

### Phase 5: Cleanup & Removal

**Priority**: LOW
**Estimated Effort**: 1-2 days

Only after Phase 4 is 100% complete:

1. **Remove Prisma Dependencies**
   ```json
   // packages/database/package.json
   {
     "dependencies": {
       "@prisma/client": "^7.1.0",  // REMOVE
       "@prisma/adapter-pg": "^7.1.0",  // REMOVE
       "@prisma/migrate": "^7.1.0"  // REMOVE
     },
     "devDependencies": {
       "prisma": "7.1.0"  // REMOVE
     }
   }
   ```

2. **Remove Prisma Files**
   - `packages/database/prisma/` directory
   - `packages/database/src/prisma.service*.ts`
   - `packages/database/src/repositories/` (Prisma versions)
   - All other packages: Remove `@prisma/client` dependency

3. **Update Dockerfile.railway**
   - Remove lines 56-62 (service-specific Prisma generation)

4. **Remove Generated Prisma Types**
   - `packages/database/generated/` directory

## Implementation Guidelines

### DO's ✅

1. **Follow the Repository Pattern**
   - All database access through repositories
   - No direct db.select() calls in services
   - Consistent error handling

2. **Maintain Type Safety**
   ```typescript
   import type { User, NewUser } from '@the-new-fuse/database/drizzle';
   ```

3. **Use Transactions When Needed**
   ```typescript
   import { db } from '@the-new-fuse/database/drizzle';

   await db.transaction(async (tx) => {
     const user = await drizzleUserRepository.create(userData);
     await drizzleAgentRepository.create({ userId: user.id, ...agentData });
   });
   ```

4. **Soft Delete by Default**
   - All repositories implement soft delete
   - Use `deletedAt` timestamp
   - Filter with `isNull(table.deletedAt)`

### DON'Ts ❌

1. **Don't Mix Prisma & Drizzle**
   - Complete one service at a time
   - No partial migrations within a file

2. **Don't Skip Testing**
   - Write tests before migrating production code
   - Validate all edge cases

3. **Don't Remove Prisma Too Early**
   - Keep Prisma dependencies until 100% migrated
   - Maintain both systems during transition

## Migration Checklist

### Pre-Migration

- [x] Drizzle schema matches Prisma schema
- [x] All repositories implemented
- [x] DrizzleModule configured
- [ ] Integration tests written
- [ ] Performance benchmarks established

### Migration Execution

- [ ] apps/backend migrated
- [ ] apps/api migrated
- [ ] packages/core migrated
- [ ] All tests passing
- [ ] Performance validated

### Post-Migration

- [ ] Prisma dependencies removed
- [ ] Prisma files deleted
- [ ] Dockerfile updated
- [ ] Documentation updated
- [ ] Team trained on Drizzle patterns

## Rollback Plan

If issues arise during migration:

1. **Service-Level Rollback**
   - Revert specific service files to Prisma
   - Keep both implementations temporarily

2. **Full Rollback**
   - Revert all code changes
   - Prisma infrastructure still intact
   - No data loss (schema unchanged)

## Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1 | ✅ Done | None |
| Phase 2 | 3-5 days | Phase 1 |
| Phase 3 | 2-3 days | Phase 2 |
| Phase 4 | 3-4 days | Phase 3 |
| Phase 5 | 1-2 days | Phase 4 (100% complete) |
| **Total** | **9-14 days** | Sequential |

## Key Files Reference

### Drizzle Infrastructure

```
packages/database/src/drizzle/
├── client.ts                    # Database connection
├── drizzle.module.ts           # NestJS module
├── index.ts                     # Public exports
├── schema/
│   ├── agents.ts
│   ├── chat.ts
│   ├── tasks.ts
│   ├── users.ts
│   ├── workflows.ts
│   └── ...
├── repositories/
│   ├── agent.repository.ts
│   ├── chat.repository.ts
│   ├── task.repository.ts
│   ├── user.repository.ts
│   ├── workflow.repository.ts
│   └── index.ts
└── types.ts                    # Inferred types
```

### Files to Migrate

**apps/backend:**
- src/prisma/prisma.service.ts
- src/middleware/auth.ts
- src/config/passport.ts
- src/utils/auth.ts
- src/utils/auth.utils.ts
- src/modules/agent/agent.service.ts
- src/modules/agent-registry/services/agent-registration.service.ts
- src/modules/dashboard/dto/agent.dto.ts
- src/controllers/authController.ts
- src/services/chatService.ts

**apps/api:**
- src/modules/prisma/prisma.service.ts
- src/services/prisma.service.ts
- src/modules/repositories/*.repository.ts
- src/modules/services/agent.service.ts
- src/modules/services/workflow.service.ts

## Success Criteria

Migration is complete when:

1. ✅ No `@prisma/client` imports in runtime code
2. ✅ All tests passing
3. ✅ Performance metrics maintained or improved
4. ✅ No Prisma dependencies in package.json files
5. ✅ Documentation updated
6. ✅ Railway builds successfully

## Support & Resources

- **Drizzle Docs**: https://orm.drizzle.team/docs/overview
- **Drizzle Discord**: https://discord.gg/drizzle
- **Migration Examples**: packages/database/src/drizzle/repositories/

---

**Document Status**: Active
**Last Updated**: December 29, 2024
**Next Review**: After Phase 2 completion
