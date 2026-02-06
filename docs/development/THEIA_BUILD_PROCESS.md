# SkIDEancer IDE Build Process

## Overview

The SkIDEancer IDE build process has been optimized to ensure full functionality
when The Browser Hub launches. The key requirement is that SkIDEancer must be
built using **yarn** (not bun) to ensure all dependencies are properly resolved.

## Build Process

### 1. Build Command

```bash
# Primary build command (includes yarn-based SkIDEancer build)
pnpm run build

# Direct optimized SkIDEancer build
pnpm run build:with-optimized-ide
```

### 2. Development Command

```bash
# Primary dev command (ensures SkIDEancer is functional before Browser Hub)
pnpm run dev

# Alternative with explicit SkIDEancer functionality check
pnpm run dev:functional-ide
```

## Build Sequence

### Build Phase (`pnpm run build`)

1. **SkIDEancer Dependencies**: Install with `pnpm install` in `apps/ide-ide/`
2. **SkIDEancer Build**: Execute
   `pnpm dlx @ide/cli@1.59.0 build --mode production`
3. **Verification**: Check for required files:
   - `lib/backend/main.js`
   - `lib/frontend/index.html`
   - `src-gen/backend/main.js`
4. **Build Info**: Create `lib/build-info.json` with build metadata
5. **Other Packages**: Build remaining packages with turbo

### Development Phase (`pnpm run dev`)

1. **Build Check**: Verify SkIDEancer is built and functional
2. **Stage 1**: Start core services (API Gateway, Backend, Frontend)
3. **Stage 2**: Start SkIDEancer IDE and wait for full readiness
4. **Stage 3**: Start Browser Hub (after SkIDEancer is confirmed functional)

## Verification

### Check SkIDEancer Build Status

```bash
pnpm run verify:ide
```

This will verify:

- ✅ All required files are present
- ✅ Build info is valid
- ✅ SkIDEancer is ready for Browser Hub integration

## Key Features

### Optimized SkIDEancer Integration

- SkIDEancer dependencies installed with `pnpm install` (following project
  convention)
- SkIDEancer built with `pnpm dlx @ide/cli@1.59.0 build --mode production`
- Uses pnpm dlx for proper SkIDEancer CLI execution while maintaining bun
  ecosystem

### Staged Development

- Services start in sequence to ensure dependencies are ready
- SkIDEancer readiness check before Browser Hub launch
- Prevents cross-origin and functionality issues

### Build Verification

- Automated checks for required build artifacts
- Build info tracking with timestamps and methods
- Fallback strategies if builds fail

## Troubleshooting

### If SkIDEancer is not functional in Browser Hub:

1. Run `pnpm run verify:ide` to check build status
2. If verification fails, run `pnpm run build:with-optimized-ide`
3. Ensure SkIDEancer is responding at `http://localhost:3007` before launching
   Browser Hub

### Common Issues:

- **Cross-origin restrictions**: Ensure SkIDEancer is fully started before
  Browser Hub
- **Missing files**: Run yarn-based build instead of bun-based build
- **Port conflicts**: Use `node scripts/clear-ports.js` to clear ports

## Files Modified

- `scripts/memory-optimized-build.cjs` - Updated to use yarn for SkIDEancer
- `scripts/memory-optimized-dev.cjs` - Added staged startup sequence
- `apps/ide-ide/build-ide.js` - Added yarn build strategy
- `apps/ide-ide/package.json` - Added yarn scripts
- `scripts/build-with-yarn-ide.sh` - Dedicated yarn-based SkIDEancer build
- `scripts/dev-with-functional-ide.sh` - Staged development startup
- `scripts/verify-ide-build.js` - Build verification utility

## Result

When you run `pnpm run build` followed by `pnpm run dev`, SkIDEancer will be:

1. ✅ Fully built using yarn
2. ✅ Completely functional before Browser Hub launches
3. ✅ Ready for embedding without cross-origin issues
4. ✅ Verified as operational at `http://localhost:3007`

The Browser Hub will now launch with a fully functional SkIDEancer IDE
integrated seamlessly.
