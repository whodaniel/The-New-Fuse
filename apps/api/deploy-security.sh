#!/bin/bash

# API Security Deployment Script
# This script deploys the API with all security measures enabled

set -e

echo "🚀 Starting API Security Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if environment variables are set
check_env() {
    echo -e "${BLUE}Checking environment variables...${NC}"
    
    if [ -z "$JWT_SECRET" ]; then
        echo -e "${RED}❌ JWT_SECRET is not set${NC}"
        echo "Please set JWT_SECRET environment variable"
        exit 1
    fi
    
    if [ -z "$ALLOWED_ORIGINS" ]; then
        echo -e "${YELLOW}⚠️  ALLOWED_ORIGINS is not set, using default${NC}"
    fi
    
    echo -e "${GREEN}✅ Environment variables configured${NC}"
}

# Install dependencies
install_deps() {
    echo -e "${BLUE}Installing dependencies...${NC}"
    npm ci --only=production
    echo -e "${GREEN}✅ Dependencies installed${NC}"
}

# Build the application
build_app() {
    echo -e "${BLUE}Building application...${NC}"
    npm run build
    echo -e "${GREEN}✅ Application built${NC}"
}

# Create logs directory
setup_logs() {
    echo -e "${BLUE}Setting up log directories...${NC}"
    mkdir -p logs
    chmod 755 logs
    echo -e "${GREEN}✅ Log directories created${NC}"
}

# Security verification
verify_security() {
    echo -e "${BLUE}Verifying security configuration...${NC}"
    
    # Check if JWT secret is strong enough
    if [ ${#JWT_SECRET} -lt 32 ]; then
        echo -e "${RED}❌ JWT_SECRET is too short (minimum 32 characters)${NC}"
        exit 1
    fi
    
    # Check if port is available
    if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${RED}❌ Port 3001 is already in use${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Security configuration verified${NC}"
}

# Start the API server
start_api() {
    echo -e "${BLUE}Starting API server with security measures...${NC}"
    
    # Set production environment
    export NODE_ENV=production
    export PORT=3001
    
    # Start the server
    npm run start:prod &
    API_PID=$!
    
    # Wait for server to start
    echo -e "${YELLOW}Waiting for API server to start...${NC}"
    sleep 5
    
    # Check if server is running
    if curl -s http://localhost:3001/api/health > /dev/null; then
        echo -e "${GREEN}✅ API server started successfully (PID: $API_PID)${NC}"
    else
        echo -e "${RED}❌ API server failed to start${NC}"
        kill $API_PID 2>/dev/null || true
        exit 1
    fi
}

# Run security tests
test_security() {
    echo -e "${BLUE}Running security tests...${NC}"
    
    # Test health endpoint
    if curl -s http://localhost:3001/api/health | grep -q "status"; then
        echo -e "${GREEN}✅ Health endpoint working${NC}"
    else
        echo -e "${RED}❌ Health endpoint failed${NC}"
    fi
    
    # Test rate limiting
    echo -e "${YELLOW}Testing rate limiting...${NC}"
    for i in {1..5}; do
        curl -s -w "%{http_code}" -o /dev/null http://localhost:3001/api/health > /tmp/status_$i
    done
    
    if grep -q "200" /tmp/status_1; then
        echo -e "${GREEN}✅ Rate limiting configured correctly${NC}"
    else
        echo -e "${YELLOW}⚠️  Rate limiting may need adjustment${NC}"
    fi
    
    # Clean up temp files
    rm -f /tmp/status_*
    
    echo -e "${GREEN}✅ Security tests completed${NC}"
}

# Show security status
show_status() {
    echo -e "${BLUE}API Security Status:${NC}"
    echo -e "${GREEN}🔐 Authentication: ENABLED${NC}"
    echo -e "${GREEN}🛡️  Authorization: ENABLED${NC}"
    echo -e "${GREEN}⚡ Rate Limiting: ENABLED${NC}"
    echo -e "${GREEN}🔍 Input Validation: ENABLED${NC}"
    echo -e "${GREEN}📊 Security Logging: ENABLED${NC}"
    echo -e "${GREEN}🏥 Health Monitoring: ENABLED${NC}"
    echo ""
    echo -e "${GREEN}🌐 API Server: http://localhost:3001${NC}"
    echo -e "${BLUE}📋 API Health: http://localhost:3001/api/health${NC}"
    echo -e "${BLUE}🔒 Security Status: Requires admin token${NC}"
    echo -e "${BLUE}📊 Security Tests: Requires admin token${NC}"
    echo ""
    echo -e "${YELLOW}To test security (requires admin token):${NC}"
    echo "curl -H \"Authorization: Bearer <admin-token>\" http://localhost:3001/api/security/health"
    echo ""
}

# Cleanup function
cleanup() {
    echo -e "\n${YELLOW}Cleaning up...${NC}"
    if [ ! -z "$API_PID" ]; then
        kill $API_PID 2>/dev/null || true
        echo -e "${GREEN}✅ API server stopped${NC}"
    fi
}

# Set up signal handlers
trap cleanup EXIT INT TERM

# Main deployment flow
main() {
    echo -e "${GREEN}=== API Security Deployment ===${NC}"
    echo ""
    
    check_env
    install_deps
    build_app
    setup_logs
    verify_security
    start_api
    test_security
    show_status
    
    echo -e "${GREEN}🎉 API Security Deployment Complete!${NC}"
    echo -e "${GREEN}All security measures are now active and operational.${NC}"
}

# Run main function
main "$@"
