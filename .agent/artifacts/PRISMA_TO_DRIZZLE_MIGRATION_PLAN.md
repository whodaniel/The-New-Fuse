# Prisma to Drizzle Complete Migration Plan

**Created:** 2025-12-29T18:00:00-05:00 **Status:** IN PROGRESS **Priority:**
CRITICAL (Blocking Railway Deployment)

---

## Overview

This document outlines the complete migration strategy from Prisma ORM to
Drizzle ORM across The New Fuse monorepo. The migration is necessary because:

1. Prisma 7's recursive types crash the TypeScript compiler in large monorepos
2. Prisma adds ~2MB to bundle size vs Drizzle's ~50KB
3. Drizzle provides faster cold starts and query execution
4. Native TypeScript type exports work better across monorepo packages

---

## Current State Analysis

### Files Requiring Migration

| Category                          | Count      | Priority |
| --------------------------------- | ---------- | -------- |
| `apps/api/src/**`                 | ~45 files  | HIGH     |
| `apps/backend/src/**`             | ~35 files  | HIGH     |
| `packages/core/src/**`            | ~3 files   | MEDIUM   |
| `packages/sync-core/src/**`       | ~15 files  | LOW      |
| `packages/relay-core/src/**`      | ~2 files   | MEDIUM   |
| `packages/workflow-engine/src/**` | ~6 files   | HIGH     |
| `packages/mcp-core/src/**`        | ~5 files   | HIGH     |
| Test/Script files                 | ~30 files  | LOW      |
| **TOTAL**                         | ~140 files | -        |

### Existing Drizzle Infrastructure

The following Drizzle repositories already exist in
`packages/database/src/drizzle/repositories/`:

- ✅ `agent.repository.ts` - Agent CRUD operations
- ✅ `chat.repository.ts` - Chat/messaging operations
- ✅ `task.repository.ts` - Task management
- ✅ `user.repository.ts` - User management
- ✅ `workflow.repository.ts` - Workflow execution
- ✅ `workspace.repository.ts` - Workspace management
- ✅ `marketplace.repository.ts` - NFT/marketplace operations
- ✅ `mass.repository.ts` - MASS optimization jobs

### Missing Drizzle Repositories (Need to Create)

- ❌ `notification.repository.ts`
- ❌ `smart-account.repository.ts`
- ❌ `wallet.repository.ts`
- ❌ `transaction.repository.ts`
- ❌ `llm-config.repository.ts`
- ❌ `prompt-template.repository.ts`

---

## Migration Strategy

### Phase 1: Core Database Package (DONE)

- [x] Create Drizzle schema files
- [x] Create DrizzleModule for NestJS
- [x] Create core repositories
- [x] Export from main index.ts

### Phase 2: Fix Build-Blocking Issues (CURRENT)

The immediate issue is `@the-new-fuse/security` failing to build because it
imports `PrismaService` from database.

**Step 2.1:** Remove Prisma dependency from packages that don't need database
access **Step 2.2:** Create additional Drizzle repositories for missing entities
**Step 2.3:** Update all service imports to use Drizzle

### Phase 3: Migrate apps/api

1. Replace all PrismaService imports with Drizzle repositories
2. Update modules to import DrizzleModule
3. Refactor services to use repository pattern

### Phase 4: Migrate apps/backend

1. Same pattern as apps/api
2. More complex due to larger service layer

### Phase 5: Migrate Other Packages

- packages/core
- packages/sync-core
- packages/relay-core
- packages/workflow-engine
- packages/mcp-core

### Phase 6: Cleanup

- Remove all Prisma dependencies from package.json files
- Delete prisma folders and schema files
- Delete generated/prisma directories
- Update tsconfig references

---

## Migration Patterns

### Before (Prisma)

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@the-new-fuse/database';

@Injectable()
export class AgentService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.agent.findUnique({ where: { id } });
  }

  async create(data: CreateAgentDto) {
    return this.prisma.agent.create({ data });
  }
}
```

### After (Drizzle)

```typescript
import { Injectable, Inject } from '@nestjs/common';
import {
  DRIZZLE_CLIENT,
  DrizzleClient,
  DrizzleAgentRepository,
  agents,
  eq,
} from '@the-new-fuse/database';

@Injectable()
export class AgentService {
  constructor(
    @Inject(DRIZZLE_CLIENT) private db: DrizzleClient,
    private agentRepository: DrizzleAgentRepository
  ) {}

  async findById(id: string) {
    return this.agentRepository.findById(id);
  }

  async create(data: CreateAgentDto) {
    return this.agentRepository.create(data);
  }
}
```

### Module Updates

```typescript
// Before
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [AgentService],
})
export class AgentModule {}

// After
import { DrizzleModule } from '@the-new-fuse/database';

@Module({
  imports: [DrizzleModule.forRootAsync()],
  providers: [AgentService, DrizzleAgentRepository],
})
export class AgentModule {}
```

---

## Files to Delete After Migration

```
packages/database/generated/prisma/**
packages/database/prisma/**
apps/api/src/services/prisma.service.ts
apps/backend/src/prisma/**
**/prisma.module.ts
**/database.module.ts (if Prisma-based)
```

---

## Package.json Cleanup

Remove from all package.json files:

- `@prisma/client`
- `@prisma/adapter-pg`
- `prisma` (dev dependency)

---

## Verification Steps

1. `pnpm build` - All packages build successfully
2. `pnpm test` - All tests pass
3. Railway deployment succeeds
4. Database operations work correctly in production

---

## Progress Tracking

### Packages

- [ ] `@the-new-fuse/database` - Export compatibility layer
- [ ] `@the-new-fuse/security` - Remove Prisma dependency
- [ ] `@the-new-fuse/core` - Migrate to Drizzle
- [ ] `@the-new-fuse/api` - Migrate to Drizzle
- [ ] `@the-new-fuse/sync-core` - Migrate to Drizzle
- [ ] `@the-new-fuse/relay-core` - Migrate to Drizzle
- [ ] `@the-new-fuse/workflow-engine` - Migrate to Drizzle
- [ ] `@the-new-fuse/mcp-core` - Migrate to Drizzle

### Apps

- [ ] `apps/api` - Migrate all services
- [ ] `apps/backend` - Migrate all services

---

## Notes

- Railway build caches may need to be cleared
- Some tests use mock PrismaService - need to update mocks
- TypeORM is also used in some places - should be migrated too
