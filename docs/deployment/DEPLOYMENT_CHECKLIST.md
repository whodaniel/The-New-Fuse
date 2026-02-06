# Deployment Checklist

Use this checklist for every production deployment.

## Pre-Deployment (T-24 hours)

### Code Preparation

- [ ] All feature branches merged to main
- [ ] Code review completed and approved
- [ ] All tests passing locally
- [ ] No linting errors
- [ ] Documentation updated

### Testing

- [ ] Unit tests pass: `pnpm test`
- [ ] Integration tests pass
- [ ] E2E tests pass (if applicable)
- [ ] Manual testing in staging completed

### Database

- [ ] Database migrations reviewed
- [ ] Migration tested in staging
- [ ] Rollback plan documented

### Configuration

- [ ] Environment variables reviewed
- [ ] Secrets rotated (if needed)
- [ ] Feature flags configured

## During Deployment

### Start

- [ ] Run: `./scripts/deployment/deploy-automated.sh`
- [ ] Monitor deployment logs

### Verify

- [ ] Run: `./scripts/deployment/smoke-tests.sh`
- [ ] All services running: `railway status`

## Post-Deployment

### Immediate (T+0)

- [ ] Test critical user flows
- [ ] Monitor error rates
- [ ] Team notified

### Extended (T+1 hour)

- [ ] Performance metrics normal
- [ ] No user-reported issues

---

**Last Updated:** 2024-11-18
