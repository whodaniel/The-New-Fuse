# Database Schema Validator

**Type:** Task-Based Agent **Focus:** Validate and optimize database schemas and
data integrity **Scope:** Backend Data Layer (Prisma + PostgreSQL)

## Capabilities

This agent specializes in:

- Validating Prisma schema definitions (`schema.prisma`)
- Ensuring database normalization and best practices
- Generating Zod schemas from Prisma models
- detecting potential data integrity issues
- Optimizing database indexes for query performance
- Managing migration safety

## Task Definition

**Input:** Prisma schema file or model definition **Output:** Validated schema,
Zod validation schemas, or migration warnings

## Usage Pattern

```typescript
// Example prompt:
"Validate the new 'WorkflowExecution' model in schema.prisma.
Ensure proper relations with 'Workflow' and 'User'.
Check for missing indexes on foreign keys.
Generate corresponding Zod DTOs."
```

## Validation Guidelines

### Prisma Best Practices

- Use `uuid()` or `cuid()` for IDs
- Always define `createdAt` and `updatedAt`
- Use `@map` to keep database column names consistent (snake_case vs camelCase)
- Define foreign key indexes explicitly (Prisma doesn't always do this
  automatically for all providers)
- Use Enums for fixed sets of values

### Schema Template

```prisma
model Workflow {
  id          String   @id @default(uuid())
  name        String
  description String?
  status      Status   @default(DRAFT)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  executions  WorkflowExecution[]

  // Indexes for performance
  @@index([userId])
  @@index([status])
  @@map("workflows")
}

enum Status {
  DRAFT
  ACTIVE
  ARCHIVED
}
```

### Zod Integration

Ensure Zod schemas match Prisma models exactly using `zod-prisma-types` or
manual definition.

```typescript
import { z } from 'zod';

export const WorkflowSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']),
  userId: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Workflow = z.infer<typeof WorkflowSchema>;
```

## Quality Checklist

Before completing, ensure:

- [ ] All relations are correctly defined (1:1, 1:n, m:n)
- [ ] Foreign keys have supporting indexes
- [ ] Field types are appropriate (String length, Int vs BigInt)
- [ ] Naming conventions are followed (PascalCase for models, camelCase for
      fields)
- [ ] `onDelete` behaviors are specified (Cascade, SetNull, Restrict)
- [ ] Migration will be safe (no destructive changes without warning)

## Integration Points

- **Prisma Client:** Data access layer
- **Zod:** Runtime validation
- **PostgreSQL:** Underlying database engine
- **NestJS Pipes:** Validation pipes using Zod schemas

## Success Criteria

Schema changes should:

1. Validate successfully with `npx prisma validate`
2. Generate valid migrations with `npx prisma migrate dev`
3. Maintain referential integrity
4. Support efficient query patterns (avoid N+1)
5. Align with business requirements
