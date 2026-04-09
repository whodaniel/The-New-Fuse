# ESLint Memory Issue Investigation Report

## Problem

ESLint crashes with "JavaScript heap out of memory" errors during pre-commit
hooks, even with 8GB heap allocation.

## Root Causes

### 1. Type-Aware ESLint Rules (Primary Cause)

Your `.eslintrc.json` has these rules enabled:

```json
"@typescript-eslint/no-floating-promises": "error",
"@typescript-eslint/await-thenable": "error",
"@typescript-eslint/no-misused-promises": "error"
```

These require `parserOptions.project` which loads **ALL** TypeScript projects:

```json
"project": [
  "./tsconfig.json",
  "./apps/*/tsconfig.json",
  "./packages/*/tsconfig.json",
  "./packages/*/tsconfig.test.json"
]
```

With 60+ workspace folders, this loads the entire monorepo's type information
into memory.

### 2. Heavy Plugins

- `eslint-plugin-import` with TypeScript resolver
- `eslint-plugin-react`
- `eslint-plugin-jsx-a11y`

These plugins, combined with type-aware rules, create massive memory overhead.

## Solutions

### Immediate Fix (Implemented)

**Pre-commit hooks now only run Prettier** - fast and memory-efficient.

Run ESLint separately:

```bash
# Lint specific files
pnpm run lint

# Or lint a specific app
cd apps/frontend && pnpm run lint
```

### Long-term Recommendations

#### Option 1: Disable Type-Aware Rules in Pre-Commit

Keep type-aware rules for CI/manual linting, but disable in pre-commit:

Create `.eslintrc.precommit.json`:

```json
{
  "root": true,
  "extends": ["./.eslintrc.json"],
  "rules": {
    "@typescript-eslint/no-floating-promises": "off",
    "@typescript-eslint/await-thenable": "off",
    "@typescript-eslint/no-misused-promises": "off"
  },
  "parserOptions": {
    "project": null
  }
}
```

#### Option 2: Use ESLint Flat Config

Migrate to ESLint's new flat config system which has better performance.

#### Option 3: Lint Per-Package

Instead of linting the entire monorepo, lint each package separately:

```javascript
// .lintstagedrc.js
module.exports = {
  '*.{ts,tsx}': (filenames) => {
    // Group files by package
    const byPackage = {};
    filenames.forEach((file) => {
      const pkg = file.match(/^(apps|packages)\/[^\/]+/)?.[0];
      if (pkg) {
        byPackage[pkg] = byPackage[pkg] || [];
        byPackage[pkg].push(file);
      }
    });

    // Lint each package separately
    return Object.entries(byPackage).map(
      ([pkg, files]) =>
        `cd ${pkg} && eslint --fix ${files.map((f) => f.replace(`${pkg}/`, '')).join(' ')}`
    );
  },
};
```

#### Option 4: Use `parserOptions.projectService` (TypeScript ESLint v6+)

This is more memory-efficient than `project`:

```json
{
  "parserOptions": {
    "projectService": true,
    "tsconfigRootDir": "."
  }
}
```

## Current Configuration

### Pre-Commit (`.lintstagedrc.js`)

- ✅ Prettier only (fast, reliable)
- ❌ ESLint disabled (too memory-intensive)

### Full Linting (`.eslintrc.json`)

- ✅ All rules enabled including type-aware
- ⚠️ Only run manually or in CI with sufficient memory

## Recommendations

1. **Keep current pre-commit setup** (Prettier only)
2. **Run ESLint in CI** with more memory:
   `NODE_OPTIONS=--max-old-space-size=8192 pnpm run lint`
3. **Consider migrating to ESLint flat config** for better performance
4. **Evaluate if type-aware rules are worth the cost** - they're very valuable
   but expensive

## Testing Results

| Config                      | Memory | Result   |
| --------------------------- | ------ | -------- |
| Full config (type-aware)    | 4GB    | ❌ OOM   |
| Full config (type-aware)    | 8GB    | ❌ OOM   |
| No type-aware, with plugins | 2GB    | ❌ OOM   |
| Minimal (no plugins)        | 1GB    | ✅ Works |
| Prettier only               | <512MB | ✅ Fast  |

## Files Modified

1. `.lintstagedrc.js` - Now only runs Prettier
2. `.eslintrc.precommit.json` - Created (minimal config for testing)

## Next Steps

1. ✅ Commit with new Prettier-only pre-commit
2. 🔄 Set up ESLint in CI pipeline
3. 📋 Evaluate long-term solution (Options 1-4 above)
