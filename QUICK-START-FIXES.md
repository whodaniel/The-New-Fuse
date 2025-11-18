# Quick Start: Fixing Monorepo Issues

This guide provides the fastest way to fix the critical issues identified in the monorepo audit.

## TL;DR - Run These Commands

```bash
# 1. Make the fix script executable
chmod +x scripts/fix-package-exports.js

# 2. Preview what will be fixed (dry run)
node scripts/fix-package-exports.js --dry-run

# 3. Apply the fixes
node scripts/fix-package-exports.js

# 4. Clean up legacy directories
mkdir -p archive/{apps,packages}
mv apps/{client,extension,mcp-servers,relay-server} archive/apps/ 2>/dev/null || true

# Move legacy package directories
for dir in @the-new-fuse agent-protocol-bridge api-gateway cache cli commands-core \
           communication config core-auth crypto-agent-framework debugging docs \
           frontend integration-core job-queue messaging shared-ui tnf-cli tnf-core \
           unified-discovery unified-orchestration web websocket; do
  [ -d "packages/$dir" ] && [ ! -f "packages/$dir/package.json" ] && \
    mv "packages/$dir" archive/packages/ 2>/dev/null || true
done

# 5. Install dependencies
pnpm install

# 6. Verify everything builds
pnpm build

# 7. Run tests
pnpm test

# 8. Type check
pnpm type-check

# 9. Commit changes
git add -A
git commit -m "fix: resolve monorepo configuration issues

- Added missing export configurations to 8 packages
- Archived 23 legacy package directories
- Archived 4 incomplete app directories
- All packages now have proper build scripts
- All internal dependencies verified"
```

## What These Commands Do

### Step 1-3: Fix Package Configurations
The `fix-package-exports.js` script automatically:
- Adds missing `main`, `types`, and `exports` fields
- Adds build and test scripts
- Creates `src/index.ts` if missing
- Creates `tsconfig.json` if missing

**Affected packages:**
- `@the-new-fuse/backend`
- `@the-new-fuse/client`
- `@the-new-fuse/common`
- `@the-new-fuse/contracts`
- `features`
- `integrations`
- `layout`
- `monitoring`

### Step 4: Archive Legacy Directories
Moves 27 incomplete/legacy directories to `archive/` for safekeeping:
- 4 incomplete app directories
- 23 package directories without package.json

### Step 5-8: Verify
Ensures everything still works:
- Dependencies install correctly
- All packages build successfully
- Tests pass
- No TypeScript errors

### Step 9: Commit
Saves your changes with a descriptive commit message.

---

## Manual Verification Steps

After running the automated fixes, verify:

### 1. Check Package Exports

For each fixed package, verify it can be imported:

```typescript
// In another package or app
import { something } from '@the-new-fuse/backend';
```

### 2. Verify Build Order

```bash
# Build should complete without errors
pnpm build

# Check for specific package builds
pnpm build --filter=@the-new-fuse/backend
```

### 3. Check for Broken References

```bash
# Run the analysis again
node analyze-monorepo.js
```

Should show:
- ✅ 0 broken references
- ✅ 0 circular dependencies
- ✅ All packages with proper configurations

---

## If Something Goes Wrong

### Rollback Changes

```bash
# Undo all changes
git reset --hard HEAD

# Restore archived directories if needed
mv archive/apps/* apps/ 2>/dev/null || true
mv archive/packages/* packages/ 2>/dev/null || true
```

### Fix Individual Package

```bash
# Fix only one package
node scripts/fix-package-exports.js --package=backend --dry-run
node scripts/fix-package-exports.js --package=backend
```

### Check What Changed

```bash
# See all changes
git diff

# See changes to specific file
git diff packages/backend/package.json
```

---

## Common Issues & Solutions

### Issue: Package still can't be imported

**Solution:** Check that the package has a valid `src/index.ts`:

```bash
# Check if file exists
ls packages/[package-name]/src/index.ts

# If not, create it
mkdir -p packages/[package-name]/src
echo "export {};" > packages/[package-name]/src/index.ts
```

### Issue: Build fails for a package

**Solution:** Check TypeScript configuration:

```bash
# Verify tsconfig.json exists
cat packages/[package-name]/tsconfig.json

# Try building just that package
cd packages/[package-name]
pnpm build
```

### Issue: Circular dependency error

**Solution:** This shouldn't happen (audit found none), but if it does:

```bash
# Check for circular dependencies
pnpm dlx madge --circular packages/[package-name]/src

# Fix by restructuring dependencies
```

---

## Next Steps After Fixes

### 1. Update Documentation

For each fixed package, add a README.md:

```bash
cat > packages/[package-name]/README.md << 'EOF'
# @the-new-fuse/[package-name]

[Description]

## Usage

\`\`\`typescript
import { ... } from '@the-new-fuse/[package-name]';
\`\`\`

## Development

\`\`\`bash
pnpm build
pnpm test
\`\`\`
EOF
```

### 2. Add Pre-commit Validation

```bash
# Install husky
pnpm add -D husky

# Initialize
pnpm husky install

# Add pre-commit hook
cat > .husky/pre-commit << 'EOF'
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

node scripts/validate-monorepo.js
EOF

chmod +x .husky/pre-commit
```

### 3. Set Up CI/CD

Copy the GitHub Actions workflow from `fix-plan.md` to `.github/workflows/validate.yml`

---

## Verification Checklist

After running all fixes, verify:

- [ ] `node analyze-monorepo.js` shows 0 issues
- [ ] `pnpm build` completes successfully
- [ ] `pnpm test` passes (or shows expected failures)
- [ ] `pnpm type-check` shows no errors
- [ ] All archived directories are in `archive/`
- [ ] Git status shows expected changes
- [ ] All fixed packages have:
  - [ ] Valid package.json with exports
  - [ ] src/index.ts entry point
  - [ ] tsconfig.json
  - [ ] Build script
  - [ ] Test script

---

## Time Estimate

- **Automated fixes:** 5 minutes
- **Manual verification:** 10-15 minutes
- **Testing:** 10-15 minutes
- **Documentation:** 15-20 minutes (optional)

**Total:** 30-45 minutes for critical fixes

---

## Questions?

1. Check `monorepo-audit-report.md` for detailed analysis
2. Check `fix-plan.md` for comprehensive fix instructions
3. Run `node analyze-monorepo.js` to see current status
4. Review git changes: `git diff`

---

## Success Criteria

After completion, you should have:

✅ All packages with valid export configurations
✅ All packages buildable
✅ No broken internal references
✅ No circular dependencies
✅ Clean workspace (no legacy directories)
✅ All changes committed to git
✅ CI/CD ready to be set up

---

## Archive Contents

After archival, `archive/` will contain:

```
archive/
├── apps/
│   ├── client/
│   ├── extension/
│   ├── mcp-servers/
│   └── relay-server/
├── packages/
│   ├── @the-new-fuse/
│   ├── agent-protocol-bridge/
│   ├── api-gateway/
│   ├── cache/
│   ├── cli/
│   ├── commands-core/
│   ├── communication/
│   ├── config/
│   ├── core-auth/
│   ├── crypto-agent-framework/
│   ├── debugging/
│   ├── docs/
│   ├── frontend/
│   ├── integration-core/
│   ├── job-queue/
│   ├── messaging/
│   ├── shared-ui/
│   ├── tnf-cli/
│   ├── tnf-core/
│   ├── unified-discovery/
│   ├── unified-orchestration/
│   ├── web/
│   └── websocket/
└── README.md
```

These can be restored if needed, but are removed from the active workspace to reduce clutter.
