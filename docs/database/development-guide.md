# Database Development Guide

## Environment Setup

The New Fuse uses Prisma with PostgreSQL and Prisma Accelerate for database management.

### Development Options

#### Option 1: Using Prisma Accelerate (Recommended for team collaboration)
- Uses the same DATABASE_URL for all environments through Prisma Accelerate
- Ensures consistency between all developers
- Requires internet connection
- Configuration is already set in .env file

#### Option 2: Using Local PostgreSQL (For offline development)
1. Start your local PostgreSQL server
2. Create a .env.local file with your local connection string:
   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fuse"
   ```
3. Use `npx prisma migrate dev` for schema changes
4. Use `npx prisma db push` for quick iterations

### Switching Between Environments

To switch between local and Accelerate:
```bash
# Use local database
cp .env.local .env && npx prisma generate

# Use Accelerate (production-like)
cp .env.accelerate .env && npx prisma generate
```

## Database Migration Workflow

1. Make changes to your Prisma schema
2. Run migrations on development environment:
   ```bash
   npx prisma migrate dev --name [change-description]
   ```
3. Test changes thoroughly
4. For production, apply migrations:
   ```bash
   npx prisma migrate deploy
   ```

## Best Practices

1. **Schema Changes**:
   - All schema changes should begin with migration on development
   - Migrations should be reviewed before applying to production
   - Use meaningful migration names

2. **Data Integrity**:
   - Backup production data before migrations
   - Test migrations with similar data volume
   - Consider data migration scripts for complex changes

3. **Environment Management**:
   - Keep environment-specific .env files for different contexts
   - Never commit sensitive DATABASE_URLs to version control
   - Store production credentials securely

## Troubleshooting

If you encounter database connectivity issues:
1. Check your .env file DATABASE_URL
2. Verify network connectivity for Prisma Accelerate
3. Run `npx prisma db pull` to verify database connection
4. Check for PostgreSQL server status if using local database
