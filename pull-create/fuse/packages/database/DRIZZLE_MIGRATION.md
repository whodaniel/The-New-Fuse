# Drizzle ORM Migration Guide

## Overview

This document outlines the completed migration from Drizzle to Drizzle ORM for
The New Fuse monorepo. The migration addressed TypeScript compilation issues
caused by Drizzle's deeply recursive type structures.

## Why Drizzle ORM?

### Benefits Over Drizzle

| Feature         | Drizzle 7                                | Drizzle ORM                           |
| --------------- | --------------------------------------- | ------------------------------------- |
| **Type Safety** | Generated types (can crash TS compiler) | Inferred types (no generation needed) |
| **Bundle Size** | Heavy (~2MB query engine)               | Lightweight (~50KB)                   |
| **Cold Start**  | Slower (engine initialization)          | Fast (direct SQL)                     |
| **Flexibility** | Limited to Drizzle's API                 | Full SQL control                      |
| **Monorepo**    | TS2742 "ghost type" errors              | Native TypeScript exports             |
| **Query Speed** | ~15-30ms overhead                       | Near-native SQL speed                 |

### Key Advantages for Agent Orchestration

1. **No TypeScript Stack Overflow** - Drizzle types don't cause recursive type
   issues
2. **Faster Agent Loops** - 15-30ms faster per database operation
3. **Unified pgvector Support** - Query embeddings and relational data together
4. **Real TypeScript Types** - Directly exportable across monorepo packages

## Migration Status ✅ COMPLETE

### Completed

- [x] Installed Drizzle ORM dependencies (`drizzle-orm`, `postgres`,
      `drizzle-kit`)
- [x] Created `drizzle.config.ts` configuration
- [x] Created complete Drizzle schema mapping all 40+ models:
  - `src/drizzle/schema/enums.ts` - All PostgreSQL enums
  - `src/drizzle/schema/users.ts` - User & auth tables
  - `src/drizzle/schema/agents.ts` - Agent system tables
  - `src/drizzle/schema/chat.ts` - Chat & messaging tables
  - `src/drizzle/schema/workflows.ts` - Workflow system tables
  - `src/drizzle/schema/tasks.ts` - Task & pipeline tables
  - `src/drizzle/schema/code-execution.ts` - Code execution tables
  - `src/drizzle/schema/marketplace.ts` - NFT & marketplace tables
  - `src/drizzle/schema/wallets.ts` - Wallet & transaction tables
  - `src/drizzle/schema/system.ts` - Entity registry, LLM config, prompts
  - `src/drizzle/schema/workspace.ts` - Workspace, project, sync tables
- [x] Created Drizzle client (`src/drizzle/client.ts`)
- [x] Created NestJS module (`src/drizzle/drizzle.module.ts`)
- [x] Created type exports (`src/drizzle/types.ts`)
- [x] Created example repository
      (`src/drizzle/repositories/agent.repository.ts`)
- [x] Updated package.json with Drizzle scripts
- [x] Updated main index.ts to export Drizzle
- [x] Removed Drizzle dependencies from root package.json
- [x] Updated all documentation to reference Drizzle
- [x] Updated database commands in root package.json

## Usage

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

### Using the Repository Pattern

```typescript
import { drizzleAgentRepository } from '@the-new-fuse/database';

// Direct usage (singleton)
const agent = await drizzleAgentRepository.findById('...');

// Or inject as a dependency
@Injectable()
export class AgentService {
  constructor(private agentRepo: DrizzleAgentRepository) {}
}
```

### Type Inference

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

## Available Scripts

```bash
# From monorepo root
pnpm db:generate   # Generate migration from schema changes
pnpm db:migrate    # Apply migrations
pnpm db:push       # Push schema directly (dev only)
pnpm db:pull       # Introspect existing database
pnpm db:studio     # Open Drizzle Studio (DB GUI)
pnpm db:check      # Check schema validity

# From packages/database directory
pnpm drizzle:generate
pnpm drizzle:migrate
pnpm drizzle:push
pnpm drizzle:pull
pnpm drizzle:studio
pnpm drizzle:check
```

## File Structure

```
packages/database/
├── drizzle.config.ts          # Drizzle Kit configuration
├── src/
│   ├── drizzle/
│   │   ├── index.ts           # Main Drizzle exports
│   │   ├── client.ts          # Database client
│   │   ├── drizzle.module.ts  # NestJS module
│   │   ├── types.ts           # Inferred types
│   │   ├── schema/
│   │   │   ├── index.ts       # Schema barrel export
│   │   │   ├── enums.ts       # PostgreSQL enums
│   │   │   ├── users.ts       # User tables
│   │   │   ├── agents.ts      # Agent tables
│   │   │   ├── chat.ts        # Chat tables
│   │   │   ├── workflows.ts   # Workflow tables
│   │   │   ├── tasks.ts       # Task/Pipeline tables
│   │   │   ├── code-execution.ts
│   │   │   ├── marketplace.ts
│   │   │   ├── wallets.ts
│   │   │   ├── system.ts
│   │   │   └── workspace.ts
│   │   └── repositories/
│   │       ├── index.ts
│   │       └── agent.repository.ts
│   ├── index.ts               # Main package exports (Drizzle + Drizzle)
│   ├── drizzle.service.ts      # Drizzle service (deprecated)
│   └── repositories/          # Drizzle repositories (deprecated)
└── drizzle/
    └── schema.drizzle          # Drizzle schema (reference only)
```

## Coexistence Strategy

During migration, both Drizzle and Drizzle are available:

1. **Drizzle exports** - Prefixed with standard names (`User`, `Agent`, etc.)
2. **Drizzle exports** - Prefixed with `Drizzle` (`DrizzleUser`, `DrizzleAgent`)
3. **Drizzle repositories** - Named with `Drizzle` prefix
4. **Schema tables** - Available via `drizzleSchema` namespace

This allows gradual migration of services without breaking existing code.

## Next Steps

1. **Run `pnpm db:pull`** to validate schema against live database
2. **Create remaining repositories** following the pattern in
   `agent.repository.ts`
3. **Update consuming packages** as needed

## Troubleshooting

### Schema Mismatch

If `drizzle:pull` shows differences, update the Drizzle schema to match the
database.

### Connection Issues

Ensure `DATABASE_URL` is set in your environment or `.env` file.

### Type Errors

If you see type errors with Drizzle queries, ensure you're importing from the
correct module and using the Drizzle table definitions.
