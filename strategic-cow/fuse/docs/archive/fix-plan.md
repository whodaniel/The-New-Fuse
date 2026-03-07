# The New Fuse Monorepo - Detailed Fix Plan

## Overview

This document provides step-by-step instructions for fixing all identified
issues in the monorepo audit.

---

## Phase 1: Critical Fixes (Priority 1) - Estimated Time: 4-6 hours

### Task 1.1: Fix Package Export Configurations

**Affected Packages:**

- `@the-new-fuse/backend`
- `@the-new-fuse/client`
- `@the-new-fuse/common`
- `@the-new-fuse/integration-tests`

**For each package, update package.json:**

```bash
# 1. @the-new-fuse/backend
cat > packages/backend/package.json.patch << 'EOF'
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
EOF

# 2. @the-new-fuse/client
cat > packages/client/package.json.patch << 'EOF'
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
EOF

# 3. @the-new-fuse/common
cat > packages/common/package.json.patch << 'EOF'
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
EOF

# 4. @the-new-fuse/integration-tests (may not need exports if not imported)
# Review if this package is actually imported anywhere
# If not, it can stay as-is
```

**Manual Steps:**

1. Open each package.json file
2. Add the `main`, `types`, and `exports` fields
3. Ensure the package has a proper `src/index.ts` entry point
4. Run `pnpm build` to verify

### Task 1.2: Handle Incomplete App Directories

**Option A: Remove (if not needed)**

```bash
# Create archive directory
mkdir -p archive/apps

# Move incomplete apps
mv apps/client archive/apps/
mv apps/extension archive/apps/
mv apps/mcp-servers archive/apps/
mv apps/relay-server archive/apps/

# Update git
git add -A
git commit -m "chore: archive incomplete app directories"
```

**Option B: Complete Setup (if needed)**

For each app directory that should be kept:

1. Create package.json:

```json
{
  "name": "@the-new-fuse/[app-name]",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "echo 'TODO: implement dev script'",
    "build": "echo 'TODO: implement build script'",
    "test": "echo 'TODO: implement tests'"
  }
}
```

2. Create basic structure:

```bash
mkdir -p apps/[app-name]/src
touch apps/[app-name]/src/index.ts
touch apps/[app-name]/tsconfig.json
touch apps/[app-name]/README.md
```

---

## Phase 2: Important Fixes (Priority 2) - Estimated Time: 8-12 hours

### Task 2.1: Add Build Scripts to Packages

**Affected Packages:**

- `@the-new-fuse/contracts`
- `eslint-config-custom`
- `features`
- `integrations`
- `layout`
- `monitoring`

**For each package:**

```bash
# Check if package actually needs building
# If YES, add to package.json:
{
  "scripts": {
    "build": "tsc",
    "build:watch": "tsc --watch",
    "clean": "rimraf dist"
  }
}

# If NO (e.g., pure config packages), add:
{
  "scripts": {
    "build": "echo 'No build needed for config package'",
    "clean": "echo 'Nothing to clean'"
  }
}
```

**Specific Fixes:**

1. **eslint-config-custom** - No build needed (it's a config package)

   ```json
   {
     "scripts": {
       "build": "echo 'ESLint config does not require building'",
       "clean": "echo 'Nothing to clean'"
     }
   }
   ```

2. **@the-new-fuse/contracts** - Likely needs building if it contains TypeScript

   ```json
   {
     "scripts": {
       "build": "tsc",
       "clean": "rimraf dist"
     },
     "types": "dist/index.d.ts"
   }
   ```

3. **features**, **integrations**, **layout**, **monitoring**
   - Review each package to determine if it's:
     - A real package that needs building
     - A legacy/unused package that should be archived
     - A config/documentation package that doesn't need building

### Task 2.2: Clean Up Legacy Directories

```bash
# Create archive directory
mkdir -p archive/packages

# Move all legacy directories
for dir in \
  @the-new-fuse \
  agent-protocol-bridge \
  api-gateway \
  cache \
  cli \
  commands-core \
  communication \
  config \
  core-auth \
  crypto-agent-framework \
  debugging \
  docs \
  frontend \
  integration-core \
  job-queue \
  messaging \
  shared-ui \
  tnf-cli \
  tnf-core \
  unified-discovery \
  unified-orchestration \
  web \
  websocket
do
  if [ -d "packages/$dir" ]; then
    mv "packages/$dir" "archive/packages/"
  fi
done

# Create archive README
cat > archive/README.md << 'EOF'
# Archived Packages

This directory contains packages that were removed from the active monorepo.

## Reason for Archival

These directories existed but lacked complete package.json configurations and appeared to be legacy/unused code.

## Date Archived

2025-11-18

## Restoration

If you need to restore any of these packages:
1. Move the directory back to `packages/` or `apps/`
2. Ensure it has a valid package.json
3. Run `pnpm install`
4. Add proper build scripts
5. Update dependencies
EOF

# Commit changes
git add -A
git commit -m "chore: archive legacy package directories"
```

---

## Phase 3: Optimization & Standardization (Priority 3) - Estimated Time: 16-24 hours

### Task 3.1: Standardize Package Naming

**Current State:**

- Mix of `@the-new-fuse/` and `@tnf/` prefixes

**Recommendation:** Standardize on `@tnf/` for all packages

**Migration Plan:**

1. Create mapping of old to new names:

```
@the-new-fuse/types → @tnf/types
@the-new-fuse/core → @tnf/core
@the-new-fuse/utils → @tnf/utils
... etc
```

2. Use a script to update all references:

```bash
# Create rename script
node scripts/rename-packages.js
```

3. Update package.json files
4. Update all imports
5. Update documentation
6. Run full build to verify

**Note:** This is a large change. Consider:

- Creating a feature branch
- Doing this in smaller batches
- Coordinating with team
- May want to defer until other issues are fixed

### Task 3.2: Add Package Documentation

For each package, create a README.md:

```markdown
# @tnf/[package-name]

[Brief description of what this package does]

## Installation

\`\`\`bash pnpm add @tnf/[package-name] \`\`\`

## Usage

\`\`\`typescript import { something } from '@tnf/[package-name]';

// Example usage \`\`\`

## API

### Function/Class Name

Description

**Parameters:**

- `param1` - Description
- `param2` - Description

**Returns:** Description

## Dependencies

- `@tnf/dependency-1` - Why it's needed
- `@tnf/dependency-2` - Why it's needed

## Development

\`\`\`bash

# Build

pnpm build

# Test

pnpm test

# Dev mode

pnpm dev \`\`\`

## License

MIT
```

### Task 3.3: Add Dependency Validation

Create a validation script:

```javascript
// scripts/validate-packages.js
const fs = require('fs');
const path = require('path');

const requiredFields = [
  'name',
  'version',
  'main',
  'types',
  'scripts.build',
  'scripts.test',
];

function validatePackage(pkgPath) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  const errors = [];

  // Check required fields
  if (!pkg.name) errors.push('Missing "name" field');
  if (!pkg.version) errors.push('Missing "version" field');
  if (!pkg.main && !pkg.exports) errors.push('Missing "main" or "exports"');
  if (!pkg.types) errors.push('Missing "types" field');
  if (!pkg.scripts?.build) errors.push('Missing "build" script');
  if (!pkg.scripts?.test) errors.push('Missing "test" script');

  // Check entry point exists
  if (pkg.main) {
    const mainPath = path.join(path.dirname(pkgPath), 'src', 'index.ts');
    if (!fs.existsSync(mainPath)) {
      errors.push('Missing src/index.ts entry point');
    }
  }

  return errors;
}

// Run validation on all packages
// ... implementation
```

Add to package.json:

```json
{
  "scripts": {
    "validate": "node scripts/validate-packages.js",
    "precommit": "pnpm validate"
  }
}
```

---

## Phase 4: CI/CD & Automation

### Task 4.1: Add GitHub Actions Workflow

Create `.github/workflows/validate.yml`:

```yaml
name: Validate Monorepo

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 10.22.0

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Validate package configurations
        run: pnpm validate

      - name: Type check
        run: pnpm type-check

      - name: Lint
        run: pnpm lint

      - name: Test
        run: pnpm test

      - name: Build
        run: pnpm build
```

### Task 4.2: Add Pre-commit Hooks

Install husky:

```bash
pnpm add -D husky lint-staged
pnpm husky install
```

Create `.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

pnpm validate
pnpm lint-staged
```

Add to package.json:

```json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": ["eslint --fix", "prettier --write"],
    "packages/*/package.json": ["node scripts/validate-package.js"]
  }
}
```

---

## Verification Checklist

After completing all fixes:

- [ ] All packages have valid package.json with required fields
- [ ] All packages build successfully: `pnpm build`
- [ ] All tests pass: `pnpm test`
- [ ] No TypeScript errors: `pnpm type-check`
- [ ] No lint errors: `pnpm lint`
- [ ] All legacy directories archived
- [ ] All incomplete app directories handled
- [ ] Dependency validation script passes
- [ ] CI/CD pipeline passes
- [ ] Documentation updated
- [ ] Team notified of changes

---

## Rollback Plan

If issues occur:

1. **Immediate Rollback:**

   ```bash
   git reset --hard HEAD~1
   pnpm install
   ```

2. **Restore Archived Directories:**

   ```bash
   mv archive/packages/* packages/
   mv archive/apps/* apps/
   ```

3. **Verify:**
   ```bash
   pnpm install
   pnpm build
   ```

---

## Communication Plan

1. **Before starting:**
   - Share this plan with team
   - Get approval for breaking changes
   - Schedule a maintenance window if needed

2. **During fixes:**
   - Work in feature branches
   - Create PRs for each phase
   - Get reviews before merging

3. **After completion:**
   - Update team documentation
   - Share summary of changes
   - Provide migration guide if package names changed

---

## Success Metrics

After all fixes are complete, the monorepo should have:

- ✅ 100% of packages with valid configurations
- ✅ 0 broken internal references
- ✅ 0 circular dependencies
- ✅ 0 legacy directories in main workspace
- ✅ Automated validation in CI/CD
- ✅ Pre-commit hooks preventing bad commits
- ✅ Comprehensive documentation

---

## Timeline

| Phase     | Tasks           | Estimated Time  | Dependencies |
| --------- | --------------- | --------------- | ------------ |
| Phase 1   | Critical fixes  | 4-6 hours       | None         |
| Phase 2   | Important fixes | 8-12 hours      | Phase 1      |
| Phase 3   | Optimization    | 16-24 hours     | Phase 1-2    |
| Phase 4   | Automation      | 4-6 hours       | Phase 1-3    |
| **Total** | **All phases**  | **32-48 hours** | -            |

**Recommended Schedule:**

- Week 1: Phase 1 (Critical)
- Week 2: Phase 2 (Important)
- Week 3-4: Phase 3 (Optimization)
- Week 4: Phase 4 (Automation)

---

## Notes

- All times are estimates for one developer
- Review and testing time not included
- Team coordination time not included
- May be faster with multiple developers working in parallel
- Some tasks (like package renaming) are optional and can be deferred
