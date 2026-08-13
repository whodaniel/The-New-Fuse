# Deployment Checklist

Use this checklist for every production deployment.

## Pre-Deployment (T-24 hours)

### Code Preparation
- [ ] All feature branches merged to `main`
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
- [ ] All services running: `cloud_runtime status`

## Post-Deployment

### Immediate (T+0)
- [ ] Test critical user flows
- [ ] Monitor error rates
- [ ] Team notified

### Extended (T+1 hour)
- [ ] Performance metrics normal
- [ ] No user-reported issues

## Deployment-Ready Components

### Chrome Extension
- [ ] Build output exists in `chrome-extension/dist/`
- [ ] Package command validated:
  ```bash
  cd chrome-extension
  yarn package:extension
  ```

### Main Application
- [ ] Main app build artifacts are ready
- [ ] Local start validated: `yarn start`
- [ ] Docker start validated: `docker-compose up -d`

### MCP Server
- [ ] Built server artifact exists: `dist/mcp/server.js`
- [ ] Deployment target path documented

### VS Code Extension
- [ ] `.vsix` package is present
- [ ] Marketplace upload step confirmed

## Quick Deploy Commands

### Chrome Extension Package
```bash
cd chrome-extension
zip -r ../the-new-fuse-chrome-extension-$(date +%Y%m%d).zip dist/
```

### Production Build
```bash
yarn build:all
```

### MCP Server Deploy
```bash
cp dist/mcp/server.js /path/to/deployment/
```

## Component Validation

- [ ] Chrome extension loads in developer mode
- [ ] Main application starts without errors
- [ ] MCP server responds to test requests
- [ ] API endpoints are functional
- [ ] Database migrations applied successfully
- [ ] Environment variables configured correctly

## Deployment Targets

1. Chrome Web Store -> Chrome Extension
2. Production Server -> Main Application
3. Node.js Environment -> MCP Server
4. VS Code Marketplace -> VS Code Extension

---

**Last Updated:** 2026-03-24
