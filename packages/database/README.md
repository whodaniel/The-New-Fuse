# @the-new-fuse/database

Database package for The New Fuse platform using **Drizzle ORM** with
PostgreSQL.

## Overview

This package provides:

- Type-safe database schema definitions using Drizzle ORM
- NestJS module for database integration
- Repository patterns for common database operations
- Migration tooling via Drizzle Kit

## Installation

The package is already configured in the monorepo. To use it in another package:

```typescript
import {
  DrizzleModule,
  DRIZZLE_CLIENT,
  DrizzleClient,
} from '@the-new-fuse/database';
```

## Quick Start

### NestJS Module Registration

```typescript
// In your app module
import { DrizzleModule } from '@the-new-fuse/database';

@Module({
  imports: [
    DrizzleModule.forRootAsync(), // Uses ConfigService for DATABASE_URL
    // or
    DrizzleModule.forRoot({ connectionString: '...' }),
  ],
})
export class AppModule {}
```

### Injecting the Database Client

```typescript
import { Inject, Injectable } from '@nestjs/common';
import {
  DRIZZLE_CLIENT,
  DrizzleClient,
  agents,
  eq,
} from '@the-new-fuse/database';

@Injectable()
export class AgentService {
  constructor(@Inject(DRIZZLE_CLIENT) private db: DrizzleClient) {}

  async findById(id: string) {
    const [agent] = await this.db
      .select()
      .from(agents)
      .where(eq(agents.id, id));
    return agent;
  }
}
```

## Code Examples

### Select

```typescript
import { users, eq } from '@the-new-fuse/database';

// Get all users
const allUsers = await this.db.select().from(users);

// Get a single user by email
const [user] = await this.db
  .select()
  .from(users)
  .where(eq(users.email, 'user@example.com'));
```

### Insert

```typescript
// Insert a new user
const [newUser] = await this.db
  .insert(users)
  .values({
    name: 'John Doe',
    email: 'john.doe@example.com',
  })
  .returning();
```

### Update

```typescript
// Update a user's name
const [updatedUser] = await this.db
  .update(users)
  .set({ name: 'Jane Doe' })
  .where(eq(users.email, 'john.doe@example.com'))
  .returning();
```

### Delete

```typescript
// Delete a user
await this.db.delete(users).where(eq(users.email, 'jane.doe@example.com'));
```

## Type Inference

Drizzle provides automatic type inference from your schema:

```typescript
import type {
  DrizzleAgent,
  NewAgent,
  DrizzleUser,
  NewUser,
} from '@the-new-fuse/database';

const newAgent: NewAgent = {
  name: 'My Agent',
  type: 'ASSISTANT',
  userId: '...',
};
```

## Database Commands

Run these from the monorepo root:

```bash
# Generate migration from schema changes
pnpm db:generate

# Apply migrations
pnpm db:migrate

# Push schema directly (development only)
pnpm db:push

# Introspect existing database
pnpm db:pull

# Open Drizzle Studio (GUI)
pnpm db:studio

# Check schema validity
pnpm db:check
```

Or from within this package:

```bash
pnpm drizzle:generate
pnpm drizzle:migrate
pnpm drizzle:push
pnpm drizzle:pull
pnpm drizzle:studio
pnpm drizzle:check
```

## Schema Structure

The Drizzle schema is organized by domain in `src/drizzle/schema/`:

```
src/drizzle/
├── index.ts              # Main Drizzle exports
├── client.ts             # Database client
├── drizzle.module.ts     # NestJS module
├── types.ts              # Inferred types
├── schema/
│   ├── index.ts          # Schema barrel export
│   ├── enums.ts          # PostgreSQL enums
│   ├── users.ts          # User & auth tables
│   ├── agents.ts         # Agent system tables
│   ├── chat.ts           # Chat & messaging tables
│   ├── workflows.ts      # Workflow system tables
│   ├── tasks.ts          # Task & pipeline tables
│   ├── code-execution.ts # Code execution tables
│   ├── marketplace.ts    # NFT & marketplace tables
│   ├── wallets.ts        # Wallet & transaction tables
│   ├── system.ts         # Entity registry, LLM config
│   └── workspace.ts      # Workspace, project, sync tables
└── repositories/
    ├── index.ts
    └── agent.repository.ts
```

## Migrations

Migrations are stored in `drizzle/` and managed by Drizzle Kit:

```
drizzle/
├── 0000_known_the_captain.sql
├── 0001_add_webhooks_analytics.sql
└── meta/
    └── _journal.json
```

## Additional Documentation

- [Drizzle Migration Guide](./DRIZZLE_MIGRATION.md) - Detailed migration
  information
- [Database Production Guide](./DATABASE_PRODUCTION_GUIDE.md) - Production
  deployment
- [Schema Analysis](./SCHEMA_ANALYSIS.md) - Schema documentation
