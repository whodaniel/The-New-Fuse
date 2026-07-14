# Webpilot Extension Troubleshooting Guide

## Common Issues and Solutions

### Extension Not Connected Error

When you see "Extension not connected" after running `webpilot start -d`:

#### Root Causes:

1. Extension not installed in the webpilot profile (uses
   ~/h17-webpilot/profile/, not default Chrome profile)
2. Extension installed but disabled
3. Browser binary path mismatch in config
4. Extension needs file:// URL permissions
5. Conflicting browser automation software

#### Diagnostic Steps:

1. Check if Webpilot extension exists: `chrome://extensions`
2. Look for extension in: `~/h17-webpilot/profile/Extensions/` (note: webpilot
   uses its own profile directory)
3. Verify browser path in config: `grep browser ~/h17-webpilot/config.js`
4. Check extension logs: `cat ~/h17-webpilot/webpilot.log`

#### Solutions:

1. **Reinstall extension**:

   ```bash
   rm -rf ~/h17-webpilot/node_modules/h17-webpilot-extension
   webpilot start
   ```

2. **Manual installation** (if auto-install fails):

   ```bash
   npm install -g h17-webpilot-extension
   webpilot start
   ```

3. **Enable extension**:
   - Open `chrome://extensions`
   - Find "Webpilot" and toggle enabled
   - Click "Details" → Enable "Allow access to file URLs"

4. **Reset configuration** (last resort):
   ```bash
   rm ~/h17-webpilot/config.js
   webpilot start  # This will recreate config and reinstall extension
   ```

### Verification

After fixing, verify connection:

```bash
webpilot start -d
webpilot -c ".tabs"  # Should return tab list, not error
```

### Prevention

- Always run `webpilot start -d` at beginning of session
- Keep extension enabled in Chrome (within the webpilot profile)
- Avoid running multiple browser automation tools simultaneously
