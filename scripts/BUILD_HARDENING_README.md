# Build Hardening Scripts

This directory contains automated tools to prevent and detect stale TypeScript
build cache issues.

## Scripts

### `audit-clean-scripts.cjs`

**Purpose**: Audits all package.json files and automatically updates clean
scripts to include `tsconfig.tsbuildinfo` removal.

**Usage**:

```bash
node scripts/audit-clean-scripts.cjs
```

**When to use**:

- Monthly audits to ensure compliance
- After adding new packages to the monorepo
- When reviewing build configuration changes

### `add-clean-scripts.cjs`

**Purpose**: One-time utility to add clean scripts to packages that don't have
them.

**Usage**:

```bash
node scripts/add-clean-scripts.cjs
```

**Status**: ✅ Already executed - all packages now have clean scripts

### `validate-build.cjs`

**Purpose**: Validates that all TypeScript packages have proper declaration
files (`.d.ts`) after building.

**Usage**:

```bash
pnpm validate:build
```

**When to use**:

- After major builds
- In CI/CD pipelines
- When debugging type-related issues
- Before deployments

**What it checks**:

- Presence of `.d.ts` files in output directories
- Stale `tsconfig.tsbuildinfo` files
- Build output consistency

### `validate-clean-scripts.cjs`

**Purpose**: Pre-commit validation to ensure package.json files have properly
configured clean scripts.

**Usage**:

```bash
pnpm validate:clean-scripts
```

**When to use**:

- In pre-commit hooks
- Before committing package.json changes
- In CI/CD pull request checks

**What it validates**:

- Packages with `build` scripts must have `clean` scripts
- Clean scripts must include `tsconfig.tsbuildinfo`
- Only checks staged files for efficiency

## Quick Reference

```bash
# Audit all packages (safe to run anytime)
pnpm audit:clean-scripts

# Validate build outputs
pnpm validate:build

# Validate package.json files
pnpm validate:clean-scripts

# Full system health check
pnpm health-check:full
```

## Integration

### Pre-commit Hook (Optional)

Add to `.husky/pre-commit`:

```bash
pnpm validate:clean-scripts
```

### CI/CD Pipeline (Recommended)

```yaml
- name: Validate Clean Scripts
  run: pnpm validate:clean-scripts

- name: Build and Validate
  run: |
    pnpm build
    pnpm validate:build
```

## Documentation

For complete documentation, see:

- `.gemini/BUILD_PROCESS_HARDENING.md` - Complete guide
- `.gemini/BUILD_PROCESS_HARDENING_SUMMARY.md` - Executive summary
- `.gemini/PRISMA_NAMESPACE_EXPORT_FIX.md` - Original issue details

## Maintenance

These scripts are designed to be low-maintenance:

- Run `audit-clean-scripts` monthly
- Update validation logic if build config changes
- Keep documentation in sync with any updates

## Testing

All scripts have been tested on the full monorepo with 61 packages:

- ✅ apps/\* (4 packages)
- ✅ packages/\* (54 packages)
- ✅ tools/\* (3 packages)

## Support

If you encounter issues:

1. Check script output for specific error messages
2. Review `.gemini/BUILD_PROCESS_HARDENING.md`
3. Run `pnpm health-check:full` for diagnostics
