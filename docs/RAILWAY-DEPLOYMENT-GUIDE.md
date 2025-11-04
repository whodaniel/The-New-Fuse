# Railway Deployment Guide - The New Fuse Monorepo

## ✅ Frontend Service - SUCCESSFULLY DEPLOYED

This guide documents the working configuration used to deploy the Frontend service, which can be replicated for other services.

---

## 🎯 Key Success Factors

### 1. **Use Nixpacks (Not Dockerfiles)**
Railway's nixpacks provides better monorepo support than Dockerfiles when properly configured.

### 2. **Root Directory Setting: MUST BE EMPTY**
- **CRITICAL**: Do NOT set a Root Directory in Railway UI
- Railway needs access to the entire monorepo to resolve workspace dependencies
- Setting Root Directory to `/apps/frontend` breaks workspace resolution

### 3. **Use `--no-frozen-lockfile` Flag**
- Nixpacks uses frozen-lockfile by default in CI environments
- If lockfile is outdated, use `pnpm install --no-frozen-lockfile`
- This allows pnpm to resolve dependencies from package.json

### 4. **Prevent Dockerfile Auto-Detection**
- Railway auto-detects Dockerfiles and uses them instead of nixpacks
- Solution: Rename root Dockerfile to `Dockerfile.monorepo` or similar

---

## 📁 Working Configuration Files

### `railway.toml` (in repo root)
```toml
[build]
builder = "NIXPACKS"
nixpacksConfigPath = "apps/frontend/nixpacks.toml"
watchPaths = ["apps/frontend/**", "packages/**"]

[deploy]
healthcheckPath = "/"
healthcheckTimeout = 300
restartPolicyMaxRetries = 10
restartPolicyType = "ON_FAILURE"
```

**Key Points:**
- `builder = "NIXPACKS"` - Forces nixpacks instead of Dockerfile
- `nixpacksConfigPath` - Points to service-specific nixpacks config
- `watchPaths` - Triggers rebuild when these paths change
- Place this file in **repo root** when Root Directory is empty

### `apps/frontend/nixpacks.toml`
```toml
# Nixpacks configuration for frontend service in monorepo
# This handles pnpm workspace dependencies correctly

[phases.setup]
nixPkgs = ["nodejs_20", "pnpm"]

[variables]
NODE_VERSION = "20"
PNPM_VERSION = "10.19.0"

[phases.install]
cmds = [
  # Install all workspace dependencies from root
  # Using --no-frozen-lockfile because lockfile is outdated (pnpm uses frozen by default in CI)
  "pnpm install --no-frozen-lockfile"
]

[phases.build]
cmds = [
  # Build dependencies first (types, ui-consolidated, etc)
  "pnpm --filter @the-new-fuse/types build || true",
  "pnpm --filter @the-new-fuse/ui-consolidated build || true",
  # Build frontend
  "pnpm --filter @the-new-fuse/frontend-app build"
]

[start]
cmd = "pnpm --filter @the-new-fuse/frontend-app start"
```

**Key Points:**
- `pnpm install --no-frozen-lockfile` - Critical for outdated lockfiles
- `pnpm --filter <package>` - Builds specific workspace packages
- `|| true` - Continues build even if dependency build fails
- Uses pnpm (not npm) to respect workspace configuration

---

## 🚀 Step-by-Step Deployment Process

### For Each Service:

#### 1. **Prepare Railway Service in UI**
1. Go to Railway Dashboard
2. Create new service or select existing service
3. **CRITICAL**: Clear/remove the "Root Directory" field (leave it empty)
4. Connect to GitHub repository
5. Select main branch

#### 2. **Prepare Configuration Files**

For each service you want to deploy (api, backend, api-gateway, browser-hub):

##### Create/Update `railway.toml` (in repo root)
```toml
[build]
builder = "NIXPACKS"
nixpacksConfigPath = "apps/<SERVICE_NAME>/nixpacks.toml"
watchPaths = ["apps/<SERVICE_NAME>/**", "packages/**"]

[deploy]
healthcheckPath = "/health"  # or "/" for frontend
healthcheckTimeout = 300
restartPolicyMaxRetries = 10
restartPolicyType = "ON_FAILURE"
```

##### Create/Update `apps/<SERVICE_NAME>/nixpacks.toml`
```toml
[phases.setup]
nixPkgs = ["nodejs_20", "pnpm"]

[variables]
NODE_VERSION = "20"
PNPM_VERSION = "10.19.0"

[phases.install]
cmds = [
  # DO NOT copy files - Railway has full repo access
  # Install from root with no frozen lockfile
  "pnpm install --no-frozen-lockfile"
]

[phases.build]
cmds = [
  # Build workspace dependencies first
  "pnpm --filter @the-new-fuse/types build || true",
  "pnpm --filter @the-new-fuse/core build || true",
  "pnpm --filter @the-new-fuse/database build || true",
  # Add other package dependencies as needed

  # Build the service
  "pnpm --filter @the-new-fuse/<SERVICE_PACKAGE_NAME> build"
]

[start]
cmd = "pnpm --filter @the-new-fuse/<SERVICE_PACKAGE_NAME> start:prod"
```

**Important Notes:**
- **DO NOT** use `cp ../../pnpm-workspace.yaml` commands
- **DO NOT** use relative path navigation (`../../`)
- Railway executes from repo root when Root Directory is empty
- Use `pnpm --filter` to target specific workspace packages

#### 3. **Ensure Dockerfiles Don't Interfere**
```bash
# Rename any Dockerfile in the service directory
mv apps/<SERVICE>/Dockerfile apps/<SERVICE>/Dockerfile.disabled

# Ensure root Dockerfile is renamed
mv Dockerfile Dockerfile.monorepo
```

#### 4. **Set Environment Variables in Railway**
- Go to service → Variables tab
- Add required environment variables:
  - `DATABASE_URL`
  - `REDIS_URL`
  - `JWT_SECRET`
  - Any service-specific variables

#### 5. **Deploy**
```bash
# Option 1: Push to GitHub (auto-deploys via webhook)
git add .
git commit -m "feat: Configure <service> for Railway deployment"
git push origin main

# Option 2: Manual deploy via Railway UI
# Click "Deploy" button in Railway dashboard

# Option 3: Deploy via CLI (may timeout, UI is more reliable)
railway up --service "<Service Name>"
```

#### 6. **Monitor Deployment**
1. Watch build logs in Railway dashboard
2. Verify phases complete:
   - ✅ Setup: Node.js 20 and pnpm installed
   - ✅ Install: `pnpm install --no-frozen-lockfile` succeeds
   - ✅ Build: All dependency packages build successfully
   - ✅ Build: Service builds successfully
   - ✅ Deploy: Service starts and passes healthcheck

---

## 📊 Services Ready for Deployment

### 1. **API Service** (`apps/api`)
- **Package Name**: `@the-new-fuse/api-server`
- **Port**: 3000 (default) or 3001
- **Dependencies**: types, core, database, utils, shared, security, port-management, api-types, a2a-core
- **Start Command**: `node dist/src/index.js`
- **Healthcheck**: `/health`
- **Current Config**: Uses Dockerfile (needs migration to nixpacks)

**Action Required:**
```bash
# Update apps/api/railway.toml
[build]
builder = "NIXPACKS"  # Change from DOCKERFILE

# Update apps/api/nixpacks.toml
[phases.install]
cmds = [
  "pnpm install --no-frozen-lockfile"  # Add flag, remove cp commands
]
```

### 2. **Backend Service** (`apps/backend`)
- **Package Name**: `@the-new-fuse/backend-app`
- **Port**: 3001 (default) or 3004
- **Dependencies**: core, database, types, utils
- **Start Command**: `node dist/main`
- **Healthcheck**: `/health` or `/`
- **Current Config**: Has nixpacks.toml (needs `--no-frozen-lockfile` added)

**Action Required:**
```bash
# Update apps/backend/nixpacks.toml
[phases.install]
cmds = [
  "pnpm install --no-frozen-lockfile"  # Add flag, remove cp commands
]
```

### 3. **API Gateway Service** (`apps/api-gateway`)
- **Package Name**: `@the-new-fuse/api-gateway`
- **Port**: Configurable (likely 3002 or 3003)
- **Dependencies**: core, types
- **Start Command**: `node dist/main`
- **Healthcheck**: `/health`
- **Current Config**: Has nixpacks.toml (needs `--no-frozen-lockfile` added)

**Action Required:**
```bash
# Update apps/api-gateway/nixpacks.toml
[phases.install]
cmds = [
  "pnpm install --no-frozen-lockfile"  # Add flag
]
```

### 4. **Browser Hub Service** (`apps/browser-hub`)
- **Package Name**: `@the-new-fuse/browser-hub`
- **Port**: Configurable
- **Dependencies**: mcp-core
- **Start Command**: `node server.js`
- **Healthcheck**: `/` or `/health`
- **Current Config**: Has nixpacks.toml (likely needs `--no-frozen-lockfile` added)

---

## 🔧 Common Issues & Solutions

### Issue 1: `ERR_PNPM_OUTDATED_LOCKFILE`
**Error:**
```
Cannot install with "frozen-lockfile" because pnpm-lock.yaml is not up to date
```

**Solution:**
Add `--no-frozen-lockfile` to install command in nixpacks.toml:
```toml
[phases.install]
cmds = ["pnpm install --no-frozen-lockfile"]
```

### Issue 2: Railway Detects Wrong Dockerfile
**Error:**
```
Using Detected Dockerfile
...multi-stage build errors...
```

**Solution:**
1. Rename root Dockerfile: `mv Dockerfile Dockerfile.monorepo`
2. Update railway.toml to explicitly use nixpacks:
```toml
[build]
builder = "NIXPACKS"
```

### Issue 3: Can't Find nixpacks.toml
**Error:**
```
Failed to read Nixpacks config file `nixpacks.toml`
No such file or directory
```

**Solution:**
1. Clear Root Directory field in Railway UI (leave empty)
2. Use full path in railway.toml:
```toml
nixpacksConfigPath = "apps/<SERVICE>/nixpacks.toml"
```

### Issue 4: Workspace Dependencies Not Found
**Error:**
```
Cannot find package '@the-new-fuse/types'
```

**Solution:**
1. Ensure Root Directory is empty in Railway UI
2. Build dependencies before service:
```toml
[phases.build]
cmds = [
  "pnpm --filter @the-new-fuse/types build || true",
  "pnpm --filter @the-new-fuse/<SERVICE> build"
]
```

### Issue 5: Build Succeeds But Deployment Fails
**Symptoms:**
- Build completes successfully
- Health check times out
- Service crashes on startup

**Solution:**
1. Check environment variables are set
2. Verify start command in nixpacks.toml matches package.json
3. Check service logs for startup errors
4. Ensure PORT environment variable is used (Railway provides this)

---

## ✨ Best Practices

### 1. **Consistent Package Naming**
Use workspace protocol in package.json:
```json
"dependencies": {
  "@the-new-fuse/types": "workspace:*"
}
```

### 2. **Build Order Matters**
Always build dependencies before the service:
```toml
[phases.build]
cmds = [
  "pnpm --filter @the-new-fuse/types build || true",
  "pnpm --filter @the-new-fuse/core build || true",
  "pnpm --filter @the-new-fuse/<SERVICE> build"
]
```

### 3. **Use Permissive Build Flags**
For dependencies that might have issues:
```bash
pnpm --filter <package> build || true  # Continues even if fails
```

For final service build:
```bash
pnpm --filter <service> build  # Must succeed
```

### 4. **Environment-Specific Start Commands**
In package.json, provide both dev and prod commands:
```json
{
  "scripts": {
    "start": "node dist/index.js",          // For Railway
    "start:prod": "node dist/main.js",      // Alternative for Railway
    "start:dev": "nest start --watch"       // For local development
  }
}
```

### 5. **Health Checks**
Implement health check endpoints in all services:
```typescript
// Example NestJS health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});
```

### 6. **Watch Paths**
Configure watchPaths to trigger rebuilds only when relevant files change:
```toml
[build]
watchPaths = ["apps/<SERVICE>/**", "packages/**"]
```

### 7. **Deployment Verification Checklist**
After each deployment:
- [ ] Service shows "Deployed" status (not "Failed" or "Building")
- [ ] Health check passes (green checkmark)
- [ ] Service logs show successful startup
- [ ] External URL returns expected response
- [ ] No error logs in Railway dashboard

---

## 🎓 Lessons Learned from Frontend Deployment

### What Worked:
1. ✅ Empty Root Directory setting
2. ✅ Nixpacks with `--no-frozen-lockfile`
3. ✅ railway.toml in repo root
4. ✅ Building workspace dependencies first
5. ✅ Using `pnpm --filter` for monorepo
6. ✅ Renaming Dockerfile to prevent auto-detection

### What Didn't Work:
1. ❌ Setting Root Directory to `/apps/frontend`
2. ❌ Using default frozen-lockfile with outdated lockfile
3. ❌ Letting Railway auto-detect and use root Dockerfile
4. ❌ Copying workspace files with `cp ../../` commands
5. ❌ Running `pnpm install` locally to update lockfile (disk full)

### Timeline:
- **Attempt 1**: Fixed nixpacks path → Still failed (Root Directory issue)
- **Attempt 2**: Cleared Root Directory → Railway used wrong Dockerfile
- **Attempt 3**: Renamed Dockerfile → Build failed (outdated lockfile)
- **Attempt 4**: Added `--no-frozen-lockfile` → ✅ **SUCCESS**

---

## 📝 Template Files

### Template: `railway.toml`
```toml
[build]
builder = "NIXPACKS"
nixpacksConfigPath = "apps/__SERVICE__/nixpacks.toml"
watchPaths = ["apps/__SERVICE__/**", "packages/**"]

[deploy]
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyMaxRetries = 10
restartPolicyType = "ON_FAILURE"
```

### Template: `apps/__SERVICE__/nixpacks.toml`
```toml
# Nixpacks configuration for __SERVICE__ in monorepo

[phases.setup]
nixPkgs = ["nodejs_20", "pnpm"]

[variables]
NODE_VERSION = "20"
PNPM_VERSION = "10.19.0"

[phases.install]
cmds = [
  "pnpm install --no-frozen-lockfile"
]

[phases.build]
cmds = [
  # Build workspace dependencies
  "pnpm --filter @the-new-fuse/types build || true",
  "pnpm --filter @the-new-fuse/core build || true",
  # Add more dependencies as needed

  # Build service
  "pnpm --filter @the-new-fuse/__PACKAGE_NAME__ build"
]

[start]
cmd = "pnpm --filter @the-new-fuse/__PACKAGE_NAME__ start:prod"
```

---

## 🚀 Quick Deploy Checklist

For deploying a new service:

1. [ ] Create `railway.toml` in repo root with correct paths
2. [ ] Create/update `nixpacks.toml` in service directory
3. [ ] Add `--no-frozen-lockfile` to install command
4. [ ] Remove/disable any Dockerfile in service directory
5. [ ] Ensure root Dockerfile is renamed (`.monorepo`)
6. [ ] List all workspace dependencies in build phase
7. [ ] Create service in Railway dashboard
8. [ ] **Clear Root Directory field (leave empty)**
9. [ ] Set environment variables
10. [ ] Deploy and monitor build logs
11. [ ] Verify health check passes
12. [ ] Test service endpoint

---

## 📚 Additional Resources

- [Railway Nixpacks Documentation](https://nixpacks.com/docs)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Railway Build Configuration](https://docs.railway.app/deploy/config-as-code)

---

**Last Updated**: After successful Frontend deployment
**Status**: Frontend ✅ | API ⏳ | Backend ⏳ | API Gateway ⏳ | Browser Hub ⏳
