#!/bin/bash

# OpenClaw Railway Deployment Script
# This script helps you deploy the OpenClaw Agent to a sandboxed Railway environment.

set -e

echo "🦞 Starting OpenClaw Railway Deployment..."

# 1. Check for Railway CLI
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Please install it: npm install -g @railway/cli"
    exit 1
fi

# 2. Login if needed
if ! railway status &> /dev/null; then
    echo "🔑 Please log in to Railway..."
    railway login
fi

# 3. Create or link project
echo "📂 Linking to Railway project..."
# We assume the user wants to deploy the current directory (TNF) but focus on OpenClaw
# Note: Railway uses railway.json at the root for service definition.

# 4. Set environment variables
echo "⚙️ Setting environment variables..."
# Generating a random setup password and gateway token for security
SETUP_PASSWORD=$(openssl rand -hex 12)
GATEWAY_TOKEN=$(openssl rand -hex 24)

echo "----------------------------------------------------------"
echo "🔐 SECURITY SECRETS (SAVE THESE!):"
echo "SETUP_PASSWORD: $SETUP_PASSWORD"
echo "OPENCLAW_GATEWAY_TOKEN: $GATEWAY_TOKEN"
echo "----------------------------------------------------------"

# We recommend setting these in the Railway UI for better control, 
# but we can initialize them here if a project is linked.
# railway vars set SETUP_PASSWORD=$SETUP_PASSWORD OPENCLAW_GATEWAY_TOKEN=$GATEWAY_TOKEN

# 5. Instructions for the user
echo ""
echo "🚀 Deployment Ready!"
echo "1. Run 'railway up' to start the deployment."
echo "2. Once finished, find your domain in 'railway status'."
echo "3. Visit https://<your-domain>/setup to complete the configuration."
echo "4. Use your SETUP_PASSWORD to log in."
echo ""
echo "Integration Tip: Update TNF's .env with:"
echo "CLAWD_SANDBOX_URL=wss://<your-domain>"
echo "CLAWD_SANDBOX_TOKEN=$GATEWAY_TOKEN"
