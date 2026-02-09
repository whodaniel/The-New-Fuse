# Backup Procedures

## Overview

This document outlines the backup procedures for The New Fuse, covering database backups, file storage backups, and configuration backups.

## Database Backup

### PostgreSQL Backup (Local)

1. Create a backup:
   ```bash
   pg_dump -h localhost -U postgres -d fuse > backup.sql
   ```

2. Automated daily backups:
   ```bash
   # Add to crontab
   0 0 * * * pg_dump -h localhost -U postgres -d fuse > /path/to/backups/fuse_$(date +\%Y\%m\%d).sql
   ```

### PostgreSQL Backup (Production)

1. Manual backup:
   ```bash
   # Full backup
   pg_dump -h [host] -U [username] -d fuse > backup.sql

   # Schema only
   pg_dump -h [host] -U [username] -d fuse --schema-only > schema.sql

   # Data only
   pg_dump -h [host] -U [username] -d fuse --data-only > data.sql
   ```

2. Restore from backup:
   ```bash
   psql -h localhost -U postgres -d fuse < backup.sql
   ```

### Prisma Schema Backup

1. Keep Prisma migration files in version control:
   ```bash
   git add packages/database/prisma/migrations/*
   ```

2. Backup schema file:
   ```bash
   cp packages/database/prisma/schema.prisma schema.backup.prisma
   ```

### Recovery Testing

1. Create a test database:
   ```bash
   createdb fuse_test
   ```

2. Restore backup to test database:
   ```bash
   psql -h localhost -U postgres -d fuse_test < backup.sql
   ```

3. Verify data integrity:
   ```bash
   psql -h localhost -U postgres -d fuse_test -c "SELECT COUNT(*) FROM users;"
   ```

## File Storage Backups

### User Uploads Backup

```bash
#!/bin/bash
# /scripts/backup/uploads-backup.sh

UPLOADS_DIR="/data/uploads"
BACKUP_DIR="/backups/uploads"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create tar archive
tar -czf "$BACKUP_DIR/uploads_$TIMESTAMP.tar.gz" $UPLOADS_DIR

# Remove old backups
find $BACKUP_DIR -type f -mtime +30 -delete
```

### Configuration Backup

```bash
#!/bin/bash
# /scripts/backup/config-backup.sh

# Backup environment files
cp .env.production "/backups/config/env_$(date +%Y%m%d).backup"

# Backup nginx configuration
cp /etc/nginx/conf.d/* "/backups/config/nginx_$(date +%Y%m%d)/"

# Backup Docker Compose files
cp docker-compose*.yml "/backups/config/docker_$(date +%Y%m%d)/"
```

## Backup Schedule

### Cron Configuration

```bash
# /etc/cron.d/backups
# Database backups
0 1 * * * root /scripts/backup/postgres-backup.sh >> /var/log/postgres-backup.log 2>&1

# File storage backups
0 2 * * * root /scripts/backup/uploads-backup.sh >> /var/log/uploads-backup.log 2>&1

# Configuration backups
0 3 * * 0 root /scripts/backup/config-backup.sh >> /var/log/config-backup.log 2>&1
```

## Backup Monitoring

### Check Backup Status

```bash
#!/bin/bash
# /scripts/backup/check-backups.sh

# Check PostgreSQL backups
LATEST_PG=$(ls -t /backups/postgres/ | head -1)
if [ -z "$LATEST_PG" ] || [ $(find /backups/postgres/$LATEST_PG -mtime +1) ]; then
    echo "PostgreSQL backup is outdated or missing"
    exit 1
fi

# Check Redis backup
if [ $(find /data/dump.rdb -mtime +1) ]; then
    echo "Redis backup is outdated"
    exit 1
fi

# Check uploads backup
LATEST_UPLOADS=$(ls -t /backups/uploads/ | head -1)
if [ -z "$LATEST_UPLOADS" ] || [ $(find /backups/uploads/$LATEST_UPLOADS -mtime +1) ]; then
    echo "Uploads backup is outdated or missing"
    exit 1
fi
```

## Backup Recovery

See [Recovery Procedures](recovery.md) for detailed recovery steps.

## Backup Storage

### Storage Requirements

- Database: ~100MB per daily backup
- Uploads: ~1GB per daily backup
- Configurations: ~1MB per weekly backup

### Storage Rotation

- Database backups: 30 days retention
- Upload backups: 30 days retention
- Configuration backups: 90 days retention

## Related Documentation

- [Recovery Procedures](recovery.md)
- [Monitoring Guide](monitoring.md)
- [Deployment Guide](deployment.md)
