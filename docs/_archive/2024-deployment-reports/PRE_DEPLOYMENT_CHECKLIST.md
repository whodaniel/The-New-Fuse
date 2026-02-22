# The New Fuse - Pre-Deployment Checklist

**Author: Daniel Adam Goldberg**

This checklist ensures all packages are functional and ready for production deployment.

---

## 🔍 Phase 1: Package Validation

### Automated Validation

```bash
# Run complete validation
./scripts/validate-all-packages.sh
```

**This checks:**
- ✅ All packages have valid package.json
- ✅ TypeScript compiles without errors
- ✅ Build scripts execute successfully
- ✅ No missing dependencies
- ✅ SkIDEancer properly excluded

**Expected Output:**
```
✅ All packages validated successfully!
Ready for deployment to Docker Hub and Railway.
```

### Manual Package Audit

- [ ] **packages/database**
  - [ ] Drizzle schema valid
  - [ ] Migrations up to date
  - [ ] Generated client exists

- [ ] **packages/api**
  - [ ] Controllers build without errors
  - [ ] Routes properly configured
  - [ ] Middleware functional

- [ ] **packages/core**
  - [ ] Core services compile
  - [ ] Business logic intact
  - [ ] No circular dependencies

- [ ] **packages/relay-core**
  - [ ] Agent communication working
  - [ ] MCP integration functional

- [ ] **apps/api**
  - [ ] Main API builds
  - [ ] Health endpoints working
  - [ ] Swagger documentation generated

- [ ] **apps/frontend**
  - [ ] Vite builds successfully
  - [ ] All routes accessible
  - [ ] Assets optimized

- [ ] **apps/backend**
  - [ ] Backend services compile
  - [ ] Worker processes functional

---

## 🧪 Phase 2: Testing

### Automated Testing

```bash
# Run all tests
./scripts/test-all-packages.sh
```

**Test Coverage:**
- Unit tests for business logic
- Integration tests for APIs
- E2E tests for critical flows

### Manual Testing

- [ ] **API Endpoints**
  - [ ] Health check: `GET /api/health`
  - [ ] Authentication: `POST /api/auth/login`
  - [ ] Agent CRUD: `GET /api/agents`
  - [ ] Workflow execution: `POST /api/workflows/:id/execute`

- [ ] **Frontend Pages**
  - [ ] Landing page loads
  - [ ] Authentication flow works
  - [ ] Agent dashboard functional
  - [ ] Marketplace accessible

- [ ] **Database**
  - [ ] Migrations applied
  - [ ] Soft delete middleware working
  - [ ] Indexes created
  - [ ] Foreign keys enforced

---

## 🔧 Phase 3: Dependency & Build Issues

### Fix Common Issues

```bash
# Auto-fix common problems
./scripts/fix-all-packages.sh
```

**This fixes:**
- Reinstalls all dependencies
- Resolves peer dependency conflicts
- Generates Drizzle clients
- Runs ESLint auto-fix
- Rebuilds all packages

### Dependency Audit

```bash
# Check for vulnerabilities
pnpm audit

# Fix vulnerabilities
pnpm audit --fix
```

- [ ] No critical vulnerabilities
- [ ] No high vulnerabilities (or accepted risk)
- [ ] Dependencies up to date

### TypeScript Configuration

```bash
# Check TypeScript across monorepo
pnpm exec tsc --noEmit --skipLibCheck
```

- [ ] No TypeScript errors
- [ ] Strict mode enabled where appropriate
- [ ] Path aliases working

---

## 📦 Phase 4: Build Verification

### Development Build

```bash
# Build all packages except SkIDEancer
pnpm run build --filter='!ide-ide'
```

**Expected:**
- ✅ All packages build successfully
- ✅ No TypeScript errors
- ✅ Output directories created (dist/)

### Production Build Test

```bash
# Set production environment
export NODE_ENV=production

# Build for production
pnpm run build --filter='!ide-ide'

# Test production builds
node apps/api/dist/main.js &
API_PID=$!

# Wait and check
sleep 5
curl http://localhost:3000/api/health

# Cleanup
kill $API_PID
```

- [ ] Production builds succeed
- [ ] No development dependencies in output
- [ ] Optimizations applied (minification, tree-shaking)

---

## 🐳 Phase 5: Docker Build Verification

### Local Docker Build Test

```bash
# Test API Docker build
docker build -f apps/api/Dockerfile.production -t test-api .

# Test Frontend Docker build
docker build -f apps/frontend/Dockerfile.production -t test-frontend .
```

- [ ] API Dockerfile builds successfully
- [ ] Frontend Dockerfile builds successfully
- [ ] Image sizes reasonable (<500MB for API, <100MB for frontend)

### Docker Compose Test

```bash
# Test full stack locally
docker-compose -f docker-compose.minimal.yml up -d

# Wait for services
sleep 10

# Check health
curl http://localhost:3000/api/health
curl http://localhost:3001/

# Cleanup
docker-compose -f docker-compose.minimal.yml down
```

- [ ] All services start
- [ ] Services communicate
- [ ] Health checks pass
- [ ] Database migrations run

---

## 🔒 Phase 6: Security Audit

### Environment Variables

- [ ] No secrets in code
- [ ] `.env` files in `.gitignore`
- [ ] `.env.example` provided
- [ ] All secrets documented

### API Security

- [ ] JWT authentication enabled
- [ ] CORS configured properly
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection protected (Drizzle ORM)
- [ ] XSS protection enabled

### Dependencies

```bash
# Check for known vulnerabilities
pnpm audit

# Check for outdated packages
pnpm outdated
```

- [ ] No critical vulnerabilities
- [ ] Security patches applied
- [ ] Dependencies locked (pnpm-lock.yaml)

---

## 📊 Phase 7: Performance Validation

### Bundle Size Analysis

```bash
# Analyze frontend bundle
cd apps/frontend
pnpm run build
pnpm exec vite-bundle-visualizer

# Check API bundle
cd ../../apps/api
ls -lh dist/
```

- [ ] Frontend bundle < 1MB (gzipped)
- [ ] Code splitting implemented
- [ ] Lazy loading for routes
- [ ] Images optimized

### Database Performance

```bash
# Check query performance
cd packages/database
pnpm exec drizzle studio

# Run EXPLAIN on slow queries
```

- [ ] Indexes on foreign keys
- [ ] Indexes on frequently queried fields
- [ ] No N+1 queries
- [ ] Connection pooling configured

---

## 🌐 Phase 8: Railway Deployment Prep

### Configuration Files

- [ ] `railway.json` exists
- [ ] `railway.toml` configured
- [ ] Health check endpoints defined
- [ ] Environment variables documented

### Database Migrations

```bash
# Ensure migrations are idempotent
cd packages/database
pnpm exec drizzle migrate diff --from-empty --to-schema-datamodel drizzle/schema.drizzle

# Check migration status
pnpm exec drizzle migrate status
```

- [ ] All migrations in `migrations/` folder
- [ ] Migrations tested locally
- [ ] Rollback strategy documented
- [ ] Backup plan in place

---

## ✅ Phase 9: Final Checks

### Code Quality

- [ ] ESLint passes: `pnpm exec eslint .`
- [ ] Prettier formatted: `pnpm exec prettier . --check`
- [ ] No console.logs in production code
- [ ] Comments explain complex logic
- [ ] TODO/FIXME items addressed or documented

### Documentation

- [ ] README.md updated
- [ ] API documentation (Swagger) complete
- [ ] Environment variables documented
- [ ] Deployment guide reviewed (DOCKER_HUB_DEPLOYMENT.md)

### Git Status

```bash
git status
```

- [ ] All changes committed
- [ ] Meaningful commit messages
- [ ] Branch up to date with remote
- [ ] No merge conflicts

### GitHub Actions

- [ ] Workflow file valid (`.github/workflows/docker-build.yml`)
- [ ] Secrets configured in GitHub
- [ ] Test run succeeds
- [ ] Docker Hub token valid

---

## 🚀 Phase 10: Deployment Readiness

### Pre-Flight Checklist

Run all validation:

```bash
# 1. Fix any issues
./scripts/fix-all-packages.sh

# 2. Validate packages
./scripts/validate-all-packages.sh

# 3. Run tests
./scripts/test-all-packages.sh

# 4. Audit dependencies
pnpm audit

# 5. Build production
NODE_ENV=production pnpm run build --filter='!ide-ide'
```

**All must pass:**
- ✅ Validation: 100% packages pass
- ✅ Tests: All test suites pass
- ✅ Audit: No critical vulnerabilities
- ✅ Build: Production builds succeed

### Deployment Steps

Once all checks pass:

```bash
# 1. Setup Docker Hub Cloud builder
./docker-buildx-setup.sh

# 2. Build and push images
./docker-build-all.sh

# 3. Deploy to Railway
railway login
railway init
railway up
```

---

## 📝 Sign-Off

**Validated by:** Daniel Adam Goldberg
**Date:** _____________
**Version:** _____________
**Status:** ☐ Ready for Production

---

## 🆘 Troubleshooting

### If validation fails:

1. **Check logs:** Look in `/tmp/build_*.log` and `/tmp/test_*.log`
2. **Run fix script:** `./scripts/fix-all-packages.sh`
3. **Manual fix:** Address specific errors in the logs
4. **Re-validate:** Run validation script again

### If tests fail:

1. **Identify failing test:** Check test output
2. **Fix the issue:** Update code or test
3. **Re-run:** `pnpm test` in the specific package
4. **Re-validate:** Run full test suite

### If Docker build fails:

1. **Check Dockerfile:** Ensure paths are correct
2. **Test locally:** `docker build -f apps/api/Dockerfile.production .`
3. **Check dependencies:** All required packages installed
4. **Build args:** Ensure build args passed correctly

---

**Ready for deployment when all phases pass! 🎉**

**The New Fuse by Daniel Adam Goldberg**
