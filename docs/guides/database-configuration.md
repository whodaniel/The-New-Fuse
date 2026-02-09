# Database Configuration Guide

## Overview

The New Fuse uses PostgreSQL as the primary database and Redis for caching/messaging. Both services can run locally or in Docker containers for development, with production deployment supporting various cloud providers.

## Architecture

```
┌─────────────────────────────────────────────────┐
│              Application Layer                  │
├─────────────────┬───────────────────────────────┤
│   Backend API   │         Frontend             │
│   (NestJS)      │      (React + Vite)          │
└─────────────────┴───────────────────────────────┘
         │                        │
         ▼                        ▼
┌─────────────────────────────────────────────────┐
│              Data Layer                         │
├─────────────────────┬───────────────────────────┤
│    PostgreSQL       │         Redis             │
│   (Primary DB)      │    (Cache/Sessions)       │
│   Port: 5433        │    Port: 6380            │
└─────────────────────┴───────────────────────────┘
```

## PostgreSQL Configuration

### Docker Development Setup

**Container Details:**
- Image: `postgres:14-alpine`
- Container: `tnf-postgres-dev`
- Host Port: `5433`
- Internal Port: `5432`

**Database Configuration:**
```yaml
Database: the_new_fuse_dev
Username: newfuse
Password: secretpass123
Host: localhost (from application)
Port: 5433
```

**Connection String:**
```
postgresql://newfuse:secretpass123@localhost:5433/the_new_fuse_dev
```

### Environment Variables

```bash
# Docker PostgreSQL
DATABASE_URL=postgresql://newfuse:secretpass123@localhost:5433/the_new_fuse_dev
DB_HOST=localhost
DB_PORT=5433
DB_USER=newfuse
DB_PASSWORD=secretpass123
DB_NAME=the_new_fuse_dev
```

### Starting PostgreSQL

```bash
# Start with Docker (recommended)
pnpm run docker:start

# Check if running
docker ps | grep postgres

# Connect to database
docker exec -it tnf-postgres-dev psql -U newfuse -d the_new_fuse_dev
```

### Database Operations

```bash
# Connect to PostgreSQL CLI
docker exec -it tnf-postgres-dev psql -U newfuse -d the_new_fuse_dev

# List databases
\l

# List tables
\dt

# Describe table
\d table_name

# Exit
\q
```

### Backup & Restore

```bash
# Create backup
docker exec tnf-postgres-dev pg_dump -U newfuse -d the_new_fuse_dev > backup.sql

# Restore from backup
docker exec -i tnf-postgres-dev psql -U newfuse -d the_new_fuse_dev < backup.sql

# Create compressed backup
docker exec tnf-postgres-dev pg_dump -U newfuse -d the_new_fuse_dev | gzip > backup.sql.gz
```

## Redis Configuration

### Docker Development Setup

**Container Details:**
- Image: `redis:6`
- Container: `tnf-redis-dev`
- Host Port: `6380`
- Internal Port: `6379`

**Redis Configuration:**
```yaml
Host: localhost
Port: 6380
Database: 0 (default)
Persistence: AOF enabled
```

**Connection String:**
```
redis://localhost:6380
```

### Environment Variables

```bash
# Docker Redis
REDIS_HOST=localhost
REDIS_PORT=6380
REDIS_PASSWORD=
REDIS_DB=0
REDIS_TLS=false
REDIS_URL=redis://localhost:6380
```

### Starting Redis

```bash
# Start with Docker (recommended)
pnpm run docker:start

# Check if running
docker ps | grep redis

# Connect to Redis CLI
docker exec -it tnf-redis-dev redis-cli
```

### Redis Operations

```bash
# Connect to Redis CLI
docker exec -it tnf-redis-dev redis-cli

# Test connection
PING

# View info
INFO

# List all keys
KEYS *

# Get value
GET key_name

# Set value
SET key_name value

# View statistics
INFO stats

# Exit
exit
```

### Redis Persistence

```bash
# Force save to disk
docker exec tnf-redis-dev redis-cli BGSAVE

# Check last save
docker exec tnf-redis-dev redis-cli LASTSAVE

# View persistence info
docker exec tnf-redis-dev redis-cli CONFIG GET save
```

## Application Integration

### Backend Database Connection

The backend API automatically connects to the configured database:

```typescript
// System Controller detects services
@Get('services/status')
async getServicesStatus() {
  return [
    {
      name: 'PostgreSQL Database',
      status: await this.checkDockerContainer('tnf-postgres-dev') ? 'running' : 'stopped',
      port: 5433,
      type: 'database',
      health: 'healthy'
    }
  ];
}
```

### Frontend API Integration

Frontend connects to backend which manages database connections:

```typescript
// Service status API call
const services = await fetch('http://localhost:3004/api/services/status')
  .then(response => response.json());
```

### Electron Integration

Electron app connects to the same backend APIs:

```typescript
// IPC handler for service status
ipcMain.handle('services:list', async () => {
  const response = await fetch('http://localhost:3004/api/services/status');
  return response.json();
});
```

## Data Management

### Schema Management

Currently using direct SQL. Future integration with Prisma ORM:

```sql
-- Example schema
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE agents (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'idle',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Seeding Data

```bash
# Connect and insert test data
docker exec -i tnf-postgres-dev psql -U newfuse -d the_new_fuse_dev << EOF
INSERT INTO agents (name, type, status) VALUES 
  ('Test Agent 1', 'general', 'active'),
  ('Test Agent 2', 'specialized', 'idle');
EOF
```

### Migrations (Future)

When Prisma is integrated:

```bash
# Generate migration
pnpm run db:migrate

# Reset database
pnpm run db:reset

# Seed database
pnpm run db:seed
```

## Performance Tuning

### PostgreSQL Optimization

```sql
-- View active connections
SELECT * FROM pg_stat_activity;

-- Check database size
SELECT pg_size_pretty(pg_database_size('the_new_fuse_dev'));

-- View table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Redis Optimization

```bash
# Check memory usage
docker exec tnf-redis-dev redis-cli INFO memory

# Check performance stats
docker exec tnf-redis-dev redis-cli INFO stats

# Monitor in real-time
docker exec tnf-redis-dev redis-cli MONITOR
```

### Connection Pooling

For production, implement connection pooling:

```typescript
// PostgreSQL connection pool (future)
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

## Monitoring & Health Checks

### Built-in Health Checks

The system includes automatic health monitoring:

```bash
# Check service status
curl http://localhost:3004/api/services/status

# Test Docker connectivity
pnpm run docker:test

# View system metrics
curl http://localhost:3004/api/system/metrics
```

### Database Health

```sql
-- Check PostgreSQL health
SELECT version();
SELECT now();
SELECT count(*) FROM pg_stat_activity;
```

```bash
# Check Redis health
docker exec tnf-redis-dev redis-cli PING
docker exec tnf-redis-dev redis-cli INFO replication
```

## Environment-Specific Configuration

### Development

```bash
# Docker containers for development
DATABASE_URL=postgresql://newfuse:secretpass123@localhost:5433/the_new_fuse_dev
REDIS_URL=redis://localhost:6380
```

### Production

```bash
# Production cloud databases
DATABASE_URL=postgresql://prod_user:secure_password@prod-db-host:5432/production_db
REDIS_URL=redis://prod-redis-host:6379
# Additional production settings
DB_SSL=true
REDIS_TLS=true
CONNECTION_POOL_SIZE=50
```

### Testing

```bash
# Separate test database
DATABASE_URL=postgresql://newfuse:secretpass123@localhost:5433/the_new_fuse_test
REDIS_URL=redis://localhost:6380/1
```

## Security Configuration

### Database Security

```sql
-- Create read-only user for reporting
CREATE USER readonly_user WITH PASSWORD 'readonly_password';
GRANT CONNECT ON DATABASE the_new_fuse_dev TO readonly_user;
GRANT USAGE ON SCHEMA public TO readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;
```

### Redis Security

```bash
# Set Redis password (in redis.conf)
requirepass your_redis_password

# Disable dangerous commands
rename-command FLUSHDB ""
rename-command FLUSHALL ""
```

### Environment Security

```bash
# Use strong passwords
DB_PASSWORD=$(openssl rand -base64 32)
REDIS_PASSWORD=$(openssl rand -base64 32)

# Enable SSL/TLS in production
DB_SSL=require
REDIS_TLS=true
```

## Troubleshooting

### Common Issues

**1. Connection Refused**
```bash
# Check if Docker containers are running
docker ps | grep -E "postgres|redis"

# Restart containers
pnpm run docker:stop
pnpm run docker:start
```

**2. Port Conflicts**
```bash
# Check port usage
lsof -i :5433
lsof -i :6380

# Kill conflicting processes
kill -9 $(lsof -ti :5433)
```

**3. Data Persistence Issues**
```bash
# Check Docker volumes
docker volume ls | grep postgres
docker volume ls | grep redis

# Inspect volume
docker volume inspect the-new-fuse_postgres_dev_data
```

**4. Performance Issues**
```bash
# Check PostgreSQL performance
docker exec tnf-postgres-dev psql -U newfuse -d the_new_fuse_dev -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"

# Check Redis performance
docker exec tnf-redis-dev redis-cli INFO stats
```

### Logging

```bash
# PostgreSQL logs
docker logs tnf-postgres-dev

# Redis logs
docker logs tnf-redis-dev

# Follow logs in real-time
docker logs -f tnf-postgres-dev
docker logs -f tnf-redis-dev
```

### Recovery Procedures

```bash
# Recreate containers (data preserved in volumes)
pnpm run docker:stop
docker-compose -f docker-compose.dev-simple.yml up --force-recreate -d

# Complete reset (destroys data)
docker-compose -f docker-compose.dev-simple.yml down -v
pnpm run docker:start
```

## Production Deployment

### Cloud Providers

**PostgreSQL Options:**
- AWS RDS PostgreSQL
- Google Cloud SQL for PostgreSQL  
- DigitalOcean Managed Databases
- Supabase
- Neon

**Redis Options:**
- AWS ElastiCache
- Google Cloud Memorystore
- DigitalOcean Managed Redis
- Redis Cloud
- Upstash

### Migration Strategy

```bash
# 1. Export development data
docker exec tnf-postgres-dev pg_dump -U newfuse -d the_new_fuse_dev > dev-backup.sql

# 2. Create production database
# (via cloud provider console)

# 3. Import to production
psql -h prod-host -U prod-user -d prod-db < dev-backup.sql

# 4. Update environment variables
DATABASE_URL=postgresql://prod-user:prod-pass@prod-host:5432/prod-db
```

## Future Enhancements

1. **Prisma Integration**: ORM for type-safe database operations
2. **Database Migrations**: Automated schema management
3. **Connection Pooling**: Optimize database connections
4. **Read Replicas**: Scale read operations
5. **Backup Automation**: Scheduled backups to cloud storage
6. **Monitoring**: Grafana dashboards for database metrics
7. **Caching Strategy**: Redis caching layers for API responses

## Support

For database-related issues:
1. Check container status: `pnpm run docker:status`
2. View logs: `pnpm run docker:logs`
3. Test connectivity: `pnpm run docker:test`
4. Check the troubleshooting section above
5. Review Docker container health checks