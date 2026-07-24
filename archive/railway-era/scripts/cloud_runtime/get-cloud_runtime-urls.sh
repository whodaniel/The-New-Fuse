#!/bin/bash
# Get CloudRuntime Service URLs
# Run this script to fetch all your CloudRuntime service URLs

echo "🚂 Fetching CloudRuntime Service URLs..."
echo ""
echo "Project ID: 041cee9d-8648-4074-b5a6-0eae436de1d1"
echo ""

# Check if CloudRuntime CLI is installed
if ! command -v cloud_runtime &> /dev/null; then
    echo "❌ CloudRuntime CLI not found. Installing..."
    npm install -g @cloud_runtime/cli
fi

# Login check
echo "Checking CloudRuntime authentication..."
cloud_runtime whoami &> /dev/null || {
    echo "⚠️  Not logged in. Please run: cloud_runtime login"
    exit 1
}

# Link to project if not already linked
if [ ! -f .cloud_runtime/config.json ]; then
    echo "Linking to CloudRuntime project..."
    cloud_runtime link 041cee9d-8648-4074-b5a6-0eae436de1d1
fi

echo ""
echo "📍 Your CloudRuntime Service URLs:"
echo "================================"
echo ""

# Get services and their domains
cloud_runtime service list

echo ""
echo "💡 To get detailed info for a specific service:"
echo "   cloud_runtime service"
echo ""
echo "🔗 View in CloudRuntime Dashboard:"
echo "   https://cloud_runtime.app/project/041cee9d-8648-4074-b5a6-0eae436de1d1"
