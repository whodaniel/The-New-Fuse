# @the-new-fuse/database

This package manages all database interactions for The New Fuse platform. It provides a NestJS module for connecting to the database and includes schemas, migrations, and service abstractions for both Prisma and Drizzle ORM.

## ⚠️ Migration Notice: Prisma to Drizzle ORM

This package is currently undergoing a migration from **Prisma** to **Drizzle ORM**. During this transition period, both ORMs will coexist. New features should be implemented using Drizzle, while existing Prisma models and queries will be phased out incrementally.

-   **Prisma**: Used for legacy models and queries. Located in `prisma/`.
-   **Drizzle**: The target ORM for all new development. Schema definitions are located in `src/schema/`.

---

## Drizzle ORM Usage (In Progress)

This section outlines the new standard for database interactions using Drizzle.

### Installation

To add Drizzle to a new service, install the required packages:

```bash
pnpm add drizzle-orm pg
pnpm add -D drizzle-kit
```

### Drizzle Module

The `DrizzleModule` (to be implemented) will provide the Drizzle client to the rest of the application.

```typescript
// Example: app.module.ts
import { Module } from '@nestjs/common';
import { DrizzleModule } from '@the-new-fuse/database';

@Module({
  imports: [DrizzleModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
```

### Injecting the Drizzle Client

Inject the `DrizzleClient` into your services to interact with the database. The client is a Drizzle instance configured for the application's database connection.

```typescript
// Example: user.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { DrizzleClient } from '@the-new-fuse/database';
import { users } from '@the-new-fuse/database/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class UserService {
  constructor(@Inject('DRIZZLE_CLIENT') private readonly db: DrizzleClient) {}

  async findUserById(id: string) {
    const result = await this.db.select().from(users).where(eq(users.id, id));
    return result[0];
  }
}
```

### Code Examples

#### Select

```typescript
// Get all users
const allUsers = await this.db.select().from(users);

// Get a single user by email
const user = await this.db.select().from(users).where(eq(users.email, 'user@example.com'));
```

#### Insert

```typescript
// Insert a new user
const newUser = await this.db.insert(users).values({
  name: 'John Doe',
  email: 'john.doe@example.com',
}).returning();
```

#### Update

```typescript
// Update a user's name
const updatedUser = await this.db.update(users)
  .set({ name: 'Jane Doe' })
  .where(eq(users.email, 'john.doe@example.com'))
  .returning();
```

#### Delete

```typescript
// Delete a user
await this.db.delete(users).where(eq(users.email, 'jane.doe@example.com'));
```

---

## Legacy Prisma Usage

The following documentation applies to the legacy Prisma setup. Avoid using Prisma for new features.

### Prisma Client

The `PrismaService` provides a pre-configured Prisma client.

### Injecting the Prisma Service

```typescript
// Example: legacy.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@the-new-fuse/database';

@Injectable()
export class LegacyService {
  constructor(private readonly prisma: PrismaService) {}

  async getLegacyTask(id: string) {
    return this.prisma.task.findUnique({ where: { id } });
  }
}
```

### Database Commands

-   `pnpm run db:generate`: Generate the Prisma client.
-   `pnpm run db:migrate`: Run database migrations.
-   `pnpm run db:studio`: Open Prisma Studio.
