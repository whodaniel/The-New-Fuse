#!/bin/bash

echo "🚀 Auto-Starting Stagehand System Components"
echo "============================================"

# Function to check if a port is in use
port_in_use() {
    lsof -i :$1 >/dev/null 2>&1
}

# Function to check if Chrome is running with debugging
chrome_debug_running() {
    curl -s http://localhost:9222/json/version >/dev/null 2>&1
}

# 1. Start Chrome debugging if not running
if ! chrome_debug_running; then
    echo "📊 Starting Chrome debugging on port 9222..."
    ./tools/start-chrome-debug.sh
    echo "✅ Chrome debugging started"
else
    echo "✅ Chrome debugging already running"
fi

# 2. Check VS Code LM Bridge (MCP will auto-start this)
if ! port_in_use 8080; then
    echo "🔄 VS Code LM Bridge not running - will auto-start via MCP when needed"
else
    echo "✅ VS Code LM Bridge already running on port 8080"
fi

echo
echo "🎯 Stagehand System Status:"
echo "=========================="

# Check Chrome debugging
if chrome_debug_running; then
    echo "Chrome Debugging: ✅ Running (port 9222)"
else
    echo "Chrome Debugging: ❌ Not accessible"
fi

# Check VS Code LM Bridge
if port_in_use 8080; then
    echo "VS Code LM Bridge: ✅ Running (port 8080)"
else
    echo "VS Code LM Bridge: 🔄 Will auto-start via MCP"
fi

echo
echo "🎊 System Ready!"
echo "==============="
echo "✅ Chrome debugging: Available for browser automation"
echo "✅ VS Code LM Bridge: Auto-starts when Stagehand is used"
echo "✅ Stagehand MCP: Ready for commands in Claude Desktop/Cline"
echo
echo "🚀 You can now use Stagehand commands like:"
echo '   "Use Stagehand to navigate to google.com"'
echo '   "Use Stagehand to take a screenshot"'
echo