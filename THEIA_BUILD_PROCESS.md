# Theia IDE Build Process

## Overview

The Theia IDE build process has been optimized to ensure full functionality when The Browser Hub launches. The key requirement is that Theia must be built using **yarn** (not bun) to ensure all dependencies are properly resolved.

## Build Process

### 1. Build Command
```bash
# Primary build command (includes yarn-based Theia build)
bun run build

# Direct optimized Theia build
bun run build:with-optimized-theia
```

### 2. Development Command
```bash
# Primary dev command (ensures Theia is functional before Browser Hub)
bun run dev

# Alternative with explicit Theia functionality check
bun run dev:functional-theia
```

## Build Sequence

### Build Phase (`bun run build`)
1. **Theia Dependencies**: Install with `bun install` in `apps/theia-ide/`
2. **Theia Build**: Execute `bunx @theia/cli@1.59.0 build --mode production`
3. **Verification**: Check for required files:
   - `lib/backend/main.js`
   - `lib/frontend/index.html`
   - `src-gen/backend/main.js`
4. **Build Info**: Create `lib/build-info.json` with build metadata
5. **Other Packages**: Build remaining packages with turbo

### Development Phase (`bun run dev`)
1. **Build Check**: Verify Theia is built and functional
2. **Stage 1**: Start core services (API Gateway, Backend, Frontend)
3. **Stage 2**: Start Theia IDE and wait for full readiness
4. **Stage 3**: Start Browser Hub (after Theia is confirmed functional)

## Verification

### Check Theia Build Status
```bash
bun run verify:theia
```

This will verify:
- ✅ All required files are present
- ✅ Build info is valid
- ✅ Theia is ready for Browser Hub integration

## Key Features

### Optimized Theia Integration
- Theia dependencies installed with `bun install` (following project convention)
- Theia built with `bunx @theia/cli@1.59.0 build --mode production`
- Uses bunx for proper Theia CLI execution while maintaining bun ecosystem

### Staged Development
- Services start in sequence to ensure dependencies are ready
- Theia readiness check before Browser Hub launch
- Prevents cross-origin and functionality issues

### Build Verification
- Automated checks for required build artifacts
- Build info tracking with timestamps and methods
- Fallback strategies if builds fail

## Troubleshooting

### If Theia is not functional in Browser Hub:
1. Run `bun run verify:theia` to check build status
2. If verification fails, run `bun run build:with-optimized-theia`
3. Ensure Theia is responding at `http://localhost:3007` before launching Browser Hub

### Common Issues:
- **Cross-origin restrictions**: Ensure Theia is fully started before Browser Hub
- **Missing files**: Run yarn-based build instead of bun-based build
- **Port conflicts**: Use `node scripts/clear-ports.js` to clear ports

## Files Modified

- `scripts/memory-optimized-build.cjs` - Updated to use yarn for Theia
- `scripts/memory-optimized-dev.cjs` - Added staged startup sequence
- `apps/theia-ide/build-theia.js` - Added yarn build strategy
- `apps/theia-ide/package.json` - Added yarn scripts
- `scripts/build-with-yarn-theia.sh` - Dedicated yarn-based Theia build
- `scripts/dev-with-functional-theia.sh` - Staged development startup
- `scripts/verify-theia-build.js` - Build verification utility

## Result

When you run `bun run build` followed by `bun run dev`, Theia will be:
1. ✅ Fully built using yarn
2. ✅ Completely functional before Browser Hub launches
3. ✅ Ready for embedding without cross-origin issues
4. ✅ Verified as operational at `http://localhost:3007`

The Browser Hub will now launch with a fully functional Theia IDE integrated seamlessly.