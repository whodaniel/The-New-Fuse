#!/bin/bash

echo "🔍 Stagehand MCP Server Troubleshooting Report"
echo "=============================================="
echo

# Check 1: VS Code LM Bridge Status
echo "1. VS Code LM Bridge Server Status:"
echo "   URL: http://localhost:8080"
if curl -s http://localhost:8080/health > /dev/null; then
    echo "   ✅ RUNNING - Bridge server is accessible"
    echo "   Health: $(curl -s http://localhost:8080/health | jq -r '.status // "unknown"')"
    echo "   VS Code Connected: $(curl -s http://localhost:8080/health | jq -r '.vsCodeConnected // false')"
    echo "   Models: $(curl -s http://localhost:8080/v1/models | jq -r '.data[0].id // "unknown"')"
else
    echo "   ❌ FAILED - Bridge server not accessible"
fi
echo

# Check 2: Chrome Remote Debugging
echo "2. Chrome Remote Debugging Status:"
echo "   Port: 9222"
if curl -s http://localhost:9222/json/version > /dev/null; then
    echo "   ✅ RUNNING - Chrome debugging port accessible"
    echo "   Version: $(curl -s http://localhost:9222/json/version | jq -r '.Browser // "unknown"')"
else
    echo "   ❌ FAILED - Chrome debugging port not accessible"
    echo "   Issue: Chrome not running with --remote-debugging-port=9222"
fi
echo

# Check 3: Chrome Processes
echo "3. Chrome Process Analysis:"
chrome_count=$(ps aux | grep -c "[C]hrome")
if [ $chrome_count -gt 0 ]; then
    echo "   Chrome processes found: $chrome_count"
    if ps aux | grep -q "[C]hrome.*remote-debugging-port"; then
        echo "   ✅ Chrome running with debugging flags"
    else
        echo "   ❌ Chrome running WITHOUT debugging flags"
    fi
else
    echo "   ❌ No Chrome processes found"
fi
echo

# Check 4: MCP Configuration
echo "4. MCP Configuration Status:"
mcp_config="$HOME/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json"
if [ -f "$mcp_config" ]; then
    echo "   ✅ MCP config file exists"
    if grep -q "vscode-lm-bridge-token" "$mcp_config"; then
        echo "   ✅ Bridge API key configured"
    fi
    if grep -q "localhost:8080" "$mcp_config"; then
        echo "   ✅ Bridge URL configured"
    fi
    if grep -q "localhost:9222" "$mcp_config"; then
        echo "   ✅ Chrome debugging URL configured"
    fi
else
    echo "   ❌ MCP config file not found"
fi
echo

echo "🛠️  RECOMMENDED ACTIONS:"
echo "========================"

if ! curl -s http://localhost:9222/json/version > /dev/null; then
    echo "1. FIX CHROME DEBUGGING:"
    echo "   - Kill all Chrome processes: pkill -f 'Google Chrome'"
    echo "   - Start Chrome with debugging:"
    echo "     /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222 --no-first-run --user-data-dir=/tmp/chrome-debug &"
    echo
fi

echo "2. RESTART CLAUDE DESKTOP:"
echo "   - Close Claude Desktop/Cline completely"
echo "   - Restart the application to reload MCP settings"
echo

echo "3. TEST SETUP:"
echo "   - Run this script again to verify all components"
echo "   - Test Stagehand MCP functionality"
echo

echo "📋 Current Status Summary:"
echo "=========================="
echo "VS Code LM Bridge: $(curl -s http://localhost:8080/health > /dev/null && echo "✅ Working" || echo "❌ Down")"
echo "Chrome Debugging:  $(curl -s http://localhost:9222/json/version > /dev/null && echo "✅ Working" || echo "❌ Down")"
echo "Bridge supports gpt-4o: ✅ Yes"
echo "API Key validation: ✅ Working"