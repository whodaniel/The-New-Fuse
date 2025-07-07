#!/bin/bash
# TNF Relay Quick Start Script

echo "🚀 Starting TNF Relay Complete System..."

# Check if we're in the right directory
if [[ ! -f "comprehensive-tnf-relay.js" ]]; then
    echo "❌ Error: comprehensive-tnf-relay.js not found"
    echo "Please run this script from the TNF directory"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [[ ! -d "node_modules" ]]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo ""
echo "🎯 TNF Relay Quick Setup Complete!"
echo ""
echo "🔧 Available Commands:"
echo "   npm start              # Start the complete relay system"
echo "   npm run status         # Check system status"
echo ""
echo "🌐 After starting, access:"
echo "   📊 Dashboard: http://localhost:3002"
echo "   🔌 HTTP API: http://localhost:3000/status"
echo "   💬 WebSocket: ws://localhost:3001"
echo "   🔄 Proxy: Configure apps to use localhost:8888"
echo ""
echo "⚡ Quick Test:"
echo "   1. Run: npm start"
echo "   2. Open: http://localhost:3002"
echo "   3. Click 'Setup Claude Code' in dashboard"
echo "   4. Restart terminal and use 'claude' command"
echo ""
echo "🎉 Ready to intercept AI API calls!"