# Code Quality Tooling

Complete code quality setup for The New Fuse monorepo.

## Quick Start

### For Developers

1. **Install VSCode Extensions** (recommended when prompted)
2. **Start Coding** - Auto-formatting and linting happen on save
3. **Commit Changes** - Pre-commit hooks ensure quality

### First-Time Setup

```bash
# Install dependencies (if not already done)
pnpm install

# Optional: Format existing codebase
./scripts/format-codebase.sh
```

## Documentation

- **[Complete Guide](../CODE_QUALITY.md)** - Comprehensive documentation
- **[Quick Reference](../CODE_STYLE_QUICK_REFERENCE.md)** - Common patterns and examples
- **[Setup Summary](../../CODE_QUALITY_SETUP_COMPLETE.md)** - What was configured

## Tools Configured

| Tool | Purpose | Config File |
| --- | --- | --- |
| **ESLint** | Linting TypeScript/React/Node | `.eslintrc.json` |
| **Prettier** | Code formatting | `.prettierrc` |
| **lint-staged** | Pre-commit hooks | `.lintstagedrc.js` |
| **Husky** | Git hooks | `.husky/pre-commit` |
| **EditorConfig** | Editor settings | `.editorconfig` |
| **VSCode** | IDE integration | `.vscode/settings.json` |

## Common Commands

```bash
# Lint all code
pnpm run lint

# Auto-fix linting issues
pnpm run lint:fix

# Format all code
pnpm run format:root

# Check formatting
pnpm run format:check:root

# Type check
pnpm run type-check

# Run all quality checks
pnpm run health-check

# Format entire codebase
./scripts/format-codebase.sh
```

## Features

### Auto-Formatting ✅

- **On Save**: Code is formatted automatically
- **On Commit**: Pre-commit hooks ensure quality
- **Import Organization**: Imports sorted automatically
- **Consistent Style**: Prettier enforces uniform formatting

### Code Quality ✅

- **TypeScript Linting**: Catch type errors early
- **React Best Practices**: Enforce hooks rules and patterns
- **Import Management**: Organized, sorted imports
- **Accessibility**: JSX a11y checks
- **Error Prevention**: No floating promises, unused vars, etc.

### Developer Experience ✅

- **Fast Pre-Commit**: Only checks staged files
- **Editor Integration**: Works with VSCode, IntelliJ, etc.
- **Consistent Across Team**: Same rules for everyone
- **Automatic**: Minimal manual intervention needed

## Rules Summary

### TypeScript

- ✅ Consistent type imports (`import type`)
- ✅ No floating promises
- ✅ No unused variables (except `_` prefix)
- ⚠️ `any` allowed but warned
- ✅ Proper error handling

### React

- ✅ Hooks rules enforced
- ✅ Exhaustive dependencies checked
- ✅ No prop-types (use TypeScript)
- ✅ Display names recommended

### Code Style

- ✅ Single quotes
- ✅ Semicolons required
- ✅ 100 character line width
- ✅ 2 space indentation
- ✅ LF line endings
- ✅ Trailing commas (ES5)

### Imports

- ✅ Organized by type (builtin, external, internal, relative)
- ✅ Alphabetically sorted within groups
- ✅ Newlines between groups
- ✅ No duplicates
- ✅ No circular dependencies

## File Structure

```
/home/user/fuse/
├── .eslintrc.json              # ESLint config
├── .prettierrc                 # Prettier config
├── .lintstagedrc.js            # lint-staged config
├── .editorconfig               # EditorConfig
├── .husky/pre-commit           # Git hook
├── .vscode/
│   ├── settings.json           # VSCode settings
│   └── extensions.json         # Recommended extensions
├── docs/
│   ├── CODE_QUALITY.md         # Complete guide
│   ├── CODE_STYLE_QUICK_REFERENCE.md  # Quick ref
│   └── code-quality/
│       └── README.md           # This file
├── scripts/
│   ├── format-codebase.sh      # Format all
│   └── add-lint-scripts.cjs    # Add scripts
└── CODE_QUALITY_SETUP_COMPLETE.md  # Setup summary
```

## VSCode Integration

### What Happens Automatically

When you save a file:

1. **ESLint** fixes issues
2. **Prettier** formats code
3. **Imports** are organized
4. **Types** are checked (background)

### Required Extensions

- ESLint
- Prettier
- EditorConfig

### Optional Extensions

- Tailwind CSS
- Drizzle
- Jest
- TypeScript

## Git Workflow

### Normal Workflow

```bash
# 1. Make changes
vim src/components/Button.tsx

# 2. Stage changes
git add .

# 3. Commit (hooks run automatically)
git commit -m "Add Button component"
# ✓ lint-staged runs
# ✓ ESLint fixes issues
# ✓ Prettier formats code
# ✓ TypeScript checks types

# 4. Push
git push
```

### Emergency Bypass (Use Sparingly)

```bash
git commit --no-verify -m "Emergency fix"
```

## Troubleshooting

### ESLint Not Running

1. Check ESLint extension installed
2. Reload VSCode window
3. Check `.eslintrc.json` exists
4. Check file not in `.eslintignore`

### Prettier Not Formatting

1. Check Prettier extension installed
2. Check `.prettierrc` exists
3. Check file not in `.prettierignore`
4. Set Prettier as default formatter
5. Reload VSCode window

### Hooks Not Working

```bash
# Reinstall hooks
pnpm husky install

# Check hook is executable
chmod +x .husky/pre-commit
```

### Slow Performance

```bash
# Increase Node memory
export NODE_OPTIONS=--max-old-space-size=4096

# Or run on specific directories
pnpm eslint apps/frontend --fix
```

## Best Practices

### Do ✅

- Let VSCode auto-format on save
- Use type inference when possible
- Write self-documenting code
- Handle all promises
- Use meaningful variable names

### Don't ❌

- Bypass git hooks (except emergencies)
- Fight the formatter
- Use `any` without good reason
- Ignore ESLint errors
- Use `console.log` (use proper logging)

## Contributing

### Adding Rules

1. Discuss with team
2. Update `.eslintrc.json`
3. Test on existing code
4. Update documentation
5. Communicate changes

### Disabling Rules

Use sparingly and with comments:

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// Using any here because third-party library has no types
const data: any = untypedLibrary.getData();
```

## Support

### Documentation

- [Complete Guide](../CODE_QUALITY.md)
- [Quick Reference](../CODE_STYLE_QUICK_REFERENCE.md)
- [ESLint Docs](https://eslint.org/docs/latest/)
- [Prettier Docs](https://prettier.io/docs/en/)
- [TypeScript ESLint](https://typescript-eslint.io/)

### Getting Help

1. Check documentation
2. Search existing issues
3. Ask the team
4. Review tool documentation

---

**Last Updated**: 2025-11-18
**Status**: ✅ Complete and Production-Ready
