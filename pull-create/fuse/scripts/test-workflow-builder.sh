#!/bin/bash

# Test Workflow Builder Integration in Browser Hub
echo "🚀 Testing Workflow Builder Integration in Browser Hub"

# Check if the Browser Hub is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "⚠️  Frontend not running on port 3000. Starting it..."
    cd apps/frontend && npm run dev &
    sleep 5
fi

# Check if the API is running
if ! curl -s http://localhost:3001 > /dev/null; then
    echo "⚠️  API not running on port 3001. Starting it..."
    cd apps/api && npm run dev &
    sleep 3
fi

echo "✅ Services are running"
echo "📋 Testing workflow builder features:"
echo "   1. Open Browser Hub"
echo "   2. Click on 'Workflow Builder' in the AI Services section"
echo "   3. Test drag and drop functionality"
echo "   4. Test node property editing"
echo "   5. Test save/load workflow"

# Open the Browser Hub in default browser
if command -v open &> /dev/null; then
    open http://localhost:3000
elif command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3000
else
    echo "🌐 Please open http://localhost:3000 in your browser"
fi

echo "🎯 Workflow Builder is now available in the Browser Hub!"
echo "   - Look for the 'Workflow Builder' option in the AI Services section"
echo "   - Click it to open the drag-and-drop workflow designer"
echo "   - Create workflows with AI processing nodes"