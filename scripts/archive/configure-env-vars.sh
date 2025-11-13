#!/bin/bash
# Configure Environment Variables for Railway Services

set -e

echo "========================================"
echo "Configuring Environment Variables"
echo "========================================"
echo ""

# Store the generated JWT secret
JWT_SECRET="QP3TdsL7K+rBJe2YllN6+p8onci754qaaPnPcvppMW8="

echo "📝 Setting environment variables for API service..."
echo ""

# Set API environment variables
railway variables --service api --set "DATABASE_URL=\${{Postgres.DATABASE_URL}}" 2>&1 || echo "⚠️  DATABASE_URL may already be set or needs manual configuration"
railway variables --service api --set "JWT_SECRET=$JWT_SECRET" 2>&1 || echo "⚠️  JWT_SECRET may already be set"
railway variables --service api --set "NODE_ENV=production" 2>&1 || echo "✓ NODE_ENV already set"
railway variables --service api --set "PORT=3001" 2>&1 || echo "✓ PORT already set"

echo ""
echo "✅ API environment variables configured!"
echo ""
echo "⏳ Waiting for API service to get its URL..."
echo "   (This happens after the first successful build)"
echo ""
echo "Please wait for the API build to complete, then:"
echo "1. Run: railway open --service api"
echo "2. Copy the API URL"
echo "3. Run this script again with the API URL as an argument:"
echo "   ./configure-env-vars.sh <api-url>"
echo ""

# If API URL is provided as argument, configure frontend
if [ ! -z "$1" ]; then
    API_URL="$1"
    echo "📝 Setting environment variables for Frontend service..."
    echo ""

    railway variables --service frontend --set "VITE_API_URL=$API_URL" 2>&1 || echo "⚠️  VITE_API_URL may already be set"
    railway variables --service frontend --set "NODE_ENV=production" 2>&1 || echo "✓ NODE_ENV already set"
    railway variables --service frontend --set "PORT=3000" 2>&1 || echo "✓ PORT already set"

    echo ""
    echo "✅ Frontend environment variables configured!"
    echo ""
    echo "🚀 Deployment configuration complete!"
    echo ""
    echo "Next steps:"
    echo "1. railway open --service frontend (to view your deployed frontend)"
    echo "2. Check logs: railway logs --service api"
    echo "3. Check logs: railway logs --service frontend"
else
    echo "💡 To configure frontend later, run:"
    echo "   ./configure-env-vars.sh <api-url>"
fi

echo ""
echo "========================================"
echo "Configuration Summary"
echo "========================================"
echo ""
echo "API Service Variables:"
echo "  - DATABASE_URL: \${{Postgres.DATABASE_URL}}"
echo "  - JWT_SECRET: $JWT_SECRET"
echo "  - NODE_ENV: production"
echo "  - PORT: 3001"
echo ""
if [ ! -z "$1" ]; then
    echo "Frontend Service Variables:"
    echo "  - VITE_API_URL: $API_URL"
    echo "  - NODE_ENV: production"
    echo "  - PORT: 3000"
fi
echo ""
echo "========================================"
