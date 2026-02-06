# The New Fuse - Database Schema Implementation Guide

## Overview

This guide provides step-by-step instructions for implementing the enhanced
database schema with all security fixes, data integrity improvements, and
advanced features while maintaining backwards compatibility.

---

## Prerequisites

1. **Backup your database** before starting any migration
2. Set environment variables:
   ```bash
   export DATABASE_URL="postgresql://user:password@localhost:5432/thenewfuse"
   export ENCRYPTION_KEY="your-secure-encryption-key-min-32-chars"
   ```
3. Ensure you have Node.js 18+ and pnpm installed
4. Stop all running services

---

## Phase 1: Critical Security Fixes (Week 1)

### Step 1.1: Encrypt LLMConfig API Keys

**Goal**: Migrate plaintext API keys to encrypted storage

**Files to modify**:

- Schema: Use `schema.enhanced.drizzle`
- Migration: Create new migration

**Steps**:

```bash
# 1. Create migration directory
cd packages/database
mkdir -p migrations/20250120_encrypt_api_keys

# 2. Generate Drizzle migration
npx drizzle migrate dev --name encrypt_llm_config_api_keys --create-only

# 3. Edit the generated migration file
```

**Migration SQL**:

```sql
-- Add new encrypted fields
ALTER TABLE "llm_configs"
  ADD COLUMN "api_key_encrypted" TEXT,
  ADD COLUMN "api_key_hash" TEXT,
  ADD COLUMN "encryption_key_id" TEXT,
  ADD COLUMN "last_key_rotation" TIMESTAMP,
  ADD COLUMN "key_expires_at" TIMESTAMP;
```

**Data Migration Script**
(`migrations/20250120_encrypt_api_keys/migrate-data.ts`):

```typescript
import { DrizzleClient } from '../generated/drizzle';
import { encryptApiKey, hashApiKey } from '../migrations/utils/encryption.util';

async function migrateApiKeys() {
  const drizzle = new DrizzleClient();

  try {
    const configs = await drizzle.lLMConfig.findMany({
      where: {
        apiKeyEncrypted: null,
      },
    });

    console.log(`Migrating ${configs.length} API keys...`);

    for (const config of configs) {
      const encrypted = encryptApiKey(config.apiKey, 'v1');

      await drizzle.lLMConfig.update({
        where: { id: config.id },
        data: {
          apiKeyEncrypted: JSON.stringify(encrypted),
          apiKeyHash: hashApiKey(config.apiKey),
          encryptionKeyId: 'v1',
          lastKeyRotation: new Date(),
        },
      });

      console.log(`Encrypted API key for config: ${config.name}`);
    }

    console.log('✅ API key migration complete');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await drizzle.$disconnect();
  }
}

migrateApiKeys();
```

**Run migration**:

```bash
# Apply schema changes
npx drizzle migrate deploy

# Run data migration
ts-node migrations/20250120_encrypt_api_keys/migrate-data.ts

# Verify
psql $DATABASE_URL -c "SELECT id, name, encryption_key_id FROM llm_configs;"

# After verification, remove old apiKey column (optional - for security)
npx drizzle migrate dev --name remove_plaintext_api_key
```

**Update LLMConfig Service**:

```typescript
// packages/api/src/services/llm-config.service.ts

import { decryptApiKey } from '@the-new-fuse/database/migrations/utils/encryption.util';

@Injectable()
export class LLMConfigService {
  async getDecryptedApiKey(configId: string): Promise<string> {
    const config = await this.drizzle.lLMConfig.findUnique({
      where: { id: configId },
    });

    if (!config) throw new Error('Config not found');

    const encrypted = JSON.parse(config.apiKeyEncrypted);
    return decryptApiKey(encrypted);
  }
}
```

---

### Step 1.2: Add Foreign Key for CodeExecutionSession

**Goal**: Ensure referential integrity for code session owners

**Steps**:

```bash
npx drizzle migrate dev --name add_code_session_owner_fk --create-only
```

**Migration SQL**:

```sql
-- Add foreign key constraint
ALTER TABLE "code_execution_sessions"
  ADD CONSTRAINT "code_execution_sessions_owner_id_fkey"
  FOREIGN KEY ("owner_id") REFERENCES "users"("id")
  ON DELETE CASCADE;

-- Add index for performance
CREATE INDEX "code_execution_sessions_owner_id_idx" ON "code_execution_sessions"("owner_id");
```

**Verification**:

```sql
-- Check for orphaned records before migration
SELECT COUNT(*)
FROM code_execution_sessions cs
LEFT JOIN users u ON cs.owner_id = u.id
WHERE u.id IS NULL;

-- If orphaned records exist, clean them up or assign to a default user
```

---

### Step 1.3: Implement Soft Delete Middleware

**Goal**: Automatically filter deleted records and prevent accidental data loss

**Steps**:

1. **Update DatabaseService**:

```typescript
// packages/database/src/drizzle.service.ts

import { Injectable, OnModuleInit } from '@nestjs/common';
import { DrizzleClient } from '../generated/drizzle';
import { softDeleteMiddleware } from './middleware/soft-delete.middleware';

@Injectable()
export class DatabaseService extends DrizzleClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();

    // Register soft delete middleware
    this.$use(softDeleteMiddleware);
  }
}
```

2. **Test soft delete behavior**:

```typescript
// Test file: packages/database/src/__tests__/soft-delete.test.ts

describe('Soft Delete Middleware', () => {
  it('should exclude deleted records from queries', async () => {
    // Create user
    const user = await drizzle.user.create({
      data: { email: 'test@example.com', hashedPassword: 'hash' },
    });

    // Delete user (soft delete)
    await drizzle.user.delete({ where: { id: user.id } });

    // Should not find deleted user
    const found = await drizzle.user.findUnique({ where: { id: user.id } });
    expect(found).toBeNull();

    // Should find with includeDeleted
    const deletedUser = await drizzle.user.findMany({
      where: { id: user.id, deletedAt: { not: null } },
    });
    expect(deletedUser).not.toBeNull();
  });
});
```

3. **Add admin endpoints for managing deleted records**:

```typescript
// packages/api/src/controllers/admin.controller.ts

@Controller('admin')
export class AdminController {
  constructor(private drizzle: DatabaseService) {}

  @Get('deleted/users')
  async getDeletedUsers() {
    return this.drizzle.user.findMany({
      where: { deletedAt: { not: null } },
    });
  }

  @Post('restore/user/:id')
  async restoreUser(@Param('id') id: string) {
    return this.drizzle.user.update({
      where: { id },
      data: { deletedAt: null },
    });
  }
}
```

---

## Phase 2: Data Integrity Improvements (Week 2-3)

### Step 2.1: Consolidate ChatMessage into Message

**Goal**: Merge ephemeral message functionality into main Message model

**Steps**:

1. **Add fields to Message model** (already in enhanced schema):
   - `isEphemeral: Boolean`
   - `expiresAt: DateTime?`

2. **Migration script**:

```bash
npx drizzle migrate dev --name consolidate_chat_message --create-only
```

**Migration SQL**:

```sql
-- Add new fields to messages table
ALTER TABLE "messages"
  ADD COLUMN "is_ephemeral" BOOLEAN DEFAULT false,
  ADD COLUMN "expires_at" TIMESTAMP;

-- Migrate data from chat_messages to messages
INSERT INTO "messages" (
  id, content, role, "sender_id", timestamp, is_ephemeral, expires_at, created_at, updated_at
)
SELECT
  id,
  content,
  role,
  "user_id" as "sender_id",
  created_at as timestamp,
  true as is_ephemeral,
  expires_at,
  created_at,
  updated_at
FROM "chat_messages";

-- Verify migration
SELECT COUNT(*) as migrated_count FROM "messages" WHERE is_ephemeral = true;

-- After verification, drop old table
-- DROP TABLE "chat_messages";
```

3. **Create cleanup job**:

```typescript
// packages/api/src/jobs/cleanup-ephemeral-messages.job.ts

import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DatabaseService } from '@the-new-fuse/database';

@Injectable()
export class CleanupEphemeralMessagesJob {
  constructor(private drizzle: DatabaseService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredMessages() {
    const result = await this.drizzle.message.deleteMany({
      where: {
        isEphemeral: true,
        expiresAt: {
          lte: new Date(),
        },
      },
    });

    console.log(`Cleaned up ${result.count} expired ephemeral messages`);
  }
}
```

4. **Register job in module**:

```typescript
// packages/api/src/app.module.ts

import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CleanupEphemeralMessagesJob } from './jobs/cleanup-ephemeral-messages.job';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [CleanupEphemeralMessagesJob],
})
export class AppModule {}
```

---

### Step 2.2: Implement WorkflowStepEdge for Graph Relationships

**Goal**: Replace string array with proper relational edges

**Steps**:

1. **Create WorkflowStepEdge table** (already in enhanced schema)

2. **Migration**:

```bash
npx drizzle migrate dev --name create_workflow_step_edges --create-only
```

**Migration SQL**:

```sql
-- Create workflow_step_edges table
CREATE TABLE "workflow_step_edges" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "from_step_id" TEXT NOT NULL,
  "to_step_id" TEXT NOT NULL,
  "condition" JSONB,
  "priority" INTEGER DEFAULT 0,
  "is_active" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "workflow_step_edges_from_step_id_fkey" FOREIGN KEY ("from_step_id") REFERENCES "workflow_steps"("id") ON DELETE CASCADE,
  CONSTRAINT "workflow_step_edges_to_step_id_fkey" FOREIGN KEY ("to_step_id") REFERENCES "workflow_steps"("id") ON DELETE CASCADE,
  CONSTRAINT "workflow_step_edges_from_step_id_to_step_id_key" UNIQUE ("from_step_id", "to_step_id")
);

CREATE INDEX "workflow_step_edges_from_step_id_idx" ON "workflow_step_edges"("from_step_id");
CREATE INDEX "workflow_step_edges_to_step_id_idx" ON "workflow_step_edges"("to_step_id");

-- Migrate existing nextSteps arrays to edges
INSERT INTO "workflow_step_edges" (from_step_id, to_step_id)
SELECT
  ws.id as from_step_id,
  unnest(ws.next_steps::text[]) as to_step_id
FROM workflow_steps ws
WHERE ws.next_steps IS NOT NULL AND array_length(ws.next_steps, 1) > 0;

-- After verification, remove old next_steps column (optional)
-- ALTER TABLE "workflow_steps" DROP COLUMN "next_steps";
```

3. **Add cycle detection service**:

```typescript
// packages/api/src/services/workflow-validation.service.ts

import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@the-new-fuse/database';

@Injectable()
export class WorkflowValidationService {
  constructor(private drizzle: DatabaseService) {}

  async detectCycles(workflowId: string): Promise<boolean> {
    const steps = await this.drizzle.workflowStep.findMany({
      where: { workflowId },
      include: { nextStepEdges: true },
    });

    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (stepId: string): boolean => {
      if (recursionStack.has(stepId)) return true;
      if (visited.has(stepId)) return false;

      visited.add(stepId);
      recursionStack.add(stepId);

      const step = steps.find((s) => s.id === stepId);
      if (step) {
        for (const edge of step.nextStepEdges) {
          if (hasCycle(edge.toStepId)) return true;
        }
      }

      recursionStack.delete(stepId);
      return false;
    };

    for (const step of steps) {
      if (hasCycle(step.id)) return true;
    }

    return false;
  }

  async validateWorkflow(workflowId: string): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Check for cycles
    const hasCycle = await this.detectCycles(workflowId);
    if (hasCycle) {
      errors.push('Workflow contains circular dependencies');
    }

    // Check for orphaned steps
    const steps = await this.drizzle.workflowStep.findMany({
      where: { workflowId },
      include: { nextStepEdges: true, previousStepEdges: true },
    });

    for (const step of steps) {
      if (
        step.nextStepEdges.length === 0 &&
        step.previousStepEdges.length === 0
      ) {
        errors.push(`Step "${step.name}" is not connected to workflow`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
```

---

## Phase 3: Multi-Tenancy & Organizations (Week 4-5)

### Step 3.1: Create Organization Tables

**Goal**: Enable multi-tenant architecture for enterprise use

**Steps**:

```bash
npx drizzle migrate dev --name create_organizations --create-only
```

**Migration SQL** (tables already in enhanced schema):

```sql
-- Organizations, OrganizationMember, OrganizationInvitation tables
-- See schema.enhanced.drizzle for full definitions
```

### Step 3.2: Migrate Personal Agents to Organizations

**Goal**: Create personal organizations for existing users

**Migration script**:

```typescript
async function migrateToOrganizations() {
  const users = await drizzle.user.findMany({
    include: { createdAgents: true },
  });

  for (const user of users) {
    // Create personal organization
    const org = await drizzle.organization.create({
      data: {
        name: `${user.name || user.email}'s Workspace`,
        slug: `user-${user.id.slice(0, 8)}`,
        type: 'INDIVIDUAL',
        members: {
          create: {
            userId: user.id,
            role: 'OWNER',
          },
        },
      },
    });

    // Migrate user's agents to organization
    await drizzle.agent.updateMany({
      where: { creatorId: user.id },
      data: { organizationId: org.id },
    });

    console.log(`Migrated user ${user.email} to organization ${org.name}`);
  }
}
```

---

## Phase 4: Advanced Features (Week 6-7)

### Step 4.1: Implement Verifiable Credentials

**Goal**: Add W3C-compliant credential system

Already implemented in enhanced schema. Create service:

```typescript
// packages/api/src/services/verifiable-credential.service.ts
// See SCHEMA_DESIGN_SOLUTIONS.md for full implementation
```

### Step 4.2: Add JSON Schema Validation

**Goal**: Validate JSON fields at application layer

Create validation decorators:

```typescript
// packages/api/src/decorators/validate-json.decorator.ts
// See SCHEMA_DESIGN_SOLUTIONS.md for implementation
```

---

## Testing & Verification

### Unit Tests

```bash
# Run all database tests
pnpm test packages/database

# Run specific test suite
pnpm test packages/database/src/__tests__/soft-delete.test.ts
```

### Integration Tests

```bash
# Test full migration process
pnpm test:integration packages/database/migrations
```

### Manual Verification Checklist

- [ ] All API keys are encrypted in `llm_configs` table
- [ ] Soft delete filters work correctly (deleted records not returned)
- [ ] Foreign keys prevent orphaned records
- [ ] WorkflowStepEdge properly models workflow graphs
- [ ] Organizations created for all users
- [ ] Verifiable credentials can be issued and verified
- [ ] JSON validation catches invalid data

---

## Rollback Plan

Each phase includes rollback scripts:

```bash
# Rollback last migration
npx drizzle migrate rollback --name <migration-name>

# Restore from backup
pg_restore -d $DATABASE_URL backup.dump
```

---

## Performance Monitoring

After migration, monitor:

```sql
-- Check query performance
SELECT * FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;

-- Check index usage
SELECT * FROM pg_stat_user_indexes WHERE idx_scan = 0;

-- Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## Support & Troubleshooting

### Common Issues

1. **Encryption key not set**: Ensure `ENCRYPTION_KEY` environment variable is
   set
2. **Orphaned records**: Run cleanup scripts before applying foreign key
   constraints
3. **Circular workflows**: Use validation service before allowing workflow
   activation

### Getting Help

- Review detailed solutions in `SCHEMA_DESIGN_SOLUTIONS.md`
- Check migration logs in `packages/database/migrations/`
- Test in development environment first

---

## Conclusion

This implementation preserves ALL of The New Fuse's unique features while
adding:

✅ Enterprise-grade security (encrypted credentials) ✅ Data integrity (proper
relationships, soft deletes) ✅ Multi-tenancy support (organizations) ✅
Advanced features (VCs, validation) ✅ Performance optimization (strategic
indexes) ✅ Backwards compatibility (gradual migration)

Estimated total implementation time: **8 weeks** with proper testing and
validation.
