# The New Fuse v8.0.0 - Installation Guide

## Quick Install (1 Minute)

### Method 1: Command Line (Recommended)

```bash
# Navigate to the extension directory
cd /path/to/the-new-fuse/src/vscode-extension-working

# Install the extension
code --install-extension the-new-fuse-8.0.0.vsix
```

### Method 2: VS Code UI

1. Open Visual Studio Code
2. Click the Extensions icon (Cmd/Ctrl + Shift + X)
3. Click the "..." menu (top-right of Extensions panel)
4. Select "Install from VSIX..."
5. Navigate to and select `the-new-fuse-8.0.0.vsix`
6. Click "Install"
7. Reload VS Code when prompted

---

## Post-Installation Setup (2 Minutes)

### Step 1: Verify Installation

1. Open Extensions panel (Cmd/Ctrl + Shift + X)
2. Search for "The New Fuse"
3. Verify version shows "8.0.0"
4. Extension should show as "Enabled"

### Step 2: Configure LiteLLM (Basic)

**Option A: Quick Setup via Settings UI**
1. Open Settings: `Cmd/Ctrl + ,`
2. Search for: `tnf litellm`
3. Set `Base URL`: Your LiteLLM proxy URL (e.g., `http://localhost:4000`)
4. Set `Model`: Your preferred model (e.g., `gpt-3.5-turbo`)

**Option B: Quick Setup via JSON**
1. Open Command Palette: `Cmd/Ctrl + Shift + P`
2. Type: `Preferences: Open User Settings (JSON)`
3. Add:
```json
{
  "tnf.litellm.baseURL": "http://localhost:4000",
  "tnf.litellm.model": "gpt-3.5-turbo"
}
```

### Step 3: Test Configuration

1. Open Command Palette: `Cmd/Ctrl + Shift + P`
2. Type: `Enhanced LiteLLM Configuration`
3. Click "Test Connection"
4. Should show "Connection successful!" ✅

---

## Production Setup (5 Minutes)

### Recommended Configuration

Add to your VS Code settings:

```json
{
  // Basic
  "tnf.litellm.baseURL": "http://localhost:4000",
  "tnf.litellm.model": "gpt-4",

  // Reliability
  "tnf.litellm.maxRetries": 3,
  "tnf.litellm.fallbackModels": ["gpt-3.5-turbo", "claude-3-haiku"],
  "tnf.litellm.circuitBreakerThreshold": 5,

  // Performance
  "tnf.litellm.enableCache": true,
  "tnf.litellm.cacheType": "memory",

  // Cost Control
  "tnf.litellm.enableBudget": true,
  "tnf.litellm.budgetLimit": 100.00
}
```

### Optional: Redis Caching Setup

If you want to use Redis for caching (recommended for teams):

```json
{
  "tnf.litellm.cacheType": "redis",
  "tnf.litellm.redisHost": "localhost",
  "tnf.litellm.redisPort": 6379,
  "tnf.litellm.cacheTTL": 3600
}
```

**Prerequisites:** Redis server running locally or remotely

---

## Verification Checklist

- [ ] Extension shows version 8.0.0 in Extensions panel
- [ ] Settings search "tnf litellm" shows 20+ configuration options
- [ ] Command Palette shows "Enhanced LiteLLM Configuration" command
- [ ] Configuration panel opens without errors
- [ ] Test connection succeeds (if LiteLLM proxy is running)
- [ ] Activity bar shows "The New Fuse" icon

---

## Troubleshooting

### Issue: Extension doesn't appear in Extensions panel

**Solution:**
1. Restart VS Code completely
2. Try installing again
3. Check VS Code version (requires v1.100.0+)

### Issue: "Command not found" when using `code` command

**Solution:**
1. Open VS Code
2. Open Command Palette: `Cmd/Ctrl + Shift + P`
3. Type: `Shell Command: Install 'code' command in PATH`
4. Try installation again

### Issue: Test Connection fails

**Possible Causes:**
1. LiteLLM proxy not running → Start your proxy
2. Wrong base URL → Check `tnf.litellm.baseURL` setting
3. Network/firewall issue → Check connectivity

### Issue: Settings don't appear

**Solution:**
1. Reload VS Code window: `Cmd/Ctrl + R`
2. Check extension is enabled
3. Try disabling/enabling the extension

---

## Uninstallation (If Needed)

### Remove Extension

```bash
code --uninstall-extension TheNewFuse.the-new-fuse
```

Or via UI:
1. Extensions panel
2. Find "The New Fuse"
3. Click gear icon → Uninstall

### Clean Settings (Optional)

Remove from your `settings.json`:
- All settings starting with `tnf.litellm.*`

---

## Next Steps

1. **Read the Documentation**
   - See [RELEASE_NOTES_v8.0.0.md](./RELEASE_NOTES_v8.0.0.md) for features
   - See [CHANGELOG.md](./CHANGELOG.md) for changes

2. **Explore Examples**
   - Check `/packages/tnf-cli/src/lib/examples/litellm-examples.js`

3. **Start Using**
   - Open the AI Chat view in The New Fuse activity bar
   - Start chatting with your configured LiteLLM provider

---

## Support

**Questions?** See [RELEASE_NOTES_v8.0.0.md](./RELEASE_NOTES_v8.0.0.md) → Support section

**Issues?** Report at GitHub Issues

**Documentation:** See Additional Documentation section in release notes

---

**Congratulations!** 🎉 You're ready to use The New Fuse v8.0.0 with Enhanced LiteLLM Integration!
