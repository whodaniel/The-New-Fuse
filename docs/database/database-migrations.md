# Database Migrations Guide

This document provides a comprehensive guide for managing database migrations in The New Fuse project.

## Overview

The New Fuse uses Prisma ORM for database schema management and migrations. The project follows a structured approach to database migrations to ensure consistency and reliability across environments.

## Migration Commands

The following commands are available for managing database migrations:

```bash
# Generate Prisma client based on the schema
yarn db:generate

# Apply all pending migrations in production/staging environments
yarn db:migrate

# Create a new migration in development
yarn db:migrate:dev

# Reset the database (development only)
yarn db:reset

# Open Prisma Studio to view and edit data
yarn db:studio
```

## Migration Workflow

### Development Workflow

1. Make changes to the Prisma schema file (`prisma/schema.prisma`)
2. Run `yarn db:migrate:dev` to create a new migration
3. Provide a descriptive name for the migration when prompted
4. Prisma will generate the migration files and apply them to your development database
5. The Prisma client will be automatically regenerated

### Production Workflow

1. Ensure all migrations are committed to version control
2. During deployment, run `yarn db:migrate` to apply pending migrations
3. The CI/CD pipeline automatically runs migrations during deployment

## Migration Files

Migration files are stored in the `prisma/migrations` directory and follow this structure:

```
prisma/migrations/
  ├── 20240117000000_metadata_extensions/
  │   └── migration.sql
  ├── 20250120131619_add_user_auth_fields/
  │   └── migration.sql
  └── migration_lock.toml
```

Each migration is stored in a directory named with a timestamp and a descriptive name. The directory contains a `migration.sql` file with the SQL statements for the migration.

## Best Practices

### Naming Migrations

Use descriptive names for migrations that clearly indicate what changes are being made:

- `add_user_auth_fields`
- `create_agent_table`
- `update_session_schema`

### Migration Content

- Keep migrations focused on specific changes
- Include comments in complex migrations to explain the purpose of changes
- Test migrations in development before applying to production

### Handling Schema Conflicts

If you encounter conflicts when creating migrations:

1. Reset your development database: `yarn db:reset`
2. Apply all migrations: `yarn db:migrate`
3. Make your schema changes
4. Create a new migration: `yarn db:migrate:dev`

## Troubleshooting

### Common Issues

#### Migration Failed

If a migration fails, you may see an error like:

```
Error: P3006: Migration `20250120131619_add_user_auth_fields` failed to apply cleanly to the shadow database.
```

Resolution:
1. Check the error message for specific issues
2. Fix the issues in your schema
3. Try again with `yarn db:migrate:dev --create-only` to create the migration without applying it
4. Review the generated SQL and make any necessary adjustments
5. Apply the migration manually: `yarn prisma migrate resolve --applied 20250120131619_add_user_auth_fields`

#### Prisma Client Generation Failed

If Prisma client generation fails:

```
Error: Error: Unable to generate Prisma Client
```

Resolution:
1. Check your schema for syntax errors
2. Ensure all referenced types exist
3. Run `yarn db:generate` to attempt generation again

## Database Schema

The current database schema includes the following main models:

- **User**: User management and authentication
- **Session**: Session management
- **Agent**: AI agent configuration
- **Pipeline**: Workflow pipeline configuration
- **Task**: Task management
- **Template**: Reusable templates

## Migration History

The project includes the following key migrations:

1. **20240117000000_metadata_extensions**: Added performance analysis extensions and materialized views
2. **20250120131619_add_user_auth_fields**: Added authentication fields to the User model
3. **20250211085834_update_schema**: Added Template model and related fields

## Conclusion

Following these guidelines will ensure smooth database migrations and maintain data integrity across all environments. Always test migrations thoroughly in development before applying them to production.
