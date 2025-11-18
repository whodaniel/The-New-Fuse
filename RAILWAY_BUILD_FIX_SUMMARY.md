# Railway Deployment Fix Summary

## Critical Issues Identified and Fixed

### Issue 1: Docker COPY Command Not Preserving Directory Structure ⚠️ CRITICAL

**Problem:**
All `Dockerfile.railway` files were using:
```dockerfile
COPY packages/*/package.json ./packages/
```

This glob pattern does NOT preserve directory structure. Docker copies all matched files into the target directory as a flat list, resulting in:
```
./packages/package.json  # All package.json files mixed together
./packages/package.json  # Overwriting each other!
```

Instead of the required structure:
```
./packages/types/package.json
./packages/core/package.json
./packages/database/package.json
# etc.
```

**Impact:**
- Workspace dependencies cannot be resolved
- pnpm cannot link internal packages
- Build fails with "Cannot find module @the-new-fuse/types" errors

**Fix Applied:**
Changed all Dockerfile.railway files to copy the entire packages directory:
```dockerfile
# Copy all workspace packages - we need the full directory structure
# Copying individual package.json files with globs doesn't preserve directories
COPY packages ./packages
```

**Files Fixed:**
- `/home/user/fuse/apps/api-gateway/Dockerfile.railway`
- `/home/user/fuse/apps/api/Dockerfile.railway`
- `/home/user/fuse/apps/backend/Dockerfile.railway`
- `/home/user/fuse/apps/frontend/Dockerfile.railway`

---

### Issue 2: Package.json Main Field Mismatch ⚠️ CRITICAL

**Problem:**
The `@the-new-fuse/types` package had inconsistent configuration:
- `tsconfig.json` specified `"outDir": "./dist"`
- `package.json` specified `"main": "index.js"` (no dist/)

This mismatch caused runtime import failures because:
1. TypeScript builds to `dist/index.js`
2. Node.js looks for `index.js` (at package root)
3. File not found!

**Fix Applied:**
Updated `/home/user/fuse/packages/types/package.json`:
```json
{
  "main": "dist/index.js",
  "types": "dist/index.d.ts"
}
```

Now matches the tsconfig output directory.

---

## Build Order and Dependencies

### Stage 1: Dependency Installation (deps stage)

1. Copy workspace configuration files
   - `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`
   - `.npmrc`, `.pnpmrc`
   - `scripts/` directory

2. Copy all app package.json files
   - `apps/api-gateway/package.json`
   - `apps/api/package.json`
   - `apps/backend/package.json`
   - `apps/frontend/package.json`

3. **Copy entire packages directory** (FIXED)
   - `packages/` with full directory structure preserved

4. Run `pnpm install --frozen-lockfile --ignore-scripts`
   - Installs all dependencies
   - Creates initial workspace links

### Stage 2: Build (builder stage)

1. Copy node_modules from deps stage

2. Copy all source files
   - `COPY . .`

3. **Re-link workspace packages** (CRITICAL)
   ```dockerfile
   RUN pnpm install --prefer-offline --frozen-lockfile --ignore-scripts
   ```
   This step is ESSENTIAL because:
   - Source files are now present
   - TypeScript project references need proper linking
   - Workspace dependencies need to resolve to source, not just package.json

4. Build workspace dependencies first
   ```dockerfile
   # For api-gateway:
   RUN pnpm --filter @the-new-fuse/api-gateway^... build
   ```
   The `^...` syntax means "build all dependencies of this package"

5. Build the target service
   ```dockerfile
   RUN pnpm --filter @the-new-fuse/api-gateway build
   ```

### Stage 3: Production (runner stage)

1. Copy built artifacts
   - Service dist directory
   - Service package.json
   - All node_modules
   - **All packages/** (includes built dist/ directories)
   - Prisma schema (if applicable)

2. Setup non-root user for security

3. Run the application

---

## Dependency Chain Analysis

### API Gateway Dependencies
From `/home/user/fuse/apps/api-gateway/package.json`:
- `@the-new-fuse/core` (workspace:*)
- `@the-new-fuse/types` (workspace:*)

### API Server Dependencies
From `/home/user/fuse/apps/api/package.json`:
- `@the-new-fuse/a2a-core` (workspace:*)
- `@the-new-fuse/api-types` (workspace:*)
- `@the-new-fuse/core` (workspace:*)
- `@the-new-fuse/database` (workspace:*)
- `@the-new-fuse/port-management` (workspace:*)
- `@the-new-fuse/security` (workspace:*)
- `@the-new-fuse/shared` (workspace:*)
- `@the-new-fuse/types` (workspace:*)
- `@the-new-fuse/utils` (workspace:*)
- `@tnf/relay-core` (workspace:*)

### TypeScript Project References
From `/home/user/fuse/apps/api/tsconfig.json`:
- `packages/types`
- `packages/core`
- `packages/database`
- `packages/utils`

---

## Transitive Dependencies (Package -> Package)

### Core Package Dependencies
From `/home/user/fuse/packages/core/package.json`:
- `@the-new-fuse/database` (workspace:*)
- `@the-new-fuse/infrastructure` (workspace:*)

### Database Package Dependencies
From `/home/user/fuse/packages/database/package.json`:
- `@the-new-fuse/types` (workspace:*)

### Shared Package Dependencies
From `/home/user/fuse/packages/shared/package.json`:
- `@the-new-fuse/core` (workspace:*)
- `@the-new-fuse/types` (workspace:*)
- `@the-new-fuse/utils` (workspace:*)

### Security Package Dependencies
From `/home/user/fuse/packages/security/package.json`:
- `@the-new-fuse/database` (workspace:*)
- `@the-new-fuse/core` (workspace:*)

### Types Package Dependencies
From `/home/user/fuse/packages/types/package.json`:
- `@the-new-fuse/prompt-templating` (workspace:*)

---

## Build Order Resolution

Based on the dependency graph, packages must be built in this order:

### Tier 1: Foundation Packages (No workspace dependencies)
- `@the-new-fuse/prompt-templating`
- `@the-new-fuse/infrastructure`

### Tier 2: Core Type Packages
- `@the-new-fuse/types` (depends on: prompt-templating)

### Tier 3: Database and Utils
- `@the-new-fuse/database` (depends on: types)
- `@the-new-fuse/utils`

### Tier 4: Core Services
- `@the-new-fuse/core` (depends on: database, infrastructure)

### Tier 5: Specialized Packages
- `@the-new-fuse/security` (depends on: database, core)
- `@the-new-fuse/shared` (depends on: core, types, utils)
- `@the-new-fuse/api-types`
- `@the-new-fuse/port-management`
- `@the-new-fuse/a2a-core`
- `@tnf/relay-core`

### Tier 6: Applications
- `@the-new-fuse/api-gateway` (depends on: core, types)
- `@the-new-fuse/api-server` (depends on: many packages)
- `@the-new-fuse/backend` (depends on: many packages)
- `@the-new-fuse/frontend-app` (depends on: many packages)

**Good News:** Turbo and pnpm's `--filter package^...` syntax handles this automatically!

---

## Critical Build Commands Explained

### `pnpm --filter @package^... build`
- Builds all workspace dependencies of `@package`
- Does NOT build `@package` itself
- Follows dependency graph automatically
- Respects TypeScript project references

### `pnpm --filter @package build`
- Builds ONLY `@package`
- Assumes dependencies are already built
- Should be run AFTER `^...` command

### `pnpm install --prefer-offline`
- Re-links workspace packages without re-downloading
- Uses local package cache when possible
- CRITICAL after copying source files in Docker build
- Ensures TypeScript project references work correctly

---

## Package Main Entry Point Standards

All workspace packages should follow this standard:

```json
{
  "name": "@the-new-fuse/package-name",
  "main": "dist/index.js",
  "types": "dist/index.d.ts"
}
```

With corresponding `tsconfig.json`:

```json
{
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "composite": true
  }
}
```

And `build` script:

```json
{
  "scripts": {
    "build": "tsc"
  }
}
```

---

## Verification Checklist

After deploying, verify:

- [ ] Railway build logs show successful dependency installation
- [ ] All workspace packages are linked correctly
- [ ] TypeScript compilation succeeds for all packages
- [ ] No "Cannot find module @the-new-fuse/*" errors
- [ ] dist/ directories exist for all packages
- [ ] Service starts successfully
- [ ] Health check endpoint responds

---

## Common Issues and Solutions

### Issue: "Cannot find module @the-new-fuse/types"

**Cause:** Package not built or dist/ directory missing

**Solution:**
1. Ensure package.json main field points to dist/
2. Ensure package is included in build filter
3. Check that `pnpm --filter service^... build` runs before service build

### Issue: "Cannot find package.json"

**Cause:** Directory structure not preserved in COPY command

**Solution:** Use `COPY packages ./packages` instead of glob patterns

### Issue: "Module is not a valid TypeScript project"

**Cause:** Workspace packages not re-linked after copying source

**Solution:** Ensure `pnpm install --prefer-offline` runs after `COPY . .`

---

## Files Modified in This Fix

1. `/home/user/fuse/apps/api-gateway/Dockerfile.railway` - Fixed COPY command
2. `/home/user/fuse/apps/api/Dockerfile.railway` - Fixed COPY command
3. `/home/user/fuse/apps/backend/Dockerfile.railway` - Fixed COPY command
4. `/home/user/fuse/apps/frontend/Dockerfile.railway` - Fixed COPY command
5. `/home/user/fuse/packages/types/package.json` - Fixed main field

---

## Railway Service Configuration

Each Railway service should have:

1. **Root Directory:** `.` (repository root)
2. **Dockerfile Path:** `./apps/{service}/Dockerfile.railway`
3. **Environment Variables:**
   - `DATABASE_URL`
   - `REDIS_URL`
   - `JWT_SECRET`
   - `PORT` (auto-set by Railway)
   - Service-specific variables

---

## Next Steps

1. Commit these changes
2. Push to trigger Railway deployment
3. Monitor build logs for success
4. Verify all services start correctly
5. Check health endpoints
6. Test API functionality

---

**Status:** All critical issues fixed and documented
**Last Updated:** 2025-11-18
