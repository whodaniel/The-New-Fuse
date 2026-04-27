# 🚀 Quick Start Guide - Path to Public Launch

**Status**: 32/37 packages building (86.5%) | Ready for final push!

---

## ⚡ Critical Path (Next 7 Days)

### 🔴 Day 1-2: Fix sync-core [BLOCKER]

```bash
cd <repo-root>/packages/sync-core

# Issue: Missing Drizzle models + improper imports
# Fix: Add SyncConflict, AuthEvent, SyncState, TaskExecution to schema
#      Change relative imports to package imports
#      Export FileChangeEvent interface
```

**Impact**: Unblocks 3 more packages → 35/37 building

---

### 🟠 Day 3-4: Fix Drizzle [CRITICAL]

```bash
cd <repo-root>/packages/database

# Option A: Skip checksum
export DRIZZLE_ENGINES_CHECKSUM_IGNORE_MISSING=1
pnpm exec drizzle generate

# Option B: Docker approach
docker run --rm -v $(pwd):/app -w /app node:20 npx drizzle generate

# Option C: Upgrade
pnpm add drizzle@latest @drizzle/client@latest
pnpm exec drizzle generate
```

**Impact**: Real database operations work

---

### 🟡 Day 5: Full Build Test

```bash
pnpm build  # Target: 37/37 ✅
pnpm test   # Verify 14,752 tests pass
```

---

### 🟢 Day 6-7: Deploy to Production

> **⚠️ RAILWAY IS NO LONGER USED.** TNF has migrated from Railway to **GCP
> (Cloud Run) + Cloudflare (Pages/Workers) + Supabase (PostgreSQL) + Upstash
> (Redis)**. See `CLOUD_MIGRATION_BLUEPRINT.md` for current deployment
> instructions. The Railway steps below are historical.

```bash
# 1. Merge to main
git checkout main
git merge claude/fix-monorepo-builds-019rTq29GyFPBTHdttUkdE9w
git push origin main

# 2. Deploy to GCP Cloud Run (current method)
# See CLOUD_MIGRATION_BLUEPRINT.md for full instructions

# 3. Verify deployment
# - All services running on Cloud Run
# - Health checks passing
# - www.thenewfuse.com accessible
```

---

## 📊 Current Status Summary

### ✅ What's Working

- 32/37 packages building (86.5%)
- 291 test files, 14,752 test cases
- Railway configured with 4 Dockerfiles ⚠️ **DEPRECATED — Railway no longer
  used. See CLOUD_MIGRATION_BLUEPRINT.md for GCP/Cloudflare deployment.**
- Core infrastructure operational
- Comprehensive documentation

### ⚠️ What Needs Fixing

1. **sync-core package** (5 Drizzle models, import paths)
2. **Drizzle binary download** (using placeholder)
3. **Railway deployment** ⚠️ **DEPRECATED — now on GCP Cloud Run + Cloudflare**
4. **integration-tests** (syntax errors)
5. **web-scraping** (electron types)

---

## 🎯 Launch Checklist

### Must Have for MVP

- [ ] sync-core building
- [ ] Real Drizzle client working
- [ ] User auth (register/login)
- [ ] Services deployed to GCP Cloud Run + Cloudflare (⚠️ Railway is no longer
      used)
- [ ] www.thenewfuse.com live with SSL

### Should Have

- [ ] Basic agent operations
- [ ] Simple workflow execution
- [ ] Error monitoring
- [ ] User guide

### Nice to Have (Post-Launch)

- [ ] All 396 TODOs resolved
- [ ] Advanced features
- [ ] 100% test coverage
- [ ] API documentation

---

## 🔧 Useful Commands

```bash
# Build everything
pnpm build

# Build specific package
pnpm --filter @the-new-fuse/sync-core build

# Run all tests
pnpm test

# Check build status
pnpm build 2>&1 | grep -E "(successful|Failed)"

# Fix native modules (if needed)
pnpm run setup:native-modules

# Generate Drizzle client
pnpm --filter @the-new-fuse/database exec drizzle generate

# Development mode (after fixes)
pnpm run dev:no-ide  # Fastest startup
```

---

## 📚 Key Documents

| Document                                                       | Purpose                                                                 |
| -------------------------------------------------------------- | ----------------------------------------------------------------------- |
| [README.md](./README.md)                                       | Project overview and development setup                                  |
| [CLOUD_MIGRATION_BLUEPRINT.md](./CLOUD_MIGRATION_BLUEPRINT.md) | Current infrastructure: GCP Cloud Run + Cloudflare + Supabase + Upstash |
| [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)             | Organized index with guided navigation paths                            |
| [BUILD_STATUS.md](./docs/development/BUILD_STATUS.md)          | Current build status and known issues                                   |
| [RELEASE_GATE.md](./RELEASE_GATE.md)                           | Merge-blocking release gate                                             |

## 📖 Related Documentation

### Development

- [Getting Started Guide](./docs/development/GETTING_STARTED.md)
- [Build Guide](./docs/development/BUILD_GUIDE.md)
- [Build System Overview](./docs/development/BUILD_SYSTEM.md)
- [Development Workflow](./docs/guides/development-workflow.md)

### Deployment

- [Cloud Migration Blueprint](./CLOUD_MIGRATION_BLUEPRINT.md)
- [Deployment Guide](./docs/guides/deployment-guide.md)
- [Docker Setup](./docs/guides/docker-setup.md)
- [CI/CD Strategy](./docs/ci-cd/workflows.md)

### Architecture

- [Architecture Standards](./docs/architecture/ARCHITECTURE_STANDARDS.md)
- [Monorepo Architecture](./docs/architecture/MONOREPO_ARCHITECTURE.md)
- [Design System](./docs/DESIGN_SYSTEM_DOCUMENTATION.md)

### Backend & API

- [Backend Development](./apps/backend/README.md)
- [API Examples](./apps/backend/API_EXAMPLES.md)
- [GraphQL Guide](./apps/api/src/graphql/README.md)
- [Agent Registry API](./apps/backend/src/modules/agent-registry/API_DOCUMENTATION.md)

---

## 🆘 Troubleshooting

### "sync-core won't build"

→ Missing Drizzle models in schema.drizzle → See Task 1 in
PUBLIC_LAUNCH_ROADMAP.md

### "Drizzle generate fails"

→ Binary download blocked (403 error) → Try Docker approach or
DRIZZLE_ENGINES_CHECKSUM_IGNORE_MISSING=1

### "Railway deployment fails"

> ⚠️ **DEPRECATED** — Railway is no longer used. Deploy to GCP Cloud Run +
> Cloudflare instead. See `CLOUD_MIGRATION_BLUEPRINT.md`.

→ Check railway.toml exists on main branch → Verify Dockerfile.railway in each
app → Check environment variables set

### "Services can't communicate"

→ Use Railway internal URLs: ${{SERVICE.RAILWAY_PRIVATE_DOMAIN}} → Verify
CORS_ORIGIN includes frontend URL

---

## 💡 Pro Tips

1. **Fix sync-core first** - It's blocking the most packages
2. **Test locally before deploying** ⚠️ Railway no longer used — deploy to GCP
   Cloud Run
3. **Use pnpm filtering** - Faster than full builds
4. **Monitor deployment logs** ⚠️ Railway no longer used — use GCP Cloud Run
   logs
5. **Keep this document updated** - Track your progress

---

## 🎯 Today's Action Items

Based on current branch: `claude/fix-monorepo-builds-019rTq29GyFPBTHdttUkdE9w`

1. **Immediate**: Start fixing sync-core package
2. **Next**: Resolve Drizzle binary issue
3. **Then**: Run full build verification
4. **Finally**: Deploy to GCP Cloud Run + Cloudflare (⚠️ Railway is no longer
   used)

**Estimated time to launch**: 7-14 days with focused effort

---

**Need detailed instructions?** See `PUBLIC_LAUNCH_ROADMAP.md` **Ready to
start?** Begin with sync-core package fixes!
