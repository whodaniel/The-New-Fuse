# Railway Deployment - Quick Start Guide

## ✅ Successful Frontend Configuration

### Critical Settings:
1. **Root Directory**: EMPTY (do not set)
2. **Builder**: NIXPACKS
3. **Install Command**: `pnpm install --no-frozen-lockfile`
4. **Root Dockerfile**: Renamed to `Dockerfile.monorepo`

---

## 🚀 Deploy Any Service in 5 Steps

### 1. Create `railway.toml` in repo root:
```toml
[build]
builder = "NIXPACKS"
nixpacksConfigPath = "apps/<SERVICE>/nixpacks.toml"
watchPaths = ["apps/<SERVICE>/**", "packages/**"]

[deploy]
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyMaxRetries = 10
restartPolicyType = "ON_FAILURE"
```

### 2. Create `apps/<SERVICE>/nixpacks.toml`:
```toml
[phases.setup]
nixPkgs = ["nodejs_20", "pnpm"]

[variables]
NODE_VERSION = "20"
PNPM_VERSION = "10.19.0"

[phases.install]
cmds = ["pnpm install --no-frozen-lockfile"]

[phases.build]
cmds = [
  "pnpm --filter @the-new-fuse/types build || true",
  "pnpm --filter @the-new-fuse/core build || true",
  "pnpm --filter @the-new-fuse/<SERVICE_PACKAGE> build"
]

[start]
cmd = "pnpm --filter @the-new-fuse/<SERVICE_PACKAGE> start:prod"
```

### 3. Disable Dockerfiles:
```bash
mv apps/<SERVICE>/Dockerfile apps/<SERVICE>/Dockerfile.disabled
```

### 4. Railway UI Settings:
- **Root Directory**: Leave EMPTY
- **Environment Variables**: Add required vars
- **Connect to GitHub**: main branch

### 5. Deploy:
```bash
git add .
git commit -m "feat: Configure <service> for Railway"
git push origin main
```

---

## 📋 Services to Deploy

| Service | Package Name | Port | Status |
|---------|--------------|------|--------|
| Frontend | `@the-new-fuse/frontend-app` | 3000 | ✅ DEPLOYED |
| API | `@the-new-fuse/api-server` | 3001 | ⏳ Ready |
| Backend | `@the-new-fuse/backend-app` | 3004 | ⏳ Ready |
| API Gateway | `@the-new-fuse/api-gateway` | TBD | ⏳ Ready |
| Browser Hub | `@the-new-fuse/browser-hub` | TBD | ⏳ Ready |

---

## ⚠️ Common Mistakes to Avoid

| ❌ Don't Do This | ✅ Do This Instead |
|------------------|-------------------|
| Set Root Directory to `/apps/service` | Leave Root Directory EMPTY |
| Use `pnpm install` | Use `pnpm install --no-frozen-lockfile` |
| Keep Dockerfile in service dir | Rename to `Dockerfile.disabled` |
| Use `cp ../../pnpm-lock.yaml` | Don't copy files, run from root |
| Build only the service | Build dependencies first |

---

## 🔍 Verify Deployment Success

After deploying, check:
- [ ] Build logs show "Using Nixpacks"
- [ ] Install phase completes without lockfile errors
- [ ] All dependency packages build successfully
- [ ] Service builds successfully
- [ ] Deployment shows "Completed" status
- [ ] Health check passes (green indicator)
- [ ] Service URL returns expected response

---

## 📚 Full Documentation

See [RAILWAY-DEPLOYMENT-GUIDE.md](./RAILWAY-DEPLOYMENT-GUIDE.md) for:
- Detailed explanations
- Troubleshooting guide
- All configuration options
- Service-specific instructions
- Lessons learned from frontend deployment

---

**Quick Deploy**: Copy template files → Replace placeholders → Clear Root Directory → Push to GitHub
