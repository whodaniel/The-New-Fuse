#!/bin/bash

echo "🚀 Launching All Pages for The New Fuse"
echo "======================================="

# Wait a moment for server to be ready
sleep 2

# React Application Pages
echo "📱 Opening React Application Pages..."
open "http://localhost:3000/" &
sleep 1
open "http://localhost:3000/multi-agent-chat" &
sleep 1
open "http://localhost:3000/dashboard" &
sleep 1
open "http://localhost:3000/components" &
sleep 1
open "http://localhost:3000/timeline-demo" &
sleep 1
open "http://localhost:3000/graph-demo" &
sleep 1
open "http://localhost:3000/workspace/overview" &
sleep 1
open "http://localhost:3000/workspace/settings" &
sleep 1
open "http://localhost:3000/test" &
sleep 1

# Development Tools
echo "🔧 Opening Development Tools..."
open "http://localhost:3000/debug" &
sleep 1
open "http://localhost:3000/build-info" &
sleep 1

# Static HTML Pages (if they exist)
echo "📄 Opening Static HTML Pages..."
open "http://localhost:3000/ui-html-css/index.html" &
sleep 1
open "http://localhost:3000/ui-html-css/pages/login.html" &
sleep 1
open "http://localhost:3000/ui-html-css/pages/dashboard.html" &
sleep 1
open "http://localhost:3000/ui-html-css/pages/chat.html" &
sleep 1
open "http://localhost:3000/ui-html-css/pages/admin.html" &
sleep 1
open "http://localhost:3000/ui-html-css/pages/settings.html" &

echo "✅ All pages launched!"
echo "📋 Pages opened:"
echo "   🏠 Home: http://localhost:3000/"
echo "   🤖 Multi-Agent Chat: http://localhost:3000/multi-agent-chat"
echo "   📊 Dashboard: http://localhost:3000/dashboard"
echo "   🎨 UI Components: http://localhost:3000/components"
echo "   ⏰ Timeline Demo: http://localhost:3000/timeline-demo"
echo "   📈 Graph Demo: http://localhost:3000/graph-demo"
echo "   🏢 Workspace Overview: http://localhost:3000/workspace/overview"
echo "   ⚙️ Settings: http://localhost:3000/workspace/settings"
echo "   🧪 Test Page: http://localhost:3000/test"
echo "   🐛 Debug Info: http://localhost:3000/debug"
echo "   📋 Build Info: http://localhost:3000/build-info"
echo ""
echo "🎉 All React applications and static pages are now accessible!"
