#!/bin/bash
set -e

echo "🔍 Running pre-deployment verification..."

# Verify environment variables
if [ ! -f .env.production ]; then
    echo "❌ Production environment file missing"
    exit 1
fi

# Check infrastructure readiness
docker-compose -f docker/production.yml config --quiet
if [ $? -ne 0 ]; then
    echo "❌ Docker compose validation failed"
    exit 1
fi

# Verify database backup
./scripts/backup-database.sh
if [ $? -ne 0 ]; then
    echo "❌ Database backup failed"
    exit 1
fi

echo "✅ Pre-deployment verification complete"