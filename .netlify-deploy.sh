#!/bin/bash
# Automated Netlify deployment script

echo "🚀 Starting automated Netlify deployment..."

# Check if logged in
if ! netlify status 2>/dev/null | grep -q "Logged in"; then
    echo "❌ Not logged in to Netlify. Please run: netlify login"
    echo "Opening login page..."
    netlify login
    exit 1
fi

# Deploy the site
echo "📦 Deploying to Netlify..."
netlify deploy \
    --prod \
    --dir=apps/frontend/dist \
    --functions=netlify/functions \
    --message="Automated deployment from CLI"

echo "✅ Deployment complete!"
