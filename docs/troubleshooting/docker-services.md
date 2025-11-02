# Docker Services Troubleshooting Guide

## Overview

This guide covers common issues when running The New Fuse with Docker infrastructure and provides step-by-step solutions.

## Quick Diagnosis

### Check Service Status
```bash
# Check all Docker services
pnpm run docker:status

# Test connectivity
pnpm run docker:test

# View service logs
pnpm run docker:logs
```

### Common Status Indicators

**✅ Healthy Services:**
```
NAME               STATUS                   PORTS
tnf-postgres-dev   Up X minutes (healthy)   0.0.0.0:5433->5432/tcp
tnf-redis-dev      Up X minutes (healthy)   0.0.0.0:6380->6379/tcp
```

**❌ Unhealthy Services:**
```
NAME               STATUS
tnf-postgres-dev   Restarting (1) X seconds ago
tnf-redis-dev      Exited (127) X seconds ago
```

## PostgreSQL Issues

### Problem: Container Won't Start

**Symptoms:**
- `docker ps` shows no PostgreSQL container
- Connection errors to port 5433
- "Container tnf-postgres-dev not found" errors

**Solutions:**

1. **Check Port Conflicts:**
   ```bash
   # Check if port 5433 is in use
   lsof -i :5433
   
   # If something is using the port, kill it:
   kill -9 $(lsof -ti :5433)
   
   # Or change the port in docker-compose.dev-simple.yml
   ```

2. **Restart Docker Services:**
   ```bash
   pnpm run docker:stop
   pnpm run docker:start
   ```

3. **Check Docker Daemon:**
   ```bash
   # Ensure Docker is running
   docker info
   
   # If not running, start Docker Desktop
   open -a Docker
   ```

### Problem: PostgreSQL Health Check Failing

**Symptoms:**
- Container shows as "unhealthy"
- Connection timeouts
- Database queries fail

**Solutions:**

1. **Check Container Logs:**
   ```bash
   docker logs tnf-postgres-dev
   ```

2. **Manual Health Check:**
   ```bash
   # Test from within container
   docker exec tnf-postgres-dev pg_isready -U newfuse
   
   # Should return: localhost:5432 - accepting connections
   ```

3. **Recreate Container:**
   ```bash
   docker-compose -f docker-compose.dev-simple.yml down
   docker-compose -f docker-compose.dev-simple.yml up -d postgres-dev
   ```

### Problem: Database Connection Refused

**Symptoms:**
- "Connection refused" errors in application
- Cannot connect via psql
- Backend API shows database as stopped

**Solutions:**

1. **Verify Connection Details:**
   ```bash
   # Test connection
   docker exec tnf-postgres-dev psql -U newfuse -d the_new_fuse_dev -c "SELECT 1;"
   ```

2. **Check Environment Variables:**
   ```bash
   echo $DATABASE_URL
   # Should be: postgresql://newfuse:secretpass123@localhost:5433/the_new_fuse_dev
   ```

3. **Test Network Connectivity:**
   ```bash
   # Test from host
   telnet localhost 5433
   ```

### Problem: Data Loss/Corruption

**Symptoms:**
- Missing tables or data
- Database appears empty
- Startup errors about corrupted data

**Solutions:**

1. **Check Volume Status:**
   ```bash
   docker volume ls | grep postgres
   docker volume inspect the-new-fuse_postgres_dev_data
   ```

2. **Restore from Backup:**
   ```bash
   # If you have a backup
   docker exec -i tnf-postgres-dev psql -U newfuse -d the_new_fuse_dev < backup.sql
   ```

3. **Complete Reset (CAUTION: Destroys all data):**
   ```bash
   docker-compose -f docker-compose.dev-simple.yml down -v
   pnpm run docker:start
   ```

## Redis Issues

### Problem: Redis Container Crashing

**Symptoms:**
- Container status shows "Restarting" or "Exited"
- Architecture/library errors in logs
- Connection refused to port 6380

**Solutions:**

1. **Check Container Logs:**
   ```bash
   docker logs tnf-redis-dev
   ```

2. **Architecture Issues (Common on Apple Silicon):**
   ```bash
   # If you see library/symbol errors, try different image
   # Edit docker-compose.dev-simple.yml:
   # Change image from redis:7-alpine to redis:6
   ```

3. **Port Conflict:**
   ```bash
   # Check port usage
   lsof -i :6380
   
   # Change port if needed in docker-compose.dev-simple.yml
   ```

### Problem: Redis Memory Issues

**Symptoms:**
- Container runs but crashes under load
- Memory-related errors in logs
- Slow Redis operations

**Solutions:**

1. **Check Memory Usage:**
   ```bash
   docker exec tnf-redis-dev redis-cli INFO memory
   ```

2. **Configure Memory Limits:**
   ```yaml
   # Add to docker-compose.dev-simple.yml
   redis-dev:
     image: redis:6
     deploy:
       resources:
         limits:
           memory: 512M
   ```

3. **Clear Redis Data:**
   ```bash
   docker exec tnf-redis-dev redis-cli FLUSHALL
   ```

### Problem: Redis Connection Timeout

**Symptoms:**
- Application shows Redis as disconnected
- Timeout errors in application logs
- Redis CLI connection fails

**Solutions:**

1. **Test Connection:**
   ```bash
   docker exec tnf-redis-dev redis-cli ping
   # Should return: PONG
   ```

2. **Check Network Configuration:**
   ```bash
   # Test from host
   telnet localhost 6380
   ```

3. **Restart Redis:**
   ```bash
   docker restart tnf-redis-dev
   ```

## Docker Compose Issues

### Problem: Services Won't Start

**Symptoms:**
- `docker-compose up` fails
- Network or volume creation errors
- Permission denied errors

**Solutions:**

1. **Clean Docker State:**
   ```bash
   # Remove containers and networks
   docker-compose -f docker-compose.dev-simple.yml down
   
   # Clean up unused resources
   docker system prune -f
   
   # Restart
   pnpm run docker:start
   ```

2. **Fix Permissions (macOS):**
   ```bash
   sudo chown -R $(whoami) ~/.docker
   ```

3. **Update Docker Compose File:**
   ```bash
   # Remove version warning by editing docker-compose.dev-simple.yml
   # Delete the line: version: '3.8'
   ```

### Problem: Network Conflicts

**Symptoms:**
- "Network already exists" errors
- Services can't communicate
- Port binding failures

**Solutions:**

1. **Remove Conflicting Networks:**
   ```bash
   docker network ls
   docker network rm tnf-dev-network
   ```

2. **Use Different Network Name:**
   ```yaml
   # In docker-compose.dev-simple.yml
   networks:
     tnf-dev:
       name: tnf-dev-network-$(date +%s)
   ```

### Problem: Volume Permission Issues

**Symptoms:**
- Database can't write to disk
- Permission denied errors in logs
- Data not persisting

**Solutions:**

1. **Check Volume Ownership:**
   ```bash
   docker volume inspect the-new-fuse_postgres_dev_data
   ```

2. **Reset Volumes:**
   ```bash
   docker-compose -f docker-compose.dev-simple.yml down -v
   docker volume prune -f
   pnpm run docker:start
   ```

## Application Integration Issues

### Problem: Backend Can't Connect to Database

**Symptoms:**
- Backend logs show connection errors
- API returns database connection errors
- Service status API shows database as stopped

**Solutions:**

1. **Check Environment Variables:**
   ```bash
   # Load Docker environment
   export $(cat .env.docker | xargs)
   echo $DATABASE_URL
   ```

2. **Test Connection from Backend:**
   ```bash
   # Manual connection test
   node -e "
   const { Client } = require('pg');
   const client = new Client('postgresql://newfuse:secretpass123@localhost:5433/the_new_fuse_dev');
   client.connect().then(() => {
     console.log('Connected!');
     client.end();
   }).catch(console.error);
   "
   ```

3. **Update Backend Configuration:**
   ```typescript
   // Ensure backend uses correct connection string
   const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://newfuse:secretpass123@localhost:5433/the_new_fuse_dev';
   ```

### Problem: Frontend Can't Reach Backend

**Symptoms:**
- Frontend shows "Network Error"
- API calls fail
- Service status not updating

**Solutions:**

1. **Check Backend Status:**
   ```bash
   curl http://localhost:3004/api/services/status
   ```

2. **Verify Backend is Running:**
   ```bash
   lsof -i :3004
   pnpm run dev:backend
   ```

3. **Check CORS Configuration:**
   ```typescript
   // Backend should allow frontend origin
   app.enableCors({
     origin: 'http://localhost:3000'
   });
   ```

## Performance Issues

### Problem: Slow Database Queries

**Symptoms:**
- Application feels sluggish
- Long response times
- Database connection timeouts

**Solutions:**

1. **Check Active Connections:**
   ```sql
   docker exec tnf-postgres-dev psql -U newfuse -d the_new_fuse_dev -c "
   SELECT count(*) as active_connections 
   FROM pg_stat_activity 
   WHERE state = 'active';
   "
   ```

2. **Monitor Query Performance:**
   ```sql
   docker exec tnf-postgres-dev psql -U newfuse -d the_new_fuse_dev -c "
   SELECT query, calls, total_time, mean_time 
   FROM pg_stat_statements 
   ORDER BY total_time DESC LIMIT 10;
   "
   ```

3. **Optimize Docker Resources:**
   ```yaml
   # In docker-compose.dev-simple.yml
   postgres-dev:
     image: postgres:14-alpine
     deploy:
       resources:
         limits:
           memory: 1G
           cpus: '1'
   ```

### Problem: High Memory Usage

**Symptoms:**
- System running out of memory
- Docker containers being killed
- Slow overall performance

**Solutions:**

1. **Monitor Resource Usage:**
   ```bash
   docker stats
   ```

2. **Limit Container Memory:**
   ```yaml
   # Add to docker-compose.dev-simple.yml
   services:
     postgres-dev:
       deploy:
         resources:
           limits:
             memory: 512M
     redis-dev:
       deploy:
         resources:
           limits:
             memory: 256M
   ```

3. **Clean Up Resources:**
   ```bash
   docker system prune -a
   docker volume prune
   ```

## Recovery Procedures

### Complete System Reset

**When all else fails:**

```bash
# 1. Stop all services
pnpm run docker:stop
docker stop $(docker ps -q)

# 2. Remove containers and volumes (DESTROYS DATA)
docker-compose -f docker-compose.dev-simple.yml down -v
docker system prune -a -f
docker volume prune -f

# 3. Restart Docker
sudo systemctl restart docker  # Linux
# Or restart Docker Desktop on macOS/Windows

# 4. Start fresh
pnpm run docker:start
pnpm run docker:test
```

### Data Recovery

**If you need to recover data:**

```bash
# 1. Create backup before reset
docker exec tnf-postgres-dev pg_dump -U newfuse -d the_new_fuse_dev > emergency-backup.sql

# 2. After reset, restore data
docker exec -i tnf-postgres-dev psql -U newfuse -d the_new_fuse_dev < emergency-backup.sql
```

## Monitoring and Logging

### Enable Debug Logging

```bash
# PostgreSQL debug logs
docker exec tnf-postgres-dev psql -U newfuse -d the_new_fuse_dev -c "
ALTER SYSTEM SET log_statement = 'all';
SELECT pg_reload_conf();
"

# Redis debug logs
docker exec tnf-redis-dev redis-cli CONFIG SET loglevel verbose
```

### Continuous Monitoring

```bash
# Monitor all container logs
docker-compose -f docker-compose.dev-simple.yml logs -f

# Monitor specific service
docker logs -f tnf-postgres-dev

# Monitor resource usage
watch docker stats
```

## Prevention Best Practices

### Development Workflow

1. **Always check Docker status before starting:**
   ```bash
   pnpm run docker:status
   ```

2. **Use test script regularly:**
   ```bash
   pnpm run docker:test
   ```

3. **Monitor logs during development:**
   ```bash
   pnpm run docker:logs
   ```

### System Maintenance

1. **Regular cleanup:**
   ```bash
   # Weekly cleanup
   docker system prune -f
   docker volume prune -f
   ```

2. **Backup important data:**
   ```bash
   # Daily backup
   docker exec tnf-postgres-dev pg_dump -U newfuse -d the_new_fuse_dev > backup-$(date +%Y%m%d).sql
   ```

3. **Monitor disk space:**
   ```bash
   docker system df
   ```

## Getting Help

### Diagnostic Information to Collect

When reporting issues, include:

```bash
# System info
docker version
docker-compose version
bun --version

# Service status
pnpm run docker:status
pnpm run docker:test

# Container logs
docker logs tnf-postgres-dev --tail 50
docker logs tnf-redis-dev --tail 50

# Resource usage
docker stats --no-stream

# Network info
docker network ls
```

### Support Channels

1. Check container logs first
2. Try the solutions in this guide
3. Use the recovery procedures if needed
4. Collect diagnostic information
5. Report issues with full context