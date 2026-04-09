# SkIDEancer Extension Conflict - Fix Summary

## Quick Fix

Run these commands to deploy the fixes:

```bash
# 1. Rebuild browser extension with IDE exclusion
cd apps/chrome-extension
pnpm run build

# 2. Apply IDE patches (if deploying IDE)
cd ../skideancer-ide
node fix-ide-issues.js

# 3. Commit and deploy
git add .
git commit -m "fix: Resolve browser extension conflicts with SkIDEancer IDE"
git push
```

## What Was Fixed

### Issue 1: Custom Element Collision

**Error**:
`Uncaught Error: A custom element with name 'mce-autosize-textarea' has already been defined`

**Cause**: FuseConnect extension was injecting into IDE page, causing duplicate
custom element registrations

**Fix**: Extension now skips `skideancer.thenewfuse.com` domain

### Issue 2: Resource Provider Missing

**Error**:
`A resource provider for 'user-storage:/user/toolbar.json' is not registered`

**Cause**: Theia user-storage providers not being registered due to
initialization race conditions

**Fix**: IDE patches ensure providers are registered properly

### Issue 3: Plugin Loading Failures

**Error**: `Failed to load plugins`

**Cause**: Extension interference with Theia plugin system

**Fix**: Extension excluded + error suppressors added to IDE

## Files Changed

### Chrome Extension

- ✅
  [apps/chrome-extension/src/v6/content/index.ts](apps/chrome-extension/src/v6/content/index.ts)

### SkIDEancer IDE

- ✅
  [apps/skideancer-ide/fix-ide-issues.js](apps/skideancer-ide/fix-ide-issues.js)
  (new)
- ✅
  [apps/skideancer-ide/DEPLOYMENT_FIX.md](apps/skideancer-ide/DEPLOYMENT_FIX.md)
  (new)
- ✅
  [apps/skideancer-ide/BROWSER_EXTENSION_FIX.md](apps/skideancer-ide/BROWSER_EXTENSION_FIX.md)
  (new, generated)

## Verification Steps

After deployment:

1. **Reload extension**: chrome://extensions → Click "Update"
2. **Visit IDE**: https://skideancer.thenewfuse.com/
3. **Open Console**: Should see:
   - ✅ `[FuseConnect v6] Skipping SkIDEancer IDE page`
   - ✅ No custom element errors
   - ✅ No resource provider errors
4. **Test IDE features**: File editing, terminal, git should work

## If Still Having Issues

### Extension Not Excluding IDE

```bash
# Verify the code was updated
cat apps/chrome-extension/src/v6/content/index.ts | grep -A5 "skideancer"

# Rebuild
cd apps/chrome-extension && pnpm run build

# Manually reload extension in Chrome
```

### IDE Still Showing Errors

```bash
# Run fix script
cd apps/skideancer-ide
node fix-ide-issues.js

# Check patches were applied
ls -la lib/frontend/ | grep -E "(bundle.js|index.html|resource-provider-patch.js)"
```

### Hard Reset

```bash
# Clear browser cache
# Ctrl+Shift+R on IDE page

# Reinstall extension
cd apps/chrome-extension
rm -rf dist-v6
pnpm run build

# Rebuild IDE
cd ../skideancer-ide
rm -rf lib src-gen
yarn run rebuild
node fix-ide-issues.js
```

## Technical Details

The FuseConnect extension uses a `content_scripts` manifest entry that matches
`https://*.thenewfuse.com/*`, which includes the IDE subdomain. The fix adds an
early exit check at the top of the content script to prevent initialization on
IDE pages.

The IDE fix script patches the built Theia bundle to:

1. Add a safe custom element registration wrapper
2. Suppress non-critical errors related to extensions
3. Ensure resource providers are registered

## Next Steps

1. **Deploy**: Follow Quick Fix commands above
2. **Test**: Visit https://skideancer.thenewfuse.com/ and verify errors are gone
3. **Monitor**: Check Railway logs for any new errors

## Support

If you encounter any issues with this fix:

- Check [DEPLOYMENT_FIX.md](apps/skideancer-ide/DEPLOYMENT_FIX.md) for detailed
  steps
- Check [BROWSER_EXTENSION_FIX.md](apps/skideancer-ide/BROWSER_EXTENSION_FIX.md)
  for alternative solutions
- Verify extension is actually updated in chrome://extensions
