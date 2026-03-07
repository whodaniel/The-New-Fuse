# Database Patterns - Drizzle Best Practices

Complete guide to database access patterns using Drizzle in backend microservices.

## Table of Contents

- [DrizzleService Usage](#drizzleservice-usage)
- [Repository Pattern](#repository-pattern)
- [Transaction Patterns](#transaction-patterns)
- [Query Optimization](#query-optimization)
- [N+1 Query Prevention](#n1-query-prevention)
- [Error Handling](#error-handling)

---

## DrizzleService Usage

### Basic Pattern

```typescript
import { DrizzleService } from '@project-lifecycle-portal/database';

// Always use DrizzleService.main
const users = await DrizzleService.main.user.findMany();
```

### Check Availability

```typescript
if (!DrizzleService.isAvailable) {
    throw new Error('Drizzle client not initialized');
}

const user = await DrizzleService.main.user.findUnique({ where: { id } });
```

---

## Repository Pattern

### Why Use Repositories

✅ **Use repositories when:**
- Complex queries with joins/includes
- Query used in multiple places
- Need caching layer
- Want to mock for testing

❌ **Skip repositories for:**
- Simple one-off queries
- Prototyping (can refactor later)

### Repository Template

```typescript
export class UserRepository {
    async findById(id: string): Promise<User | null> {
        return DrizzleService.main.user.findUnique({
            where: { id },
            include: { profile: true },
        });
    }

    async findActive(): Promise<User[]> {
        return DrizzleService.main.user.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async create(data: Drizzle.UserCreateInput): Promise<User> {
        return DrizzleService.main.user.create({ data });
    }
}
```

---

## Transaction Patterns

### Simple Transaction

```typescript
const result = await DrizzleService.main.$transaction(async (tx) => {
    const user = await tx.user.create({ data: userData });
    const profile = await tx.userProfile.create({ data: { userId: user.id } });
    return { user, profile };
});
```

### Interactive Transaction

```typescript
const result = await DrizzleService.main.$transaction(
    async (tx) => {
        const user = await tx.user.findUnique({ where: { id } });
        if (!user) throw new Error('User not found');

        return await tx.user.update({
            where: { id },
            data: { lastLogin: new Date() },
        });
    },
    {
        maxWait: 5000,
        timeout: 10000,
    }
);
```

---

## Query Optimization

### Use select to Limit Fields

```typescript
// ❌ Fetches all fields
const users = await DrizzleService.main.user.findMany();

// ✅ Only fetch needed fields
const users = await DrizzleService.main.user.findMany({
    select: {
        id: true,
        email: true,
        profile: { select: { firstName: true, lastName: true } },
    },
});
```

### Use include Carefully

```typescript
// ❌ Excessive includes
const user = await DrizzleService.main.user.findUnique({
    where: { id },
    include: {
        profile: true,
        posts: { include: { comments: true } },
        workflows: { include: { steps: { include: { actions: true } } } },
    },
});

// ✅ Only include what you need
const user = await DrizzleService.main.user.findUnique({
    where: { id },
    include: { profile: true },
});
```

---

## N+1 Query Prevention

### Problem: N+1 Queries

```typescript
// ❌ N+1 Query Problem
const users = await DrizzleService.main.user.findMany(); // 1 query

for (const user of users) {
    // N queries (one per user)
    const profile = await DrizzleService.main.userProfile.findUnique({
        where: { userId: user.id },
    });
}
```

### Solution: Use include or Batching

```typescript
// ✅ Single query with include
const users = await DrizzleService.main.user.findMany({
    include: { profile: true },
});

// ✅ Or batch query
const userIds = users.map(u => u.id);
const profiles = await DrizzleService.main.userProfile.findMany({
    where: { userId: { in: userIds } },
});
```

---

## Error Handling

### Drizzle Error Types

```typescript
import { Drizzle } from '@drizzle/client';

try {
    await DrizzleService.main.user.create({ data });
} catch (error) {
    if (error instanceof Drizzle.DrizzleClientKnownRequestError) {
        // Unique constraint violation
        if (error.code === 'P2002') {
            throw new ConflictError('Email already exists');
        }

        // Foreign key constraint
        if (error.code === 'P2003') {
            throw new ValidationError('Invalid reference');
        }

        // Record not found
        if (error.code === 'P2025') {
            throw new NotFoundError('Record not found');
        }
    }

    // Unknown error
    Sentry.captureException(error);
    throw error;
}
```

---

**Related Files:**
- [SKILL.md](SKILL.md)
- [services-and-repositories.md](services-and-repositories.md)
- [async-and-errors.md](async-and-errors.md)
