#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

function print_usage() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo
    echo "Commands:"
    echo "  setup         Initialize development environment"
    echo "  build         Build project (--prod or --dev)"
    echo "  start         Start services (--prod or --dev)"
    echo "  test          Run tests (--watch or --coverage)"
    echo "  docker        Manage Docker (--build, --up, or --down)"
    echo "  clean         Clean project (--all, --deps, --build, or --docker)"
    echo "  help          Show this help message"
}

function setup_project() {
    echo -e "${BLUE}🚀 Setting up development environment...${NC}"
    
    # Copy environment file if it doesn't exist
    if [ ! -f .env ]; then
        cp .env.example .env
    fi
    
    # Install dependencies
    yarn install
    
    # Initialize database
    yarn workspace @the-new-fuse/database generate
    yarn workspace @the-new-fuse/database migrate
    
    echo -e "${GREEN}✅ Setup complete!${NC}"
}

function build_project() {
    local env=${1:-dev}
    echo -e "${BLUE}🏗️  Building project for ${env}...${NC}"
    
    # Build core packages first
    yarn workspace @the-new-fuse/types build
    yarn workspace @the-new-fuse/utils build
    yarn workspace @the-new-fuse/core build
    
    # Build all other packages
    yarn workspaces foreach -pt run build
    
    echo -e "${GREEN}✅ Build complete!${NC}"
}

function start_services() {
    local env=${1:-dev}
    echo -e "${BLUE}🚀 Starting services in ${env} mode...${NC}"
    
    if [ "$env" == "prod" ]; then
        docker-compose -f docker-compose.prod.yml up -d
        yarn workspace @the-new-fuse/backend start:prod
    else
        docker-compose up -d
        yarn workspace @the-new-fuse/backend start:dev
    fi
}

function run_tests() {
    local mode=$1
    echo -e "${BLUE}🧪 Running tests...${NC}"

    case "$mode" in
        --watch)
            yarn workspaces foreach -ptv run test:watch
            ;;
        --coverage)
            yarn workspaces foreach -ptv run test:coverage
            ;;
        *)
            yarn workspaces foreach -ptv run test
            ;;
    esac
}

function run_consolidation() {
  echo -e "${BLUE}🔍 Running consolidation scripts...${NC}"

  # Check if TypeScript compiler is available
  if ! command -v tsc &> /dev/null; then
    echo -e "${RED}Error: TypeScript compiler (tsc) not found. Please install it. (e.g., npm install -g typescript)${NC}"
    exit 1
  fi

  # Compile TypeScript scripts
  tsc -p scripts/

  # Run the consolidation script
  node scripts/execute-consolidation.js
}

# Main command router
case "$1" in
    setup)
        setup_project
        ;;
    build)
        build_project "$2"
        ;;
    start)
        start_services "$2"
        ;;
    test)
        run_tests "$2"
        ;;
    clean)
        ./scripts/cleanup.sh "${2:-"--all"}"
        ;;
    docker)
        case "$2" in
            --build) docker-compose build ;;
            --up) docker-compose up -d ;;
            --down) docker-compose down ;;
            *) echo "Invalid Docker option. Use --build, --up, or --down" ;;
        esac
        ;;
    consolidate)
        run_consolidation
        ;;
    help|*)
        print_usage
        ;;
esac
