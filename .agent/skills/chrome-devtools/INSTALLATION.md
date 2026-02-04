# Chrome DevTools MCP Installation Guide

## For Gemini Antigravity

### Step 1: Locate Your MCP Config File

Your config file is at: `~/.gemini/antigravity/mcp_config.json`

### Step 2: Add Chrome DevTools Server

The server is already added to your config! Here's what's currently in your
file:

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest"]
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    },
    "postgres": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://localhost:5433/tnf_dev"
      ]
    },
    "puppeteer": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
    },
    "browsermcp": {
      "command": "npx",
      "args": ["-y", "@browsermcp/mcp@latest"]
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    }
  }
}
```

### Step 3: Restart Antigravity

1. Quit Antigravity completely
2. Relaunch the application
3. The Chrome DevTools MCP server will automatically connect

### Step 4: Install Browser Extension

1. Open Chrome Web Store
2. Search for "Antigravity Browser Extension"
3. Click "Add to Chrome"
4. Grant necessary permissions

### Step 5: Test Installation

In Antigravity, try:

```markdown
"Use Chrome DevTools to list all open browser pages"
```

If you see a list of pages, it's working! 🎉

---

## For Claude Code

### Step 1: Locate Your MCP Config File

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

**Linux**: `~/.config/Claude/claude_desktop_config.json`

### Step 2: Edit Config File

Add or update the MCP servers section:

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest"]
    }
  }
}
```

### Step 3: Restart Claude

- **Claude Desktop**: Quit and relaunch
- **VS Code Extension**: Reload VS Code window

### Step 4: Test Installation

In Claude Code, try:

```markdown
"Take a screenshot of the current browser page"
```

---

## Verification Checklist

After installation, verify these work:

- [ ] `list_pages` - Lists open browser tabs
- [ ] `take_screenshot` - Captures page screenshot
- [ ] `list_console_messages` - Shows console logs
- [ ] `performance_start_trace` - Starts performance recording

If all work, you're fully set up! ✅

---

## Troubleshooting

### Issue: "MCP server not found"

**Solution**: Check that npx is installed:

```bash
npx --version
# Should show: 10.x.x or higher

# If not installed, install Node.js:
# macOS: brew install node
# Windows: Download from nodejs.org
```

### Issue: "Cannot connect to Chrome"

**Solution**: Ensure Chrome is running and not in incognito mode. The MCP server
needs access to the DevTools protocol.

```bash
# Check if Chrome is running with DevTools enabled:
# You may need to launch Chrome with remote debugging:
chrome --remote-debugging-port=9222
```

### Issue: "Permission denied"

**Solution**: Grant terminal/app permissions:

- macOS: System Preferences → Security & Privacy → Accessibility
- Add Antigravity or Terminal to allowed apps

### Issue: "Server crashes on startup"

**Solution**: Clear npm cache and reinstall:

```bash
npm cache clean --force
npx -y chrome-devtools-mcp@latest --version
```

---

## Advanced Configuration

### Custom Chrome Path

If Chrome is in a non-standard location:

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest"],
      "env": {
        "CHROME_PATH": "/custom/path/to/chrome"
      }
    }
  }
}
```

### Custom DevTools Port

If port 9222 is in use:

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest"],
      "env": {
        "DEVTOOLS_PORT": "9223"
      }
    }
  }
}
```

---

## Next Steps

Once installed:

1. Read [QUICK_START.md](QUICK_START.md) for common commands
2. Try the examples in [README.md](README.md)
3. Explore specific features:
   - [Console Debugging](console-debugger.md)
   - [Performance Monitoring](performance-monitor.md)
   - [Network Analysis](network-analyzer.md)
   - [Browser Automation](browser-automation.md)

---

## Support

For issues:

1. Check
   [Chrome DevTools MCP Issues](https://github.com/ChromeDevTools/chrome-devtools-mcp/issues)
2. Verify Node.js and Chrome are up to date
3. Try restarting both the AI assistant and Chrome

Happy debugging! 🚀
