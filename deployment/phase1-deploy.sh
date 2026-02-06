#!/bin/bash

# The New Fuse - Phase 1 Deployment Script
# Deploys to Vercel (Frontend) and Railway (Backend)

set -e

echo "🚀 Starting Phase 1 Deployment for The New Fuse Platform"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check prerequisites
check_prerequisites() {
    echo -e "${BLUE}📋 Checking prerequisites...${NC}"
    
    # Check if bun is installed
    if ! command -v bun &> /dev/null; then
        echo -e "${RED}❌ Bun is not installed. Please install Bun first.${NC}"
        exit 1
    fi
    
    # Check if vercel CLI is available
    if ! command -v vercel &> /dev/null; then
        echo -e "${YELLOW}⚠️  Vercel CLI not found. Installing...${NC}"
        npm install -g vercel
    fi
    
    # Check if railway CLI is available
    if ! command -v railway &> /dev/null; then
        echo -e "${YELLOW}⚠️  Railway CLI not found. Installing...${NC}"
        npm install -g @railway/cli
    fi
    
    # Check if .env.production exists
    if [ ! -f ".env.production" ]; then
        echo -e "${RED}❌ .env.production file not found. Please create it from .env.example${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Prerequisites check passed${NC}"
}

# Validate monorepo structure
validate_monorepo() {
    echo -e "${BLUE}🔍 Validating monorepo structure...${NC}"
    
    # Check turbo.json exists
    if [ ! -f "turbo.json" ]; then
        echo -e "${RED}❌ turbo.json not found${NC}"
        exit 1
    fi
    
    # Check key packages exist
    required_packages=("apps/frontend" "apps/api" "packages/mcp-core" "packages/sync-core")
    for package in "${required_packages[@]}"; do
        if [ ! -d "$package" ]; then
            echo -e "${RED}❌ Required package not found: $package${NC}"
            exit 1
        fi
    done
    
    echo -e "${GREEN}✅ Monorepo structure validated${NC}"
}

# Build and test locally
build_and_test() {
    echo -e "${BLUE}🔨 Building and testing locally...${NC}"
    
    # Install dependencies
    echo "Installing dependencies..."
    pnpm install --frozen-lockfile
    
    # Generate Drizzle client
    echo "Generating Drizzle client..."
    pnpm run db:generate
    
    # Build packages
    echo "Building packages..."
    pnpm run build:packages
    
    # Build apps
    echo "Building applications..."
    pnpm run build:apps
    
    # Run tests
    echo "Running tests..."
    pnpm run test:unit
    
    echo -e "${GREEN}✅ Local build and test completed${NC}"
}

# Deploy to Railway
deploy_railway() {
    echo -e "${BLUE}🚂 Deploying backend services to Railway...${NC}"
    
    # Check if logged in to Railway
    if ! railway whoami &> /dev/null; then
        echo -e "${YELLOW}🔐 Please login to Railway:${NC}"
        railway login
    fi
    
    # Deploy services
    echo "Deploying to Railway..."
    railway up --detach
    
    # Wait for deployment
    echo "Waiting for Railway deployment to complete..."
    sleep 30
    
    # Get service URLs
    echo "Getting service URLs..."
    railway status
    
    echo -e "${GREEN}✅ Railway deployment completed${NC}"
}

# Deploy to Vercel
deploy_vercel() {
    echo -e "${BLUE}▲ Deploying frontend to Vercel...${NC}"
    
    # Check if logged in to Vercel
    if ! vercel whoami &> /dev/null; then
        echo -e "${YELLOW}🔐 Please login to Vercel:${NC}"
        vercel login
    fi
    
    # Deploy to production
    echo "Deploying to Vercel..."
    vercel --prod --yes
    
    echo -e "${GREEN}✅ Vercel deployment completed${NC}"
}

# Verify deployment
verify_deployment() {
    echo -e "${BLUE}🔍 Verifying deployment...${NC}"
    
    # Get Railway URLs (this would need to be customized based on actual Railway output)
    echo "Please verify the following endpoints are working:"
    echo "- Frontend: Check Vercel deployment URL"
    echo "- API Health: https://your-railway-api-url.railway.app/health"
    echo "- A2A Health: https://your-railway-a2a-url.railway.app/health"
    echo "- Sync Health: https://your-railway-sync-url.railway.app/health/sync"
    echo "- MCP Health: https://your-railway-mcp-url.railway.app/health/mcp"
    
    echo -e "${YELLOW}⚠️  Please update your Vercel environment variables with the actual Railway URLs${NC}"
    echo -e "${GREEN}✅ Deployment verification guide displayed${NC}"
}

# Main deployment flow
main() {
    echo -e "${GREEN}🎯 The New Fuse - Phase 1 Deployment${NC}"
    echo "This script will deploy:"
    echo "- Frontend to Vercel"
    echo "- Backend services to Railway"
    echo ""
    
    read -p "Continue with deployment? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled."
        exit 0
    fi
    
    check_prerequisites
    validate_monorepo
    build_and_test
    deploy_railway
    deploy_vercel
    verify_deployment
    
    echo ""
    echo -e "${GREEN}🎉 Phase 1 deployment completed successfully!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Update Vercel environment variables with Railway URLs"
    echo "2. Test all service endpoints"
    echo "3. Monitor performance and costs"
    echo "4. Prepare for Phase 2 optimization"
}

# Run main function
main "$@"