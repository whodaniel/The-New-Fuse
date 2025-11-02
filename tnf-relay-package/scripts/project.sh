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
    pnpm install
    
    # Initialize database
    cd packages/database && pnpm run generate && cd ../..
    cd packages/database && pnpm run migrate && cd ../..
    
    echo -e "${GREEN}✅ Setup complete!${NC}"
}

function build_project() {
    local env=${1:-dev}
    echo -e "${BLUE}🏗️  Building project for ${env}...${NC}"
    
    # Build core packages first
    cd packages/types && pnpm run build && cd ../..
    cd packages/utils && pnpm run build && cd ../..
    cd packages/core && pnpm run build && cd ../..
    
    # Build all other packages
    for dir in packages/*/; do
        if [ -d "$dir" ] && [ -f "$dir/package.json" ]; then
            echo "Building $dir..."
            cd "$dir" && pnpm run build && cd ../..
        fi
    done
    
    echo -e "${GREEN}✅ Build complete!${NC}"
}

function start_services() {
    local env=${1:-dev}
    echo -e "${BLUE}🚀 Starting services in ${env} mode...${NC}"
    
    if [ "$env" == "prod" ]; then
        docker-compose -f docker-compose.prod.yml up -d
        cd packages/backend && pnpm run start:prod
    else
        docker-compose up -d
        cd packages/backend && pnpm run start:dev
    fi
}

function run_tests() {
    local mode=$1
    echo -e "${BLUE}🧪 Running tests...${NC}"

    case "$mode" in
        --watch)
            for dir in packages/*/; do
                if [ -d "$dir" ] && [ -f "$dir/package.json" ]; then
                    echo "Running tests in watch mode for $dir..."
                    cd "$dir" && pnpm run test:watch && cd ../..
                fi
            done
            ;;
        --coverage)
            for dir in packages/*/; do
                if [ -d "$dir" ] && [ -f "$dir/package.json" ]; then
                    echo "Running tests with coverage for $dir..."
                    cd "$dir" && pnpm run test:coverage && cd ../..
                fi
            done
            ;;
        *)
            for dir in packages/*/; do
                if [ -d "$dir" ] && [ -f "$dir/package.json" ]; then
                    echo "Running tests for $dir..."
                    cd "$dir" && pnpm test && cd ../..
                fi
            done
            ;;
    esac
}

function run_consolidation() {
  echo -e "${BLUE}🔍 Running consolidation scripts...${NC}"

  # Check if TypeScript compiler is available
  if ! command -v tsc &> /dev/null; then
    echo -e "${RED}Error: TypeScript compiler (tsc) not found. Please install it. (e.g., pnpm install -g typescript)${NC}"
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
