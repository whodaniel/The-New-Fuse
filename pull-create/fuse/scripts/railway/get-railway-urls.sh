#!/bin/bash
# Get Railway Service URLs
# Run this script to fetch all your Railway service URLs

echo "🚂 Fetching Railway Service URLs..."
echo ""
echo "Project ID: 041cee9d-8648-4074-b5a6-0eae436de1d1"
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Login check
echo "Checking Railway authentication..."
railway whoami &> /dev/null || {
    echo "⚠️  Not logged in. Please run: railway login"
    exit 1
}

# Link to project if not already linked
if [ ! -f .railway/config.json ]; then
    echo "Linking to Railway project..."
    railway link 041cee9d-8648-4074-b5a6-0eae436de1d1
fi

echo ""
echo "📍 Your Railway Service URLs:"
echo "================================"
echo ""

# Get services and their domains
railway service list

echo ""
echo "💡 To get detailed info for a specific service:"
echo "   railway service"
echo ""
echo "🔗 View in Railway Dashboard:"
echo "   https://railway.app/project/041cee9d-8648-4074-b5a6-0eae436de1d1"
