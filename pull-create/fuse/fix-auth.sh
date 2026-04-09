#!/bin/bash

# Authentication Fixes Deployment Script
# This script applies all the authentication and authorization fixes

set -e  # Exit on error

echo "========================================="
echo "  The New Fuse - Authentication Fixes"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Stop running services
echo -e "${YELLOW}Step 1: Stopping running services...${NC}"
pnpm run docker:stop || true
sleep 2

# Step 2: Run database migration
echo -e "${YELLOW}Step 2: Running database migration...${NC}"
if [ -f "packages/database/drizzle/0003_fix_master_admin_email.sql" ]; then
    echo "Migration file found. Please ensure PostgreSQL is running, then run:"
    echo "  psql -d your_database_name -f packages/database/drizzle/0003_fix_master_admin_email.sql"
    echo ""
    echo "Or if you have the migration script configured:"
    echo "  pnpm run db:migrate"
    echo ""
    read -p "Press Enter after running the migration..."
else
    echo -e "${RED}ERROR: Migration file not found!${NC}"
    exit 1
fi

# Step 3: Install dependencies (in case any are missing)
echo -e "${YELLOW}Step 3: Installing dependencies...${NC}"
pnpm install

# Step 4: Rebuild backend
echo -e "${YELLOW}Step 4: Rebuilding backend API...${NC}"
cd apps/api
pnpm run build
cd ../..

# Step 5: Rebuild frontend
echo -e "${YELLOW}Step 5: Rebuilding frontend...${NC}"
cd apps/frontend
pnpm run build
cd ../..

# Step 6: Start infrastructure
echo -e "${YELLOW}Step 6: Starting Docker infrastructure...${NC}"
pnpm run docker:start

echo "Waiting for PostgreSQL and Redis to be ready..."
sleep 10

# Step 7: Start all services
echo -e "${YELLOW}Step 7: Starting all services...${NC}"
echo ""
echo -e "${GREEN}All fixes have been applied!${NC}"
echo ""
echo "To start the services, run:"
echo "  pnpm run dev"
echo ""
echo "Then:"
echo "  1. Clear your browser cache and localStorage"
echo "  2. Navigate to http://localhost:3000/login"
echo "  3. Login with owner@example.com"
echo "  4. Test logout button"
echo "  5. Test admin panel access at /admin"
echo ""
echo "========================================="
echo "  Deployment Complete!"
echo "========================================="
