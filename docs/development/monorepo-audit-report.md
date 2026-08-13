# The New Fuse Monorepo Structure Audit Report

Generated: 2025-11-18

## Executive Summary

The New Fuse monorepo contains **4 active apps** and **48 packages** across the
workspace. The monorepo is properly configured with pnpm workspaces and Turbo
for build orchestration. However, there are **14 critical configuration issues**
that need to be addressed, plus **23 legacy/incomplete package directories**
that should be cleaned up.

### Health Status: 🟡 MODERATE

- ✅ No circular dependencies detected
- ✅ All internal package references are valid
- ✅ Root workspace configuration is correct
- ⚠️ 14 packages missing proper export configurations
- ⚠️ 23 legacy directories without package.json
- ⚠️ 4 app directories without package.json

---

## 1. Monorepo Structure

### 1.1 Active Applications (4)

| App Name                     | Path                           | Status    | Dependencies         |
| ---------------------------- | ------------------------------ | --------- | -------------------- |
| `@the-new-fuse/api-server`   | `<repo-root>/apps/api`         | ✅ Active | 10 internal packages |
| `@the-new-fuse/api-gateway`  | `<repo-root>/apps/api-gateway` | ✅ Active | 2 internal packages  |
| `@the-new-fuse/backend-app`  | `<repo-root>/apps/backend`     | ✅ Active | 4 internal packages  |
| `@the-new-fuse/frontend-app` | `<repo-root>/apps/frontend`    | ✅ Active | 8 internal packages  |

### 1.2 Inactive/Legacy App Directories (4)

- `apps/client` - Missing package.json
- `apps/extension` - Missing package.json
- `apps/mcp-servers` - Missing package.json
- `apps/relay-server` - Missing package.json

**Recommendation:** Remove these directories or complete their setup.

### 1.3 Active Packages (48)

Organized by category:

#### Foundation/Core Packages (6)

- `@the-new-fuse/types` - **18 dependents** (Most depended-on package)
- `@the-new-fuse/core` - **10 dependents**
- `@the-new-fuse/utils` - **9 dependents**
- `@the-new-fuse/database` - **8 dependents**
- `@the-new-fuse/infrastructure` - **5 dependents**
- `@the-new-fuse/shared` - 3 dependents

#### Build & Infrastructure (5)

- `@tnf/build-optimization`
- `@tnf/core-monitoring` - **3 dependents**
- `@tnf/core-error-handling` - **3 dependents**
- `@the-new-fuse/deployment-core`
- `eslint-config-custom`

#### API & Communication (7)

- `@the-new-fuse/api`
- `@the-new-fuse/api-client`
- `@the-new-fuse/api-types` - **3 dependents**
- `@the-new-fuse/a2a-core` - **3 dependents**
- `@the-new-fuse/a2a-react`
- `@the-new-fuse/ap2-protocol`
- `@the-new-fuse/relay-core` - **4 dependents**

#### Frontend/UI (9)

- `@the-new-fuse/ui-consolidated`
- `@the-new-fuse/hooks`
- `@the-new-fuse/prompt-templating` - **3 dependents**
- `@the-new-fuse/feature-suggestions`
- `@the-new-fuse/feature-tracker`
- `@the-new-fuse/fairtable-core`
- `@the-new-fuse/fairtable-components`
- `@the-new-fuse/fairtable-adapters`
- `@the-new-fuse/fairtable-utils`

#### Backend/Services (7)

- `@the-new-fuse/backend`
- `@the-new-fuse/security`
- `@the-new-fuse/port-management`
- `@the-new-fuse/mcp-core`
- `@the-new-fuse/web-scraping`
- `@the-new-fuse/workflow-engine`
- `@the-new-fuse/sync-core`

#### Development/Testing (5)

- `@the-new-fuse/testing`
- `@the-new-fuse/test-utils`
- `@the-new-fuse/integration-tests`
- `@the-new-fuse/client`
- `@the-new-fuse/agent`

#### Utility/Configuration (9)

- `@the-new-fuse/contracts`
- `@the-new-fuse/common`
- `@the-new-fuse/proto-definitions`
- `@the-new-fuse/extension-system`
- `@the-new-fuse/core-vector-db`
- `features`
- `integrations`
- `layout`
- `monitoring`

### 1.4 Legacy Package Directories (23)

These directories exist but lack package.json files:

- `packages/@the-new-fuse`
- `packages/agent-protocol-bridge`
- `packages/api-gateway`
- `packages/cache`
- `packages/cli`
- `packages/commands-core`
- `packages/communication`
- `packages/config`
- `packages/core-auth`
- `packages/crypto-agent-framework`
- `packages/debugging`
- `packages/docs`
- `packages/frontend`
- `packages/integration-core`
- `packages/job-queue`
- `packages/messaging`
- `packages/shared-ui`
- `packages/tnf-cli`
- `packages/tnf-core`
- `packages/unified-discovery`
- `packages/unified-orchestration`
- `packages/web`
- `packages/websocket`

**Recommendation:** Archive or remove these directories.

---

## 2. Dependency Analysis

### 2.1 Dependency Graph

#### API Server Dependencies

```
@the-new-fuse/api-server
├── @the-new-fuse/a2a-core
│   ├── @the-new-fuse/ap2-protocol
│   └── @the-new-fuse/infrastructure
├── @the-new-fuse/api-types
│   └── @the-new-fuse/types
│       └── @the-new-fuse/prompt-templating
├── @the-new-fuse/core
│   ├── @the-new-fuse/database
│   │   └── @the-new-fuse/types
│   └── @the-new-fuse/infrastructure
├── @the-new-fuse/database
├── @the-new-fuse/port-management
├── @the-new-fuse/security
├── @the-new-fuse/shared
├── @the-new-fuse/types
├── @the-new-fuse/utils
└── @the-new-fuse/relay-core
    └── @the-new-fuse/database
```

#### API Gateway Dependencies

```
@the-new-fuse/api-gateway
├── @the-new-fuse/core
└── @the-new-fuse/types
```

#### Backend App Dependencies

```
@the-new-fuse/backend-app
├── @the-new-fuse/core
├── @the-new-fuse/database
├── @the-new-fuse/types
└── @the-new-fuse/utils
```

#### Frontend App Dependencies

```
@the-new-fuse/frontend-app
├── @the-new-fuse/a2a-core
├── @the-new-fuse/a2a-react
│   └── @the-new-fuse/a2a-core
├── @the-new-fuse/core
├── @the-new-fuse/feature-suggestions
│   └── @the-new-fuse/feature-tracker
├── @the-new-fuse/port-management
├── @the-new-fuse/prompt-templating
├── @the-new-fuse/types
└── @the-new-fuse/ui-consolidated
    ├── @the-new-fuse/api-client
    ├── @the-new-fuse/hooks
    ├── @the-new-fuse/types
    └── @the-new-fuse/utils
```

### 2.2 Most Critical Packages (by Dependents)

| Package                           | Dependents | Category       |
| --------------------------------- | ---------- | -------------- |
| `@the-new-fuse/types`             | 18         | Foundation     |
| `@the-new-fuse/core`              | 10         | Foundation     |
| `@the-new-fuse/utils`             | 9          | Foundation     |
| `@the-new-fuse/database`          | 8          | Foundation     |
| `@the-new-fuse/infrastructure`    | 5          | Infrastructure |
| `@the-new-fuse/relay-core`        | 4          | Communication  |
| `@the-new-fuse/a2a-core`          | 3          | Communication  |
| `@the-new-fuse/api-types`         | 3          | API            |
| `@the-new-fuse/prompt-templating` | 3          | UI             |
| `@tnf/core-monitoring`            | 3          | Infrastructure |

### 2.3 Circular Dependencies

✅ **No circular dependencies detected** - This is excellent! The dependency
graph is properly structured.

---

## 3. Configuration Issues

### 3.1 Critical Issues (Priority 1)

#### Missing Export Configurations

The following packages are missing proper `main`/`exports` and/or `types`
fields:

1. **@the-new-fuse/backend**
   - ❌ Missing `main` or `exports`
   - ❌ Missing `types`
   - **Impact:** Cannot be imported by other packages
   - **Fix:** Add to package.json:
     ```json
     {
       "main": "dist/index.js",
       "types": "dist/index.d.ts"
     }
     ```

2. **@the-new-fuse/client**
   - ❌ Missing `main` or `exports`
   - ❌ Missing `types`
   - **Impact:** Cannot be imported by other packages
   - **Fix:** Same as above

3. **@the-new-fuse/common**
   - ❌ Missing `main` or `exports`
   - ❌ Missing `types`
   - **Impact:** Cannot be imported by other packages
   - **Fix:** Same as above

4. **@the-new-fuse/integration-tests**
   - ❌ Missing `main` or `exports`
   - ❌ Missing `types`
   - **Note:** Testing packages may not need exports if they're not imported
     elsewhere

### 3.2 Medium Priority Issues (Priority 2)

#### Missing Build Scripts

1. **@the-new-fuse/contracts**
   - ❌ Missing `types` field
   - ❌ Missing `build` script
   - **Impact:** Won't be built by Turbo pipeline

2. **eslint-config-custom**
   - ❌ Missing `types` field (Expected for ESLint config)
   - ❌ Missing `build` script
   - **Note:** ESLint configs typically don't need TypeScript types

3. **features**
   - ❌ Missing `main` or `exports`
   - ❌ Missing `types`
   - ❌ Missing `build` script

4. **integrations**
   - ❌ Missing `main` or `exports`
   - ❌ Missing `types`
   - ❌ Missing `build` script

5. **layout**
   - ❌ Missing `main` or `exports`
   - ❌ Missing `types`
   - ❌ Missing `build` script

6. **monitoring**
   - ❌ Missing `main` or `exports`
   - ❌ Missing `types`
   - ❌ Missing `build` script

---

## 4. Workspace Configuration

### 4.1 Root package.json

✅ **Status:** Properly configured

- Package manager: `pnpm@10.22.0`
- Workspaces: `apps/*`, `packages/*`, `tools/*`
- Build tool: Turbo
- Scripts: Comprehensive set of build, dev, and test scripts

### 4.2 pnpm-workspace.yaml

✅ **Status:** Properly configured

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
  - 'tools/*'
```

### 4.3 Turbo Configuration

✅ **Status:** Properly configured

The `turbo.json` file defines:

- Build pipeline with proper dependency ordering
- Memory-optimized build strategies
- Proper caching configuration
- Development workflow scripts

**Key Features:**

- `build` task with `^build` dependency (builds dependencies first)
- Separate `build:foundation`, `build:core`, `build:memory-optimized` strategies
- Proper cache configuration for all tasks
- Environment variable passthrough

---

## 5. TypeScript Configuration

### 5.1 Base Configuration

The monorepo uses a shared `tsconfig.base.json` that individual packages extend.

**Example from @the-new-fuse/types:**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true,
    "declaration": true
  },
  "references": [{ "path": "../prompt-templating" }]
}
```

✅ Uses TypeScript project references for better build performance

---

## 6. Build Pipeline Analysis

### 6.1 Build Order

Based on the dependency graph, the optimal build order is:

1. **Foundation Layer (No dependencies)**
   - `@the-new-fuse/prompt-templating`
   - `@tnf/core-monitoring`
   - `@tnf/core-error-handling`

2. **Core Layer**
   - `@the-new-fuse/types` (depends on prompt-templating)
   - `@the-new-fuse/infrastructure`

3. **Database & Utils Layer**
   - `@the-new-fuse/database` (depends on types)
   - `@the-new-fuse/utils`

4. **Service Layer**
   - `@the-new-fuse/core` (depends on database, infrastructure)
   - `@the-new-fuse/security` (depends on database, core)
   - `@the-new-fuse/shared` (depends on core, types, utils)
   - `@the-new-fuse/relay-core` (depends on database)
   - And others...

5. **Application Layer**
   - All apps (depend on various service layer packages)

✅ The Turbo `dependsOn: ["^build"]` configuration handles this automatically.

---

## 7. Issues Summary

### 7.1 All Issues by Priority

#### 🔴 PRIORITY 1 - Critical (Must Fix)

1. **Missing package.json in 4 app directories**
   - `apps/client`, `apps/extension`, `apps/mcp-servers`, `apps/relay-server`
   - **Action:** Either remove directories or complete package setup

2. **4 packages missing export configurations**
   - `@the-new-fuse/backend`, `@the-new-fuse/client`, `@the-new-fuse/common`,
     `@the-new-fuse/integration-tests`
   - **Action:** Add `main`, `module`, `types` fields to package.json

#### 🟡 PRIORITY 2 - Important (Should Fix)

3. **6 packages missing build scripts**
   - `@the-new-fuse/contracts`, `eslint-config-custom`, `features`,
     `integrations`, `layout`, `monitoring`
   - **Action:** Add build script or mark as non-buildable packages

4. **23 legacy package directories without package.json**
   - Various directories in `packages/`
   - **Action:** Clean up or archive

#### 🟢 PRIORITY 3 - Low (Nice to Have)

5. **Inconsistent naming conventions**
   - Mix of `@the-new-fuse/` and `@tnf/` prefixes
   - **Action:** Standardize on one prefix (recommend `@tnf/`)

---

## 8. Recommendations

### 8.1 Immediate Actions (This Week)

1. **Fix Critical Export Issues**

   ```bash
   # For each affected package, add to package.json:
   {
     "main": "dist/index.js",
     "types": "dist/index.d.ts",
     "exports": {
       ".": {
         "types": "./dist/index.d.ts",
         "import": "./dist/index.js",
         "require": "./dist/index.js"
       }
     }
   }
   ```

2. **Clean Up Legacy Directories**

   ```bash
   # Create an archive directory
   mkdir -p archive/packages archive/apps

   # Move unused directories
   mv apps/client archive/apps/
   mv apps/extension archive/apps/
   # ... etc
   ```

3. **Add Missing Build Scripts**
   - For each package that should be built, add:
     ```json
     {
       "scripts": {
         "build": "tsc",
         "clean": "rimraf dist"
       }
     }
     ```

### 8.2 Short-term Actions (Next 2 Weeks)

4. **Standardize Package Naming**
   - Decide on either `@the-new-fuse/` or `@tnf/` prefix
   - Create migration plan for renaming packages
   - Update all references

5. **Add Package Documentation**
   - Create README.md for each package
   - Document purpose, API, and usage
   - Add to package.json:
     ```json
     {
       "repository": {
         "type": "git",
         "url": "https://github.com/your-org/the-new-fuse",
         "directory": "packages/package-name"
       }
     }
     ```

6. **Implement Dependency Validation**
   - Add a pre-commit hook to validate package configurations
   - Add CI check for broken references
   - Add CI check for circular dependencies

### 8.3 Long-term Actions (Next Month)

7. **Create Package Categories**
   - Organize packages into subdirectories:
     - `packages/core/` - Foundation packages
     - `packages/ui/` - Frontend packages
     - `packages/api/` - Backend packages
     - `packages/tools/` - Development tools

8. **Add Versioning Strategy**
   - Implement Changesets for version management
   - Add automated changelog generation
   - Set up automated releases

9. **Optimize Build Performance**
   - Review and optimize TypeScript configurations
   - Implement incremental builds where possible
   - Add build caching strategy

---

## 9. Package Configuration Checklist

For each package, ensure:

- [ ] Valid `package.json` with:
  - [ ] `name` field (with proper prefix)
  - [ ] `version` field
  - [ ] `main` or `exports` field
  - [ ] `types` field
  - [ ] `scripts.build` (if package needs building)
  - [ ] `scripts.test` (even if just echo message)
  - [ ] `scripts.clean`
  - [ ] Proper `dependencies` (runtime)
  - [ ] Proper `devDependencies` (build/test time)
  - [ ] Proper `peerDependencies` (if applicable)

- [ ] Valid `tsconfig.json` with:
  - [ ] Extends `../../tsconfig.base.json`
  - [ ] Proper `outDir` and `rootDir`
  - [ ] `composite: true` for project references
  - [ ] `declaration: true` for type generation
  - [ ] Proper `references` to dependencies

- [ ] Source structure:
  - [ ] `src/` directory with source files
  - [ ] `src/index.ts` as main entry point
  - [ ] Proper type exports

- [ ] Build output:
  - [ ] `dist/` directory (gitignored)
  - [ ] Generates `.d.ts` files
  - [ ] Proper module format (ESM/CJS)

---

## 10. Conclusion

The New Fuse monorepo is **fundamentally well-structured** with:

- ✅ Proper workspace configuration
- ✅ No circular dependencies
- ✅ Valid internal package references
- ✅ Good build orchestration with Turbo

However, it requires **cleanup and standardization**:

- 🔴 14 critical configuration issues
- 🟡 23 legacy directories to clean up
- 🟢 Naming consistency improvements needed

**Estimated Time to Fix:**

- Priority 1 issues: 4-6 hours
- Priority 2 issues: 8-12 hours
- Priority 3 issues: 16-24 hours

**Total Estimated Effort:** 2-3 days of focused work

Once these issues are addressed, the monorepo will be production-ready with
excellent maintainability and developer experience.
