# Database Production Deployment Guide

## Table of Contents

1. [Production Configuration](#production-configuration)
2. [Database Connection Setup](#database-connection-setup)
3. [Migration Deployment](#migration-deployment)
4. [Seeding Initial Data](#seeding-initial-data)
5. [Backup and Restore](#backup-and-restore)
6. [Performance Optimization](#performance-optimization)
7. [Monitoring and Maintenance](#monitoring-and-maintenance)
8. [Security Best Practices](#security-best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Production Configuration

### Environment Variables

Create a `.env.production` file with the following configuration:

```bash
# Database Configuration
# IMPORTANT: Replace with your actual production database credentials
DATABASE_URL="postgresql://username:password@hostname:5432/database_name?schema=public&connection_limit=20&pool_timeout=10&sslmode=require"

# Admin User Setup (for initial seed)
ADMIN_EMAIL="admin@yourdomain.com"
ADMIN_PASSWORD="<strong-random-password>"

# LLM API Keys (optional but recommended)
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."

# Environment
NODE_ENV=production

# Security
JWT_SECRET="<your-256-bit-secret-key>"

# Optional: Create system agents on first seed
CREATE_SYSTEM_AGENTS=false
```

### DATABASE_URL Parameters Explained

- **connection_limit**: Max number of connections in the pool (default: 10, recommended: 20-50)
- **pool_timeout**: Seconds to wait for connection from pool (default: 10)
- **sslmode**: SSL mode (require, prefer, disable)
  - Use `require` for production
  - Use `prefer` for development with SSL-capable databases
  - Use `disable` only for local development
- **connect_timeout**: Connection timeout in seconds (default: 5)
- **statement_timeout**: Query timeout in milliseconds (optional, e.g., 30000 for 30s)

### Recommended Production URL

```
postgresql://user:pass@host:5432/db?schema=public&connection_limit=30&pool_timeout=10&sslmode=require&connect_timeout=10
```

---

## Database Connection Setup

### CloudRuntime / Heroku / AWS RDS

Most managed database services provide a `DATABASE_URL`. Simply copy it and add the recommended parameters:

```bash
# Original CloudRuntime URL
DATABASE_URL="postgresql://postgres:password@containers-us-west-123.thenewfuse.com:1234/cloud_runtime"

# Enhanced with parameters
DATABASE_URL="postgresql://postgres:password@containers-us-west-123.thenewfuse.com:1234/cloud_runtime?connection_limit=20&pool_timeout=10&sslmode=require"
```

### Connection Pooling with PgBouncer

For high-traffic applications, use PgBouncer:

```bash
# Install PgBouncer
sudo apt-get install pgbouncer

# Configure /etc/pgbouncer/pgbouncer.ini
[databases]
your_db = host=localhost port=5432 dbname=your_db

[pgbouncer]
listen_port = 6432
listen_addr = *
auth_type = md5
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 20

# Update DATABASE_URL to use PgBouncer
DATABASE_URL="postgresql://user:pass@localhost:6432/your_db"
```

### SSL Certificate Setup

For databases requiring custom SSL certificates:

```bash
# Download certificate
wget https://your-db-provider.com/ca-certificate.crt -O /path/to/ca-cert.crt

# Update DATABASE_URL
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require&sslrootcert=/path/to/ca-cert.crt"
```

---

## Migration Deployment

### Pre-Deployment Checklist

- [ ] Backup current database
- [ ] Test migrations in staging environment
- [ ] Review migration SQL files
- [ ] Notify team of deployment window
- [ ] Prepare rollback plan

### Deployment Steps

#### 1. Check Migration Status

```bash
cd packages/database
npx drizzle migrate status
```

#### 2. Apply Pending Migrations

```bash
# Production migration (applies all pending)
npx drizzle migrate deploy

# This runs migrations without prompting
# Safe for CI/CD pipelines
```

#### 3. Apply Performance Indexes

```bash
# Connect to your database and run the optimization script
psql $DATABASE_URL -f migrations/add_production_indexes_and_constraints.sql
```

#### 4. Verify Schema

```bash
# Generate Drizzle Client
npx drizzle generate

# Validate schema
npx drizzle validate
```

### Migration Best Practices

1. **Always use `migrate deploy` in production** (not `migrate dev`)
2. **Never edit migration files** after they've been applied
3. **Test migrations** in staging first
4. **Create backups** before migrations
5. **Monitor performance** after index additions

### Rollback Strategy

If a migration fails:

```bash
# 1. Restore from backup (see Backup section)

# 2. OR manually revert the migration
psql $DATABASE_URL

# 3. Check migration history
SELECT * FROM _drizzle_migrations ORDER BY finished_at DESC;

# 4. Mark migration as rolled back
UPDATE _drizzle_migrations
SET rolled_back_at = NOW()
WHERE migration_name = 'problematic_migration_name';
```

---

## Seeding Initial Data

### First-Time Setup

```bash
cd packages/database

# Install dependencies (if not already)
npm install bcrypt

# Run seed script
npx drizzle db seed
```

### Seed Script Configuration

The seed script (`drizzle/seed.ts`) creates:

1. **Admin User**: System administrator account
2. **Demo Users**: (development only) Test accounts
3. **LLM Configurations**: Default AI provider configs
4. **System Agents**: (optional) Pre-configured agents
5. **Registered Entities**: System tools and services

### Custom Seeding

Edit `drizzle/seed.ts` to customize:

```typescript
// Add your own seed data
const customUser = await drizzle.user.create({
  data: {
    email: 'custom@example.com',
    // ... other fields
  },
});
```

### Re-running Seeds

The seed script is **idempotent** - it uses `upsert` to avoid duplicates:

```bash
# Safe to run multiple times
npx drizzle db seed
```

---

## Backup and Restore

### Automated Backups

#### PostgreSQL Automated Backup Script

Create `/etc/cron.daily/postgres-backup.sh`:

```bash
#!/bin/bash
# Daily database backup script

BACKUP_DIR="/var/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="your_database"

# Create backup directory
mkdir -p $BACKUP_DIR

# Dump database
pg_dump $DATABASE_URL > $BACKUP_DIR/${DB_NAME}_${DATE}.sql

# Compress
gzip $BACKUP_DIR/${DB_NAME}_${DATE}.sql

# Delete backups older than 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: ${DB_NAME}_${DATE}.sql.gz"
```

Make executable:

```bash
chmod +x /etc/cron.daily/postgres-backup.sh
```

### Manual Backup

```bash
# Full database dump
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Compressed backup
pg_dump $DATABASE_URL | gzip > backup_$(date +%Y%m%d).sql.gz

# Schema only
pg_dump $DATABASE_URL --schema-only > schema_backup.sql

# Data only
pg_dump $DATABASE_URL --data-only > data_backup.sql
```

### Restore from Backup

```bash
# From uncompressed backup
psql $DATABASE_URL < backup_20251118.sql

# From compressed backup
gunzip -c backup_20251118.sql.gz | psql $DATABASE_URL

# From specific tables
pg_restore -t users -t agents $DATABASE_URL backup.dump
```

### Restore Best Practices

1. **Test restores regularly** in staging
2. **Verify data integrity** after restore
3. **Document restore procedures**
4. **Keep backups in multiple locations** (local + cloud)
5. **Encrypt sensitive backups**

---

## Performance Optimization

### Indexes

The migration file `add_production_indexes_and_constraints.sql` adds:

- **50+ indexes** on foreign keys
- **Composite indexes** for common queries
- **Partial indexes** for sparse data
- **Timestamp indexes** for time-based queries

### Query Optimization

#### 1. Monitor Slow Queries

```sql
-- Enable pg_stat_statements
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- View slow queries
SELECT
  mean_exec_time,
  calls,
  query
FROM pg_stat_statements
WHERE mean_exec_time > 1000
ORDER BY mean_exec_time DESC
LIMIT 20;
```

#### 2. Analyze Index Usage

```sql
-- Check index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;

-- Find unused indexes
SELECT
  schemaname,
  tablename,
  indexname
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexname NOT LIKE 'pg_toast%';
```

#### 3. Table Statistics

```sql
-- Update table statistics for query planner
ANALYZE;

-- Vacuum and analyze
VACUUM ANALYZE;

-- Reindex if needed
REINDEX DATABASE your_database;
```

### Connection Pool Tuning

Optimal pool size formula:

```
connections = ((core_count * 2) + effective_spindle_count)
```

For a 4-core server with SSD:
```
connections = (4 * 2) + 1 = 9
```

Recommended: Start with 20-30 connections, adjust based on monitoring.

### Database Configuration

Optimize PostgreSQL settings in `postgresql.conf`:

```conf
# Connection Settings
max_connections = 100
shared_buffers = 256MB

# Query Performance
effective_cache_size = 1GB
work_mem = 16MB
maintenance_work_mem = 128MB

# Checkpoints
checkpoint_completion_target = 0.9
wal_buffers = 16MB

# Query Planning
random_page_cost = 1.1  # Lower for SSD
effective_io_concurrency = 200  # Higher for SSD
```

---

## Monitoring and Maintenance

### Health Checks

The DrizzleService provides health check endpoints:

```typescript
import { DrizzleService } from '@the-new-fuse/database';

// Check if database is healthy
const isHealthy = await drizzleService.isHealthy();

// Get detailed health status
const healthStatus = await drizzleService.getHealthStatus();
console.log(healthStatus);
// { connected: true, responseTime: 15 }

// Get database statistics
const stats = await drizzleService.getDatabaseStats();
console.log(stats);
// { users: 150, agents: 45, tasks: 320, ... }
```

### Scheduled Maintenance

#### 1. Cleanup Expired Records

Run daily via cron:

```typescript
// Cleanup expired sessions, messages, etc.
await drizzleService.cleanupExpiredRecords();
```

Cron job:

```bash
# Add to crontab
0 2 * * * cd /app && node -e "require('./packages/database/dist').DrizzleService.cleanupExpiredRecords()"
```

#### 2. Cleanup Old Logs

```typescript
// Delete logs older than 30 days
await drizzleService.cleanupOldLogs(30);
```

#### 3. Vacuum and Analyze

```bash
# Weekly full vacuum
0 3 * * 0 psql $DATABASE_URL -c "VACUUM FULL ANALYZE;"
```

### Monitoring Tools

1. **PgHero**: Web-based PostgreSQL performance dashboard
   ```bash
   gem install pghero
   pghero config:set DATABASE_URL=$DATABASE_URL
   ```

2. **pg_stat_monitor**: Advanced query monitoring
   ```sql
   CREATE EXTENSION pg_stat_monitor;
   ```

3. **Datadog / New Relic**: APM with database monitoring

### Key Metrics to Monitor

- **Connection count**: Should stay below max_connections
- **Query response time**: P95 should be < 100ms
- **Index hit ratio**: Should be > 99%
- **Table bloat**: Vacuum if bloat > 20%
- **Replication lag**: For replicas, should be < 1 second

---

## Security Best Practices

### 1. Credential Management

**NEVER** commit credentials to git:

```bash
# .gitignore should include
.env
.env.production
.env.local
```

Use environment variables or secret management:

```bash
# CloudRuntime
cloud_runtime variables set DATABASE_URL=postgresql://...

# Heroku
heroku config:set DATABASE_URL=postgresql://...

# Kubernetes
kubectl create secret generic db-secrets \
  --from-literal=database-url='postgresql://...'
```

### 2. Encrypt API Keys

The `LLMConfig.apiKey` field should be encrypted:

```typescript
// Use encryption utility (create if needed)
import { encrypt, decrypt } from './utils/encryption';

const encrypted = encrypt(apiKey);
await drizzle.lLMConfig.create({
  data: {
    apiKey: encrypted,
    // ...
  },
});
```

### 3. Row-Level Security (RLS)

For multi-tenant applications, enable RLS in PostgreSQL:

```sql
-- Enable RLS on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY user_isolation ON users
  USING (id = current_setting('app.current_user_id')::uuid);
```

### 4. SSL/TLS Enforcement

```sql
-- Require SSL for all connections
ALTER DATABASE your_database SET ssl TO on;
```

### 5. Audit Logging

Enable PostgreSQL audit logging:

```conf
# postgresql.conf
log_statement = 'mod'  # Log all modifications
log_connections = on
log_disconnections = on
log_duration = on
```

### 6. Database User Permissions

Create separate users for different purposes:

```sql
-- Application user (limited permissions)
CREATE USER app_user WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE your_db TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;

-- Read-only user (for analytics)
CREATE USER readonly_user WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE your_db TO readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;
```

---

## Troubleshooting

### Common Issues

#### 1. Connection Pool Exhausted

**Symptoms**: "Error: Timed out fetching a new connection from the connection pool"

**Solutions**:
```bash
# Increase connection limit
DATABASE_URL="...?connection_limit=50"

# Or use PgBouncer (recommended)
```

#### 2. Slow Queries

**Symptoms**: High response times, timeout errors

**Solutions**:
```sql
-- Find slow queries
SELECT * FROM pg_stat_activity WHERE state = 'active' AND query_start < NOW() - INTERVAL '30 seconds';

-- Kill slow query
SELECT pg_terminate_backend(pid);

-- Add missing indexes (see Performance section)
```

#### 3. Migration Conflicts

**Symptoms**: "Migration failed to apply"

**Solutions**:
```bash
# Check migration status
npx drizzle migrate status

# Resolve manually in database
psql $DATABASE_URL

# Mark as applied (if manually fixed)
INSERT INTO _drizzle_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
VALUES ('unique-id', 'checksum', NOW(), '20250101000000_migration_name', NULL, NULL, NOW(), 1);
```

#### 4. Database Bloat

**Symptoms**: Large database size, slow queries despite indexes

**Solutions**:
```sql
-- Check table bloat
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Vacuum specific table
VACUUM FULL ANALYZE table_name;
```

#### 5. SSL Connection Errors

**Symptoms**: "SSL connection error" or "certificate verify failed"

**Solutions**:
```bash
# Disable SSL verification (NOT recommended for production)
DATABASE_URL="...?sslmode=disable"

# Use proper SSL mode
DATABASE_URL="...?sslmode=require"

# Or download and use CA certificate
DATABASE_URL="...?sslmode=require&sslrootcert=/path/to/ca-cert.crt"
```

### Diagnostic Commands

```bash
# Check database connection
psql $DATABASE_URL -c "SELECT version();"

# Check migration status
npx drizzle migrate status

# Validate schema
npx drizzle validate

# Generate client
npx drizzle generate

# View database URL (masked)
echo $DATABASE_URL | sed 's/:.*@/:***@/'

# Test connection with retry
node -e "const { DrizzleClient } = require('./generated/drizzle'); new DrizzleClient().\$connect().then(() => console.log('Connected!')).catch(console.error);"
```

### Getting Help

1. **Check logs**: Application logs and PostgreSQL logs
2. **Drizzle documentation**: https://www.drizzle.io/docs
3. **PostgreSQL documentation**: https://www.postgresql.org/docs
4. **Community**: Drizzle Discord, Stack Overflow

---

## Quick Reference

### Essential Commands

```bash
# Migration commands
npx drizzle migrate deploy          # Apply migrations (production)
npx drizzle migrate status          # Check migration status
npx drizzle migrate resolve         # Resolve migration issues

# Database commands
npx drizzle db push                 # Sync schema without migration (dev only)
npx drizzle db pull                 # Pull schema from database
npx drizzle db seed                 # Seed database

# Client commands
npx drizzle generate                # Generate Drizzle Client
npx drizzle studio                  # Open Drizzle Studio (GUI)
npx drizzle validate                # Validate schema

# Maintenance
npx drizzle format                  # Format schema file
```

### Connection String Templates

```bash
# PostgreSQL
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public&connection_limit=20&sslmode=require

# PostgreSQL with PgBouncer
postgresql://USER:PASSWORD@localhost:6432/DATABASE

# PostgreSQL with SSL certificate
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require&sslrootcert=/path/to/cert.crt
```

---

## Deployment Checklist

Before deploying to production:

- [ ] Set strong admin password (not default)
- [ ] Configure DATABASE_URL with connection pooling
- [ ] Enable SSL (sslmode=require)
- [ ] Apply all migrations (`migrate deploy`)
- [ ] Run optimization indexes script
- [ ] Seed initial data (`db seed`)
- [ ] Set up automated backups
- [ ] Configure monitoring and alerts
- [ ] Test database health checks
- [ ] Document credentials securely
- [ ] Set up scheduled maintenance jobs
- [ ] Review security settings
- [ ] Test restore procedure in staging
- [ ] Configure connection pooling (PgBouncer if needed)
- [ ] Optimize PostgreSQL configuration
- [ ] Enable query logging for debugging

---

## Support and Maintenance

For issues or questions:

1. Check this documentation
2. Review Drizzle documentation
3. Check application logs
4. Contact database administrator
5. Create issue in project repository

**Last Updated**: 2025-11-18
**Schema Version**: 1.0.0
**Drizzle Version**: 6.19.0
