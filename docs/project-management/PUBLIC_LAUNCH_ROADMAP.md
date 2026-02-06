# 🚀 The New Fuse - Public Launch Roadmap

**Last Updated**: 2025-11-17 **Current Status**: Pre-Alpha → Alpha (86.5%
package build success) **Target**: Public Beta Launch on Railway

---

## 📊 Current State Analysis

### ✅ Strengths

- **Build Success**: 32/37 packages building (86.5%)
- **Test Coverage**: 291 test files with 14,752 test cases
- **Core Infrastructure**: Database, API, Utils, MCP-Core, Workflow-Engine
  operational
- **Deployment Ready**: Railway configuration complete with 4 Dockerfiles
- **Documentation**: Comprehensive deployment guides exist

### ⚠️ Blockers

1. **5 Packages Failing**: sync-core (critical), integration-tests,
   web-scraping, ui-consolidated, core
2. **Drizzle Placeholder**: Using mock client - real database operations won't
   work
3. **Railway Not Deployed**: Configured but not live
4. **396 TODO/FIXME Items**: Technical debt across codebase

---

## 🎯 Three-Phase Launch Strategy

### Phase 1: MVP Core (Target: 1-2 Weeks) - CRITICAL PATH

**Goal**: Get minimal viable product deployed and functional

#### Week 1: Critical Build Fixes

- [ ] **Fix sync-core package** (BLOCKER)
  - Add missing Drizzle models: SyncConflict, AuthEvent, SyncState, TaskExecution
  - Fix improper relative imports from core-monitoring
  - Export FileChangeEvent from EnhancedFileSystemWatcher
  - Add missing prompt-templating package or remove dependency
  - **Impact**: Unblocks core and ui-consolidated packages

- [ ] **Resolve Drizzle Binary Issue** (CRITICAL)
  - Option A: Set up Drizzle environment variables for offline mode
  - Option B: Use Docker-based Drizzle generation
  - Option C: Update to latest Drizzle version with working binaries
  - Create real Drizzle client to replace placeholder
  - **Impact**: Enables actual database operations

- [ ] **Fix integration-tests package**
  - Fix syntax errors in example files
  - Mark as optional if not critical for launch

- [ ] **Fix web-scraping package**
  - Add electron types to devDependencies
  - Or mark as optional if not in MVP scope

#### Week 1-2: MVP Features

- [ ] **Core Authentication**
  - User registration and login working
  - JWT token management
  - Session persistence

- [ ] **Essential API Endpoints**
  - User CRUD operations
  - Agent basic operations
  - Workflow basic operations
  - Health checks on all services

- [ ] **Basic Frontend**
  - Login/Register pages
  - Dashboard (minimal)
  - Agent list view
  - Basic error handling

---

### Phase 2: Railway Deployment (Target: Days 8-14)

**Goal**: Get application live and accessible

#### Pre-Deployment Checklist

- [ ] All critical packages building (35/37 minimum)
- [ ] Database schema finalized and migrations ready
- [ ] Environment variables documented
- [ ] Health checks implemented on all services
- [ ] Basic smoke tests passing

#### Deployment Steps

1. **Merge to Main**

   ```bash
   # Review all changes on claude/fix-monorepo-builds-019rTq29GyFPBTHdttUkdE9w
   # Create PR and merge to main
   ```

2. **Railway Infrastructure Setup**
   - [ ] Add PostgreSQL database to Railway project
   - [ ] Add Redis (optional but recommended)
   - [ ] Configure environment variables for all 4 services
   - [ ] Set up internal service networking

3. **Deploy Services**
   - [ ] Deploy API service (port 3001)
   - [ ] Deploy API Gateway (port 3002)
   - [ ] Deploy Backend service (port 3003)
   - [ ] Deploy Frontend (port 8080)
   - [ ] Verify all health checks pass

4. **Configure Domain**
   - [ ] Set up www.thenewfuse.com custom domain
   - [ ] Update DNS CNAME records
   - [ ] Verify SSL certificate

5. **Integration Testing**
   - [ ] Test user registration flow end-to-end
   - [ ] Test authentication across services
   - [ ] Test basic agent operations
   - [ ] Monitor error rates and performance

#### Post-Deployment

- [ ] Set up monitoring and logging (Railway built-in)
- [ ] Configure alerts for service failures
- [ ] Document rollback procedures
- [ ] Create incident response plan

---

### Phase 3: Public Beta Polish (Target: Weeks 3-4)

**Goal**: Stabilize for public users

#### Code Quality

- [ ] **Reduce TODO/FIXME Count**
  - Review all 396 items
  - Fix critical items (50%)
  - Document or remove non-critical items

- [ ] **Test Coverage**
  - Run full test suite: `pnpm test`
  - Achieve 80%+ coverage on critical paths
  - Fix any failing tests

- [ ] **Security Audit**
  - Review authentication implementation
  - Check for common vulnerabilities (SQL injection, XSS, CSRF)
  - Implement rate limiting
  - Add input validation on all endpoints
  - Review environment variable handling

#### User Experience

- [ ] **Documentation**
  - Update README.md with current instructions
  - Create user guide for basic features
  - Document API endpoints
  - Add troubleshooting guide

- [ ] **Error Handling**
  - Friendly error messages on frontend
  - Proper HTTP status codes
  - Logging for all errors
  - User-facing error recovery

- [ ] **Performance**
  - Optimize slow database queries
  - Implement caching strategy
  - Minimize bundle sizes
  - Add loading states

#### Marketing Prep

- [ ] Create landing page or update README
- [ ] Prepare demo video or screenshots
- [ ] Write launch announcement
- [ ] Set up feedback collection mechanism

---

## 🔥 Critical Path (Next 7 Days)

### Day 1-2: Fix sync-core Package

```bash
# This is THE blocker
cd packages/sync-core

# Fix 1: Add missing Drizzle models to database schema
# Fix 2: Change relative imports to package imports
# Fix 3: Export FileChangeEvent
# Fix 4: Resolve prompt-templating dependency

pnpm build  # Should succeed
```

### Day 3-4: Resolve Drizzle Issue

```bash
# Try Docker-based approach
cd packages/database
docker run --rm -v $(pwd):/app -w /app node:20 npx drizzle generate

# Or set environment variables
export PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
pnpm --filter @the-new-fuse/database build
```

### Day 5: Full Build Verification

```bash
pnpm build  # Target: 37/37 success
pnpm test   # Run all tests
```

### Day 6-7: Railway Deployment

```bash
# Merge to main
git checkout main
git merge claude/fix-monorepo-builds-019rTq29GyFPBTHdttUkdE9w
git push origin main

# Railway will auto-deploy
# Monitor at: https://railway.app/project/041cee9d-8648-4074-b5a6-0eae436de1d1
```

---

## 📋 Detailed Task Breakdown

### Task 1: Fix sync-core Package [HIGH PRIORITY]

**Problem**: Multiple TypeScript errors preventing build

**Solution Steps**:

1. Add missing Drizzle models to schema.drizzle:

   ```drizzle
   model SyncConflict {
     id String @id @default(cuid())
     // ... fields based on usage
   }

   model AuthEvent {
     id String @id @default(cuid())
     // ... fields based on usage
   }

   model SyncState {
     id String @id @default(cuid())
     // ... fields based on usage
   }

   model TaskExecution {
     id String @id @default(cuid())
     // ... fields based on usage
   }
   ```

2. Fix import paths in sync-core:

   ```typescript
   // WRONG: import { Logger } from '../../../core-monitoring/src/utils/Logger'
   // RIGHT: import { Logger } from '@the-new-fuse/core-monitoring'
   ```

3. Export FileChangeEvent:

   ```typescript
   // In packages/sync-core/src/watchers/EnhancedFileSystemWatcher.ts
   export interface FileChangeEvent {
     // ... existing definition
   }
   ```

4. Handle prompt-templating dependency:
   - Option A: Create minimal prompt-templating package
   - Option B: Remove dependency and inline the code
   - Option C: Use a different templating solution

**Time Estimate**: 2-3 days **Impact**: Unblocks 3 additional packages (core,
ui-consolidated)

---

### Task 2: Resolve Drizzle Binary Issue [CRITICAL]

**Problem**: Cannot download Drizzle binaries (403 Forbidden)

**Current Workaround**: Placeholder Drizzle client (no real database ops)

**Permanent Solutions**:

**Option A: Environment Variable Approach**

```bash
# Skip checksum validation
export PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
pnpm --filter @the-new-fuse/database drizzle generate
```

**Option B: Docker-Based Generation**

```dockerfile
# Create packages/database/Dockerfile.drizzle
FROM node:20-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY packages/database ./packages/database
RUN npm install -g pnpm@10.22.0
RUN pnpm install --filter @the-new-fuse/database
RUN pnpm --filter @the-new-fuse/database exec drizzle generate
```

```bash
# Generate Drizzle client in Docker
docker build -f packages/database/Dockerfile.drizzle -t fuse-drizzle .
docker run --rm -v $(pwd)/packages/database:/output fuse-drizzle \
  sh -c "cp -r /app/packages/database/generated /output/"
```

**Option C: Upgrade Drizzle**

```bash
# Update to latest version
pnpm --filter @the-new-fuse/database add drizzle@latest @drizzle/client@latest
pnpm --filter @the-new-fuse/database exec drizzle generate
```

**Time Estimate**: 1-2 days **Impact**: Enables actual database operations for
all apps

---

### Task 3: Railway Deployment Configuration

**Prerequisites**:

- [ ] All critical packages building
- [ ] Drizzle client working
- [ ] Environment variables documented

**Environment Variables Needed**:

```bash
# Frontend Service
NODE_ENV=production
PORT=8080
VITE_API_URL=https://your-api.railway.app
VITE_API_GATEWAY_URL=https://your-gateway.railway.app
VITE_WS_URL=wss://your-api.railway.app

# API Service
NODE_ENV=production
PORT=3001
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=generate-secure-random-string-here
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://your-frontend.railway.app,https://www.thenewfuse.com

# API Gateway
NODE_ENV=production
PORT=3002
API_SERVICE_URL=${{API.RAILWAY_PRIVATE_DOMAIN}}
BACKEND_SERVICE_URL=${{BACKEND.RAILWAY_PRIVATE_DOMAIN}}
JWT_SECRET=same-as-api-service

# Backend Service
NODE_ENV=production
PORT=3003
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
```

**Deployment Commands**:

```bash
# 1. Merge to main
git checkout main
git merge claude/fix-monorepo-builds-019rTq29GyFPBTHdttUkdE9w
git push origin main

# 2. Railway will auto-deploy from main branch
# Monitor: https://railway.app/project/041cee9d-8648-4074-b5a6-0eae436de1d1

# 3. After deployment, get URLs
railway service list
railway domain

# 4. Update frontend env with actual URLs and redeploy
railway service frontend variables set VITE_API_URL=https://api-service-url.railway.app
railway service frontend up
```

**Time Estimate**: 1 day **Impact**: Live application accessible at
www.thenewfuse.com

---

## 🎓 Learning from Build Fixes

### What Worked Well

1. **Drizzle Placeholder Approach**: Allowed builds to continue while resolving
   binary issues
2. **Making Native Modules Optional**: Prevented unnecessary build failures
3. **TypeScript Config Standardization**: ESNext/bundler across all packages
4. **Comprehensive Test Suite**: 14,752 test cases show mature codebase

### Patterns to Continue

1. **Iterative Build Fixes**: Fix one package at a time, verify, move forward
2. **Clear Documentation**: Status files (BUILD_STATUS.md, DEPLOYMENT_STATUS.md)
   track progress
3. **Non-Breaking Workarounds**: Placeholders and optional features keep builds
   working

---

## 🚨 Risk Assessment

### High Risk

- **Database Operations**: Drizzle placeholder means no real DB until fixed
- **sync-core Complexity**: Many interdependencies, could take longer than
  estimated
- **First Railway Deploy**: Unknown issues may arise

### Medium Risk

- **Environment Variable Config**: Easy to miss one, breaks service
  communication
- **SSL/Domain Setup**: DNS propagation can take time
- **Migration Strategy**: Need plan for schema changes

### Low Risk

- **Test Failures**: Good coverage means we'll catch issues early
- **Performance**: Can optimize after launch
- **TODO Items**: Most are enhancements, not blockers

---

## ✅ Definition of "Launch Ready"

### Must Have (Blockers)

- [ ] 100% of critical packages building (min 35/37)
- [ ] Drizzle client working with real database
- [ ] User can register, login, and access dashboard
- [ ] All services healthy and communicating on Railway
- [ ] www.thenewfuse.com loads with SSL

### Should Have (High Priority)

- [ ] Basic agent creation and management
- [ ] Workflow execution (simple flows)
- [ ] Error logging and monitoring
- [ ] Basic user documentation

### Nice to Have (Post-Launch)

- [ ] All 396 TODO items resolved
- [ ] 100% test coverage
- [ ] Advanced features (web scraping, complex workflows)
- [ ] Comprehensive API documentation

---

## 📞 Support Resources

### Technical Documentation

- **Build Status**: `/home/user/fuse/BUILD_STATUS.md`
- **Deployment Guide**: `/home/user/fuse/DEPLOYMENT_STATUS.md`
- **Railway Dashboard**:
  https://railway.app/project/041cee9d-8648-4074-b5a6-0eae436de1d1

### Quick Commands

```bash
# Build everything
pnpm build

# Run tests
pnpm test

# Check specific package
pnpm --filter @the-new-fuse/sync-core build

# Deploy to Railway (after merge to main)
git push origin main

# Monitor builds
pnpm build 2>&1 | tee build.log
```

---

## 🎯 Success Metrics

### Week 1 Goal

- sync-core package building ✅
- Drizzle client functional ✅
- 35+ packages building ✅

### Week 2 Goal

- All services deployed to Railway ✅
- www.thenewfuse.com accessible ✅
- User registration working ✅

### Week 3-4 Goal

- 10+ beta users testing ✅
- <5% error rate ✅
- Positive user feedback ✅

---

**Next Immediate Action**: Fix sync-core package (see Task 1 above)

**Questions or blockers?** Update this document as you progress!
