# Deployment Documentation

Welcome to The New Fuse deployment documentation.

## Quick Links

- **[Deployment Guide](./DEPLOYMENT_GUIDE.md)** - Complete deployment
  instructions
- **[Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)** - Pre/post deployment
  checklist
- **[Rollback Procedures](./ROLLBACK_PROCEDURES.md)** - How to rollback failed
  deployments
- **[Emergency Procedures](./EMERGENCY_PROCEDURES.md)** - Critical incident
  response
- **[Troubleshooting](./TROUBLESHOOTING.md)** - Common issues and solutions

## Quick Start

```bash
# 1. Validate environment
./scripts/deployment/validate-deployment.sh

# 2. Deploy
./scripts/deployment/deploy-automated.sh

# 3. Verify
./scripts/deployment/smoke-tests.sh
```

## Available Scripts

Located in `/home/user/fuse/scripts/deployment/`:

### Main Scripts

- `deploy-automated.sh` - Full automated deployment
- `validate-deployment.sh` - Pre-deployment validation
- `rollback.sh` - Automated rollback
- `smoke-tests.sh` - Post-deployment tests
- `deployment-dashboard.sh` - Status dashboard

### Database Scripts

- `db-migrate.sh` - Run database migrations
- `db-backup.sh` - Create database backup

### Railway Scripts

- `railway-deploy.sh` - Railway deployment utility

## Deployment Dashboard

View current deployment status:

```bash
./scripts/deployment/deployment-dashboard.sh
```

## Configuration

Edit `.deployment-config` to customize deployment behavior.

## Support

For issues:

1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. Review deployment logs in `logs/deployment/`
3. Contact DevOps team

---

**Last Updated:** 2024-11-18
