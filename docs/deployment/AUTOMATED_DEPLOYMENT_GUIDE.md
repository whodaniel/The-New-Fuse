# Automated Deployment Guide

Complete guide for The New Fuse automated deployment system with zero-downtime capabilities.

## Table of Contents

1. [Overview](#overview)
2. [Deployment Strategies](#deployment-strategies)
3. [Prerequisites](#prerequisites)
4. [Quick Start](#quick-start)
5. [Deployment Scripts](#deployment-scripts)
6. [Configuration](#configuration)
7. [Monitoring & Notifications](#monitoring--notifications)
8. [Rollback Procedures](#rollback-procedures)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

## Overview

The automated deployment system provides multiple deployment strategies with built-in health checks, smoke tests, and automatic rollback capabilities.

### Key Features

- **Multiple Deployment Strategies**: Rolling updates, blue-green, and canary deployments
- **Zero-Downtime Deployments**: Seamless transitions with no service interruption
- **Automated Health Checks**: Comprehensive service and infrastructure validation
- **Database Migration Management**: Safe migrations with automatic backup and rollback
- **Notification System**: Real-time updates via Slack, Discord, and Email
- **Rollback Automation**: Instant rollback on failure detection
- **Deployment Monitoring**: Detailed logging and state tracking

## Deployment Strategies

### 1. Rolling Update

Deploy services one at a time, minimizing risk while maintaining availability.

```bash
./scripts/deployment/orchestrate-deployment.sh --strategy=rolling
```

**Best for:**
- Quick updates
- Low-risk changes
- Resource-constrained environments

**Pros:**
- Minimal resource usage
- Gradual rollout
- Easy to understand

**Cons:**
- Slower than parallel deployments
- Mixed versions during deployment

### 2. Blue-Green Deployment

Deploy to an inactive environment, then switch traffic instantly.

```bash
./scripts/deployment/orchestrate-deployment.sh --strategy=blue-green
```

**Best for:**
- Critical updates
- Need for instant rollback
- Full environment testing

**Pros:**
- Zero downtime
- Instant rollback capability
- Full environment testing before switch
- Clean version separation

**Cons:**
- Requires double resources
- Database migration complexity
- Manual traffic switching (in some setups)

### 3. Canary Deployment

Gradually increase traffic to new version while monitoring metrics.

```bash
./scripts/deployment/orchestrate-deployment.sh --strategy=canary
```

**Best for:**
- High-risk changes
- Production testing with real traffic
- Gradual confidence building

**Pros:**
- Real production traffic testing
- Automatic rollback on issues
- Minimal blast radius
- Performance validation

**Cons:**
- Longest deployment time
- Complex traffic management
- Requires monitoring infrastructure

## Prerequisites

### Required Tools

```bash
# Node.js (v18+)
node --version

# pnpm
pnpm --version

# CloudRuntime CLI (for CloudRuntime deployments)
cloud_runtime --version

# Git
git --version

# Optional: Docker
docker --version
```

### Environment Variables

Create `.env.production` file:

```bash
# Database
DATABASE_URL="postgresql://user:pass@host:5432/db"

# Redis (optional)
REDIS_URL="redis://host:6379"

# Security
JWT_SECRET="your-jwt-secret"
NODE_ENV="production"

# Notifications (optional)
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."
DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."
EMAIL_API_URL="https://api.sendgrid.com/v3/mail/send"
EMAIL_TO="team@example.com"

# CloudRuntime (for CloudRuntime deployments)
CLOUD_RUNTIME_TOKEN="your-cloud_runtime-token"

# Deployment Configuration
DEPLOYMENT_STRATEGY="blue-green"
SERVICES="api-gateway backend frontend api"
```

### CloudRuntime Configuration

```bash
# Login to CloudRuntime
cloud_runtime login

# Link to your project
cloud_runtime link

# Verify connection
cloud_runtime status
```

## Quick Start

### 1. Pre-Deployment Validation

```bash
# Run pre-deployment checks
./scripts/deployment/validate-deployment.sh

# Review validation report
cat logs/deployment/validation-*.log
```

### 2. Create Database Backup

```bash
# Manual backup (recommended before first deployment)
./scripts/deployment/db-backup.sh
```

### 3. Run Deployment

```bash
# Full automated deployment
./scripts/deployment/orchestrate-deployment.sh

# Or specify strategy
./scripts/deployment/orchestrate-deployment.sh --strategy=blue-green

# Or specific services
./scripts/deployment/orchestrate-deployment.sh --services="api-gateway frontend"
```

### 4. Monitor Deployment

```bash
# Watch deployment dashboard
./scripts/deployment/deployment-dashboard.sh --watch

# Or check specific deployment logs
tail -f logs/deployment/deploy-*.log
```

### 5. Verify Deployment

```bash
# Run smoke tests
./scripts/deployment/smoke-tests.sh

# Run comprehensive health checks
./scripts/deployment/health-check.sh --deep
```

## Deployment Scripts

### Core Scripts

#### orchestrate-deployment.sh

Master deployment orchestrator that coordinates the entire deployment process.

```bash
# Usage
./scripts/deployment/orchestrate-deployment.sh [options]

# Options
--strategy=<rolling|blue-green|canary>  # Deployment strategy
--services=<list>                       # Services to deploy
--no-migrations                         # Skip database migrations
--no-tests                              # Skip smoke tests
--no-health-checks                      # Skip health checks
--no-notifications                      # Skip notifications

# Examples
./scripts/deployment/orchestrate-deployment.sh --strategy=canary
./scripts/deployment/orchestrate-deployment.sh --services="api-gateway frontend" --no-migrations
```

#### validate-deployment.sh

Pre-deployment validation script.

```bash
# Run validation
./scripts/deployment/validate-deployment.sh

# Checks performed:
# - Node.js version
# - Dependencies
# - Environment variables
# - Database connectivity
# - Redis connectivity
# - Disk space
# - Memory
# - Build artifacts
# - CloudRuntime CLI
# - Security configuration
```

#### health-check.sh

Comprehensive health check system.

```bash
# Standard health check
./scripts/deployment/health-check.sh

# Deep health check
./scripts/deployment/health-check.sh --deep

# Minimal health check
./scripts/deployment/health-check.sh --minimal
```

#### db-migrate.sh

Database migration with automatic backup.

```bash
# Run migrations
./scripts/deployment/db-migrate.sh

# Dry run (preview only)
DRY_RUN=true ./scripts/deployment/db-migrate.sh

# Skip backup (not recommended)
BACKUP_BEFORE_MIGRATE=false ./scripts/deployment/db-migrate.sh
```

#### smoke-tests.sh

Quick validation tests for deployment health.

```bash
# Run smoke tests
./scripts/deployment/smoke-tests.sh

# With custom timeout
TIMEOUT=60 ./scripts/deployment/smoke-tests.sh
```

#### rollback.sh

Automated rollback to previous deployment.

```bash
# Rollback specific deployment
./scripts/deployment/rollback.sh <deployment-id>

# Example
./scripts/deployment/rollback.sh deploy-20231215-143022

# Auto-confirm rollback (use with caution)
AUTO_CONFIRM=true ./scripts/deployment/rollback.sh <deployment-id>
```

### Strategy-Specific Scripts

#### blue-green-deploy.sh

Blue-green deployment for a single service.

```bash
# Deploy service
./scripts/deployment/blue-green-deploy.sh <service-name>

# Check current state
./scripts/deployment/blue-green-deploy.sh <service-name> status

# Manual rollback
./scripts/deployment/blue-green-deploy.sh <service-name> rollback
```

#### canary-deploy.sh

Canary deployment with gradual rollout.

```bash
# Deploy with canary
./scripts/deployment/canary-deploy.sh <service-name>

# Configure canary parameters
CANARY_PERCENTAGE=10 \
CANARY_INCREMENT=20 \
CANARY_DURATION=300 \
CANARY_ERROR_THRESHOLD=5 \
./scripts/deployment/canary-deploy.sh api-gateway
```

### Utility Scripts

#### notifications.sh

Notification system integration.

```bash
# Test notifications
./scripts/deployment/notifications.sh test

# Send custom notification
./scripts/deployment/notifications.sh custom "Deployment Notice" "Message here" "info"

# Send specific notifications
./scripts/deployment/notifications.sh started <deployment-id>
./scripts/deployment/notifications.sh completed <deployment-id> "5m" "all services"
./scripts/deployment/notifications.sh failed <deployment-id> "error message"
```

#### deployment-dashboard.sh

Interactive deployment status dashboard.

```bash
# Show dashboard
./scripts/deployment/deployment-dashboard.sh

# Auto-refresh mode
./scripts/deployment/deployment-dashboard.sh --watch
```

## Configuration

### Global Configuration

Edit `.deployment-config` or set environment variables:

```bash
# Deployment Strategy
DEPLOYMENT_STRATEGY=blue-green

# Services to deploy
SERVICES="api-gateway backend frontend api"

# Feature flags
RUN_MIGRATIONS=true
RUN_TESTS=true
RUN_HEALTH_CHECKS=true
NOTIFY=true

# Timeouts
HEALTH_CHECK_TIMEOUT=60
HEALTH_CHECK_INTERVAL=5

# Canary Configuration
CANARY_PERCENTAGE=10
CANARY_INCREMENT=20
CANARY_DURATION=300
CANARY_ERROR_THRESHOLD=5
CANARY_LATENCY_THRESHOLD=2000

# Notifications
NOTIFICATION_ENABLED=true
SLACK_ENABLED=true
DISCORD_ENABLED=true
EMAIL_ENABLED=false
```

### Service URLs

Configure service URLs for different environments:

```bash
# Production URLs
PRODUCTION_URL=https://app.thenewfuse.com
API_GATEWAY_URL=https://api.thenewfuse.com
BACKEND_URL=https://backend.thenewfuse.com

# Blue-Green URLs
BLUE_URL=https://blue.thenewfuse.com
GREEN_URL=https://green.thenewfuse.com

# Canary URL
CANARY_URL=https://canary.thenewfuse.com
```

## Monitoring & Notifications

### Slack Integration

```bash
# Configure Slack webhook
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

# Test Slack notifications
./scripts/deployment/notifications.sh test
```

### Discord Integration

```bash
# Configure Discord webhook
export DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/YOUR/WEBHOOK/URL"

# Test Discord notifications
./scripts/deployment/notifications.sh test
```

### Email Integration

```bash
# Configure email
export EMAIL_API_URL="https://api.sendgrid.com/v3/mail/send"
export EMAIL_TO="team@example.com"
export EMAIL_ENABLED=true

# Test email notifications
./scripts/deployment/notifications.sh test
```

### Deployment Logs

All deployments create detailed logs:

```bash
# Deployment logs
logs/deployment/deploy-*.log

# Migration logs
logs/deployment/migration-*.log

# Health check logs
logs/health-checks/health-check-*.log

# Canary logs
logs/canary/canary-*.log

# Blue-green logs
logs/blue-green/bg-*.log
```

### Deployment State

Track deployment state:

```bash
# View deployment state
cat .deployment-state/deploy-*-state.json | jq .

# Example state file
{
  "deployment_id": "deploy-20231215-143022",
  "status": "completed",
  "strategy": "blue-green",
  "services": "api-gateway backend frontend api",
  "started_at": "2023-12-15T14:30:22Z",
  "elapsed_seconds": 312,
  "git_commit": "abc123",
  "deployer": "user"
}
```

## Rollback Procedures

### Automatic Rollback

Rollback happens automatically on:
- Failed health checks
- Failed smoke tests
- High error rates (canary)
- Excessive latency (canary)

### Manual Rollback

```bash
# 1. Find deployment ID
./scripts/deployment/deployment-dashboard.sh

# 2. Rollback to previous version
./scripts/deployment/rollback.sh <deployment-id>

# 3. Verify rollback
./scripts/deployment/health-check.sh
```

### Blue-Green Rollback

```bash
# Instant rollback (switch traffic back)
./scripts/deployment/blue-green-deploy.sh <service> rollback
```

### Database Rollback

```bash
# Database rollback is automatic during full rollback
# Or manual restoration from backup:

# 1. Find backup
ls -lh backups/database/

# 2. Restore (PostgreSQL example)
psql $DATABASE_URL < backups/database/backup-<deployment-id>.sql

# 3. Verify
pnpm drizzle migrate status
```

## Best Practices

### Pre-Deployment

1. **Always run validation first**
   ```bash
   ./scripts/deployment/validate-deployment.sh
   ```

2. **Create manual backup for critical deployments**
   ```bash
   ./scripts/deployment/db-backup.sh
   ```

3. **Test in staging environment first**
   ```bash
   NODE_ENV=staging ./scripts/deployment/orchestrate-deployment.sh
   ```

### During Deployment

1. **Monitor deployment logs**
   ```bash
   tail -f logs/deployment/deploy-*.log
   ```

2. **Watch deployment dashboard**
   ```bash
   ./scripts/deployment/deployment-dashboard.sh --watch
   ```

3. **Keep terminal open** until deployment completes

### Post-Deployment

1. **Verify all services**
   ```bash
   ./scripts/deployment/health-check.sh --deep
   ```

2. **Monitor application logs**
   ```bash
   cloud_runtime logs --service api-gateway
   ```

3. **Keep backup for 24-48 hours** before cleanup

### Production Deployments

1. **Use blue-green for zero downtime**
2. **Enable all notifications**
3. **Run during low-traffic periods**
4. **Have rollback plan ready**
5. **Monitor metrics for 24 hours**

## Troubleshooting

### Common Issues

#### Validation Fails

```bash
# Check specific error
./scripts/deployment/validate-deployment.sh

# Common fixes:
pnpm install                    # Install dependencies
cloud_runtime login                   # Authenticate CloudRuntime
export DATABASE_URL="..."       # Set environment variables
```

#### Health Check Fails

```bash
# Check service logs
cloud_runtime logs --service <service-name>

# Verify service URL
curl -i https://your-service-url/health

# Check environment variables
cloud_runtime variables
```

#### Migration Fails

```bash
# Check migration status
pnpm drizzle migrate status

# Review migration logs
cat logs/deployment/migration-*.log

# Restore from backup if needed
./scripts/deployment/rollback.sh <deployment-id>
```

#### Deployment Hangs

```bash
# Check CloudRuntime status
cloud_runtime status

# Check for resource limits
cloud_runtime variables

# Cancel and rollback
Ctrl+C
./scripts/deployment/rollback.sh <deployment-id>
```

### Debug Mode

Enable verbose logging:

```bash
# Set debug environment variable
export DEBUG=true

# Run deployment with verbose output
./scripts/deployment/orchestrate-deployment.sh
```

### Getting Help

1. **Check logs**: `logs/deployment/`
2. **Review state files**: `.deployment-state/`
3. **Run health checks**: `./scripts/deployment/health-check.sh --deep`
4. **Check CloudRuntime status**: `cloud_runtime status`
5. **Review documentation**: `docs/deployment/`

## Summary

The automated deployment system provides enterprise-grade deployment capabilities with:

✅ **Multiple deployment strategies** for different use cases
✅ **Zero-downtime deployments** with automatic rollback
✅ **Comprehensive health checks** and validation
✅ **Database migration management** with backup
✅ **Real-time notifications** via multiple channels
✅ **Detailed logging and monitoring**
✅ **Production-ready** deployment automation

For additional help, refer to:
- [Emergency Procedures](EMERGENCY_PROCEDURES.md)
- [Rollback Procedures](ROLLBACK_PROCEDURES.md)
- [Troubleshooting Guide](TROUBLESHOOTING.md)
- [Deployment Checklist](DEPLOYMENT_CHECKLIST.md)
