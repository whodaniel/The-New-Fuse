# Next Deployments - Action Items

## 🎯 Services Ready to Deploy (in recommended order)

### 1. API Service (`apps/api`)

**Current State:**
- ❌ Uses Dockerfile (not Nixpacks)
- ❌ Missing `--no-frozen-lockfile` flag
- ✅ Has railway.toml and nixpacks.toml

**Required Changes:**

#### Update `apps/api/railway.toml`:
```toml
[build]
builder = "NIXPACKS"  # Change from "DOCKERFILE"
nixpacksConfigPath = "apps/api/nixpacks.toml"
```

#### Update `apps/api/nixpacks.toml`:
```toml
[phases.install]
cmds = [
  # Remove these lines:
  # "cp ../../pnpm-workspace.yaml .",
  # "cp ../../pnpm-lock.yaml .",
  # "cp ../../package.json .",

  # Replace with:
  "pnpm install --no-frozen-lockfile"
]
```

#### Disable Dockerfile:
```bash
mv apps/api/Dockerfile apps/api/Dockerfile.disabled
```

**Dependencies to Build First:**
- @the-new-fuse/types
- @the-new-fuse/core
- @the-new-fuse/database
- @the-new-fuse/utils
- @the-new-fuse/shared
- @the-new-fuse/security
- @the-new-fuse/port-management
- @the-new-fuse/api-types
- @the-new-fuse/a2a-core

---

### 2. Backend Service (`apps/backend`)

**Current State:**
- ✅ Uses Nixpacks
- ❌ Missing `--no-frozen-lockfile` flag
- ❌ Tries to copy workspace files
- ✅ Has railway.toml and nixpacks.toml

**Required Changes:**

#### Update `apps/backend/nixpacks.toml`:
```toml
[phases.install]
cmds = [
  # Remove these lines:
  # "cp ../../pnpm-workspace.yaml .",
  # "cp ../../pnpm-lock.yaml .",
  # "cp ../../package.json .",

  # Replace with:
  "pnpm install --no-frozen-lockfile"
]
```

**Dependencies to Build First:**
- @the-new-fuse/types
- @the-new-fuse/core
- @the-new-fuse/database
- @the-new-fuse/utils

---

### 3. API Gateway Service (`apps/api-gateway`)

**Current State:**
- ✅ Uses Nixpacks
- ❌ Missing `--no-frozen-lockfile` flag
- ✅ Already runs from root (no cp commands)
- ✅ Has railway.toml and nixpacks.toml

**Required Changes:**

#### Update `apps/api-gateway/nixpacks.toml`:
```toml
[phases.install]
cmds = [
  "pnpm install --no-frozen-lockfile"  # Just add the flag
]
```

**Dependencies to Build First:**
- @the-new-fuse/types
- @the-new-fuse/core

---

### 4. Browser Hub Service (`apps/browser-hub`)

**Current State:**
- ⚠️ Has nixpacks.toml (needs review)
- ⚠️ May need railway.toml created
- Simple Express server

**Required Changes:**
- Review and update nixpacks.toml (if needed)
- Create railway.toml following template
- Add `--no-frozen-lockfile` flag

**Dependencies to Build First:**
- @the-new-fuse/mcp-core

---

## 📝 Batch Update Script

Run these commands to update all services at once:

```bash
#!/bin/bash

# API Service
echo "Updating API service..."
mv apps/api/Dockerfile apps/api/Dockerfile.disabled

# Update nixpacks configs with --no-frozen-lockfile
# (Manual edits required - see specific service sections above)

# Backend Service
echo "Updating Backend service..."
# (Manual nixpacks.toml edit required)

# API Gateway Service
echo "Updating API Gateway service..."
# (Manual nixpacks.toml edit required)

# Commit all changes
git add apps/*/nixpacks.toml apps/*/railway.toml apps/*/*.disabled
git commit -m "feat: Update Railway configs for all services with --no-frozen-lockfile"
git push origin main
```

---

## 🔄 Deployment Order Recommendation

Deploy in this order to manage dependencies:

1. **Frontend** ✅ (Already deployed)
2. **API Gateway** (Fewest dependencies)
3. **Backend** (Core services)
4. **API** (Most dependencies, should go last)
5. **Browser Hub** (Independent service)

---

## ⚙️ Railway UI Setup (For Each Service)

Before deploying each service:

1. **Create New Service** in Railway Dashboard
   - Click "New Service"
   - Select "GitHub Repo"
   - Choose your repository

2. **Service Settings:**
   - Name: `Frontend Application` / `API Service` / etc.
   - **Root Directory**: Leave EMPTY ⚠️
   - Branch: `main`

3. **Environment Variables:**
   Add service-specific variables:

   **API Service:**
   - `DATABASE_URL`
   - `REDIS_URL`
   - `JWT_SECRET`
   - `PORT` (Railway auto-provides, but can override)

   **Backend Service:**
   - `DATABASE_URL`
   - `REDIS_URL`
   - `SESSION_SECRET`

   **API Gateway:**
   - `API_SERVICE_URL` (point to API service URL)
   - `BACKEND_SERVICE_URL` (point to Backend service URL)

4. **Deploy Configuration:**
   - Copy `railway.toml` from template
   - Update paths to match service
   - Place in repo root
   - Commit and push

---

## ✅ Post-Deployment Checklist

After deploying each service:

- [ ] Service status shows "Deployed" (green)
- [ ] Build logs show "Using Nixpacks"
- [ ] Install completed without lockfile errors
- [ ] All workspace dependencies built successfully
- [ ] Service built successfully
- [ ] Health check endpoint returns 200 OK
- [ ] Service logs show no startup errors
- [ ] Can access service URL externally
- [ ] Service communicates with other deployed services
- [ ] Environment variables are properly set

---

## 🐛 Expected Issues & Solutions

### Issue: "Cannot install with frozen-lockfile"
**Solution:** Verify `--no-frozen-lockfile` is in nixpacks.toml

### Issue: "Cannot find workspace package"
**Solution:** Ensure Root Directory is empty in Railway UI

### Issue: Railway uses Dockerfile instead of Nixpacks
**Solution:**
1. Rename Dockerfile to `.disabled`
2. Set `builder = "NIXPACKS"` in railway.toml
3. Ensure root Dockerfile is renamed to `.monorepo`

### Issue: Build succeeds but deployment fails
**Solution:**
1. Check environment variables are set
2. Verify start command in package.json
3. Check service logs for errors
4. Ensure PORT variable is used correctly

---

## 📊 Deployment Progress Tracker

| Service | Config Updated | Deployed | Health Check | Status |
|---------|---------------|----------|--------------|--------|
| Frontend | ✅ | ✅ | ✅ | Production |
| API Gateway | ⏳ | ⏳ | ⏳ | Ready |
| Backend | ⏳ | ⏳ | ⏳ | Ready |
| API | ⏳ | ⏳ | ⏳ | Ready |
| Browser Hub | ⏳ | ⏳ | ⏳ | Ready |

Update this table as you deploy each service.

---

## 🎯 Success Criteria

All deployments are considered successful when:

1. ✅ All services show "Deployed" status
2. ✅ All health checks pass
3. ✅ Frontend can communicate with API Gateway
4. ✅ API Gateway routes to Backend and API services
5. ✅ No errors in any service logs
6. ✅ All services auto-deploy on GitHub push
7. ✅ Monitoring and metrics are visible in Railway

---

**Ready to Deploy?** Start with API Gateway (simplest) or follow the recommended order above.

**Need Help?** Refer to [RAILWAY-DEPLOYMENT-GUIDE.md](./RAILWAY-DEPLOYMENT-GUIDE.md) for detailed troubleshooting.
