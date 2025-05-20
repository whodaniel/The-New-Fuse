#!/bin/bash

# TypeScript ESM Configuration Verification Script
# This script checks if your project is properly configured for TypeScript with ES modules

echo "🔍 Checking TypeScript ESM configuration..."

# Define color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Define project directories
PROJECT_ROOT="$(pwd)"
API_DIR="$PROJECT_ROOT/apps/api"
BACKEND_DIR="$PROJECT_ROOT/apps/backend"

# Function to check configuration
check_config() {
    local directory=$1
    local name=$2
    local pass_count=0
    local total_checks=0
    
    echo -e "\n${YELLOW}Checking $name configuration...${NC}"
    
    # Check for package.json type module
    total_checks=$((total_checks + 1))
    if [ -f "$directory/package.json" ] && grep -q '"type": "module"' "$directory/package.json"; then
        echo -e "${GREEN}✓${NC} package.json has type: module"
        pass_count=$((pass_count + 1))
    else
        echo -e "${RED}✗${NC} package.json should have \"type\": \"module\""
    fi
    
    # Check for nodemon.json with correct config
    total_checks=$((total_checks + 1))
    if [ -f "$directory/nodemon.json" ] && grep -q -- "--loader ts-node/esm" "$directory/nodemon.json"; then
        echo -e "${GREEN}✓${NC} nodemon.json has --loader ts-node/esm"
        pass_count=$((pass_count + 1))
    else
        echo -e "${RED}✗${NC} nodemon.json should include --loader ts-node/esm"
    fi
    
    # Check for tsconfig.node.json
    total_checks=$((total_checks + 1))
    if [ -f "$directory/tsconfig.node.json" ] && grep -q '"esm": true' "$directory/tsconfig.node.json"; then
        echo -e "${GREEN}✓${NC} tsconfig.node.json exists with esm: true"
        pass_count=$((pass_count + 1))
    else
        echo -e "${RED}✗${NC} tsconfig.node.json should exist with ts-node.esm: true"
    fi
    
    # Check for tsconfig.json with NodeNext
    total_checks=$((total_checks + 1))
    if [ -f "$directory/tsconfig.json" ] && grep -q '"module": "NodeNext"' "$directory/tsconfig.json"; then
        echo -e "${GREEN}✓${NC} tsconfig.json has module: NodeNext"
        pass_count=$((pass_count + 1))
    else
        echo -e "${RED}✗${NC} tsconfig.json should have module: NodeNext"
    fi
    
    # Check for dev script
    total_checks=$((total_checks + 1))
    if [ -f "$directory/package.json" ] && grep -q '"dev": "cross-env PORT=.*nodemon"' "$directory/package.json"; then
        echo -e "${GREEN}✓${NC} package.json has simplified dev script with nodemon"
        pass_count=$((pass_count + 1))
    else
        echo -e "${RED}✗${NC} package.json should have dev script with just nodemon"
    fi
    
    # Print summary for this directory
    local percentage=$((pass_count * 100 / total_checks))
    echo -e "\n$name Result: $pass_count/$total_checks checks passed ($percentage%)"
    
    return $pass_count
}

# Check root configuration
root_pass=0
echo -e "\n${YELLOW}Checking root configuration...${NC}"

# Check for tsconfig.node.json in root
if [ -f "$PROJECT_ROOT/tsconfig.node.json" ]; then
    echo -e "${GREEN}✓${NC} Root tsconfig.node.json exists"
    root_pass=$((root_pass + 1))
else
    echo -e "${RED}✗${NC} Root should have tsconfig.node.json"
fi

# Check API and Backend
api_pass=0
backend_pass=0

check_config "$API_DIR" "API"
api_pass=$?

check_config "$BACKEND_DIR" "Backend"
backend_pass=$?

# Calculate overall score
total_score=$((root_pass + api_pass + backend_pass))
max_score=11 # 1 root check + 5 per app
percentage=$((total_score * 100 / max_score))

echo -e "\n${YELLOW}========================================${NC}"
echo -e "${YELLOW}TypeScript ESM Configuration Score: $percentage%${NC}"
echo -e "${YELLOW}========================================${NC}"

if [ $percentage -eq 100 ]; then
    echo -e "\n${GREEN}✅ Perfect! Your project is correctly configured for TypeScript with ES modules.${NC}"
elif [ $percentage -ge 80 ]; then
    echo -e "\n${YELLOW}⚠️  Almost there! Fix the remaining issues to ensure full ESM compatibility.${NC}"
else
    echo -e "\n${RED}❌ Several issues found. Please run the fix-typescript-esm-all.sh script to resolve them.${NC}"
fi

echo -e "\nFor more information, refer to docs/TYPESCRIPT_ESM_CONFIGURATION.md"
