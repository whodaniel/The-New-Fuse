#!/bin/bash
# TNF Relay Quick Start

echo "🚀 TNF Relay Quick Start Guide"
echo ""

# Check if installed
if [[ ! -f "src/comprehensive-tnf-relay.js" ]]; then
    echo "❌ TNF Relay not installed. Run ./install.sh first"
    exit 1
fi

# Start in development mode
echo "🔧 Starting TNF Relay in development mode..."
echo ""

# Start all services
npm start &
RELAY_PID=$!

echo "⏳ Waiting for services to start..."
sleep 5

echo ""
echo "✅ TNF Relay is running!"
echo ""
echo "🌐 Access Points:"
echo "   📊 Dashboard: http://localhost:3002"
echo "   🔌 HTTP API: http://localhost:3000/status"
echo "   💬 WebSocket: ws://localhost:3001"
echo "   🔄 Proxy: Configure apps to use localhost:8888"
echo ""
echo "🔧 Quick Setup Commands:"
echo "   Claude Code: source ~/.tnf-claude-env"
echo "   VS Code: ./scripts/setup-vscode.sh"
echo "   System: ./scripts/system-proxy.sh enable"
echo ""
echo "🛑 To stop: kill $RELAY_PID"

# Keep script running
wait $RELAY_PID
