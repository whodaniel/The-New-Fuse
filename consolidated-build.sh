#!/bin/bash
# consolidated-build.sh - An enhanced, comprehensive build process for The New Fuse

set -e # Exit on error

# Terminal colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Parse command line arguments
skip_db=false
skip_tests=false
production=false
watch=false
clean=false
fix_ts=false
extensions=false
docker=false
incremental=false
packages=()

# Function to show usage
show_usage() {
  echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}║             The New Fuse - Consolidated Builder            ║${NC}"
  echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "${YELLOW}Usage:${NC} ./consolidated-build.sh [options] [packages...]"
  echo ""
  echo -e "${GREEN}Options:${NC}"
  echo -e "  ${BLUE}--help${NC}             Show this help message"
  echo -e "  ${BLUE}--skip-db${NC}          Skip database migrations"
  echo -e "  ${BLUE}--skip-tests${NC}       Skip running tests"
  echo -e "  ${BLUE}--production${NC}       Build for production"
  echo -e "  ${BLUE}--watch${NC}            Watch mode (for development)"
  echo -e "  ${BLUE}--clean${NC}            Clean previous builds"
  echo -e "  ${BLUE}--fix-ts${NC}           Fix TypeScript declarations before building"
  echo -e "  ${BLUE}--extensions${NC}       Build VS Code and Chrome extensions"
  echo -e "  ${BLUE}--docker${NC}           Build Docker images"
  echo -e "  ${BLUE}--incremental${NC}      Build packages incrementally in dependency order"
  echo ""
  echo -e "${GREEN}Examples:${NC}"
  echo -e "  ${BLUE}./consolidated-build.sh${NC}                   # Build all packages"
  echo -e "  ${BLUE}./consolidated-build.sh --skip-db${NC}         # Build all packages but skip DB migrations"
  echo -e "  ${BLUE}./consolidated-build.sh --production${NC}      # Build all packages for production"
  echo -e "  ${BLUE}./consolidated-build.sh api-core types${NC}    # Build only the specified packages"
  echo -e "  ${BLUE}./consolidated-build.sh --incremental${NC}     # Build packages in dependency order"
  echo -e "  ${BLUE}./consolidated-build.sh --extensions${NC}      # Build VS Code and Chrome extensions"
  echo ""
}

# Function to show menu
show_menu() {
  clear
  echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}║             The New Fuse - Build Configuration             ║${NC}"
  echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "${YELLOW}Please select build options:${NC}"
  echo -e "${BLUE}1)${NC} Build Mode        : $([ "$production" == true ] && echo -e "${GREEN}Production${NC}" || echo -e "${YELLOW}Development${NC}")"
  echo -e "${BLUE}2)${NC} Database Migrations: $([ "$skip_db" == true ] && echo -e "${RED}Skip${NC}" || echo -e "${GREEN}Include${NC}")"
  echo -e "${BLUE}3)${NC} Tests              : $([ "$skip_tests" == true ] && echo -e "${RED}Skip${NC}" || echo -e "${GREEN}Include${NC}")"
  echo -e "${BLUE}4)${NC} Watch Mode        : $([ "$watch" == true ] && echo -e "${GREEN}Enabled${NC}" || echo -e "${RED}Disabled${NC}")"
  echo -e "${BLUE}5)${NC} Clean Previous    : $([ "$clean" == true ] && echo -e "${GREEN}Yes${NC}" || echo -e "${RED}No${NC}")"
  echo -e "${BLUE}6)${NC} Fix TypeScript    : $([ "$fix_ts" == true ] && echo -e "${GREEN}Yes${NC}" || echo -e "${RED}No${NC}")"
  echo -e "${BLUE}7)${NC} Build Extensions  : $([ "$extensions" == true ] && echo -e "${GREEN}Yes${NC}" || echo -e "${RED}No${NC}")"
  echo -e "${BLUE}8)${NC} Build Docker      : $([ "$docker" == true ] && echo -e "${GREEN}Yes${NC}" || echo -e "${RED}No${NC}")"
  echo -e "${BLUE}9)${NC} Build Incrementally: $([ "$incremental" == true ] && echo -e "${GREEN}Yes${NC}" || echo -e "${RED}No${NC}")"
  echo ""
  echo -e "${BLUE}10)${NC} Specify packages : ${MAGENTA}${packages[*]:-"All packages"}${NC}"
  echo ""
  echo -e "${GREEN}s)${NC} Start Build"
  echo -e "${RED}q)${NC} Quit"
  echo ""
  echo -n -e "${YELLOW}Enter option: ${NC}"
}

# Interactive menu if no arguments are provided
if [ $# -eq 0 ]; then
  while true; do
    show_menu
    read -r choice
    case $choice in
      1)
        production=$([ "$production" == true ] && echo false || echo true)
        ;;
      2)
        skip_db=$([ "$skip_db" == true ] && echo false || echo true)
        ;;
      3)
        skip_tests=$([ "$skip_tests" == true ] && echo false || echo true)
        ;;
      4)
        watch=$([ "$watch" == true ] && echo false || echo true)
        ;;
      5)
        clean=$([ "$clean" == true ] && echo false || echo true)
        ;;
      6)
        fix_ts=$([ "$fix_ts" == true ] && echo false || echo true)
        ;;
      7)
        extensions=$([ "$extensions" == true ] && echo false || echo true)
        ;;
      8)
        docker=$([ "$docker" == true ] && echo false || echo true)
        ;;
      9)
        incremental=$([ "$incremental" == true ] && echo false || echo true)
        ;;
      10)
        echo -n -e "${YELLOW}Enter package names separated by space (or 'all' for all packages): ${NC}"
        read -r package_input
        if [ "$package_input" = "all" ]; then
          packages=()
        else
          IFS=' ' read -ra packages <<< "$package_input"
        fi
        ;;
      s|S)
        break
        ;;
      q|Q)
        echo -e "${YELLOW}Build cancelled.${NC}"
        exit 0
        ;;
      *)
        echo -e "${RED}Invalid option. Press Enter to continue...${NC}"
        read -r
        ;;
    esac
  done
else
  # Process command line arguments
  while [[ $# -gt 0 ]]; do
    case $1 in
      --help)
        show_usage
        exit 0
        ;;
      --skip-db)
        skip_db=true
        shift
        ;;
      --skip-tests)
        skip_tests=true
        shift
        ;;
      --production)
        production=true
        shift
        ;;
      --watch)
        watch=true
        shift
        ;;
      --clean)
        clean=true
        shift
        ;;
      --fix-ts)
        fix_ts=true
        shift
        ;;
      --extensions)
        extensions=true
        shift
        ;;
      --docker)
        docker=true
        shift
        ;;
      --incremental)
        incremental=true
        shift
        ;;
      *)
        packages+=("$1")
        shift
        ;;
    esac
  done
fi

# Display build configuration
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║             The New Fuse - Build Configuration             ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Build mode:${NC} $([ "$production" == true ] && echo -e "${GREEN}Production${NC}" || echo -e "${BLUE}Development${NC}")"
echo -e "${YELLOW}Database migrations:${NC} $([ "$skip_db" == true ] && echo -e "${RED}Skip${NC}" || echo -e "${GREEN}Include${NC}")"
echo -e "${YELLOW}Tests:${NC} $([ "$skip_tests" == true ] && echo -e "${RED}Skip${NC}" || echo -e "${GREEN}Include${NC}")"
echo -e "${YELLOW}Watch mode:${NC} $([ "$watch" == true ] && echo -e "${GREEN}Enabled${NC}" || echo -e "${RED}Disabled${NC}")"
echo -e "${YELLOW}Clean previous builds:${NC} $([ "$clean" == true ] && echo -e "${GREEN}Yes${NC}" || echo -e "${RED}No${NC}")"
echo -e "${YELLOW}Fix TypeScript declarations:${NC} $([ "$fix_ts" == true ] && echo -e "${GREEN}Yes${NC}" || echo -e "${RED}No${NC}")"
echo -e "${YELLOW}Build extensions:${NC} $([ "$extensions" == true ] && echo -e "${GREEN}Yes${NC}" || echo -e "${RED}No${NC}")"
echo -e "${YELLOW}Build Docker images:${NC} $([ "$docker" == true ] && echo -e "${GREEN}Yes${NC}" || echo -e "${RED}No${NC}")"
echo -e "${YELLOW}Build incrementally:${NC} $([ "$incremental" == true ] && echo -e "${GREEN}Yes${NC}" || echo -e "${RED}No${NC}")"

if [ ${#packages[@]} -gt 0 ]; then
  echo -e "${YELLOW}Building specific packages:${NC} ${MAGENTA}${packages[*]}${NC}"
else
  echo -e "${YELLOW}Building:${NC} ${GREEN}All packages${NC}"
fi
echo ""

# Confirm build
if [[ -t 0 ]]; then  # Only if input is from terminal
  echo -n -e "${YELLOW}Continue with build? [Y/n] ${NC}"
  read -r confirm
  if [[ $confirm =~ ^[Nn] ]]; then
    echo -e "${RED}Build cancelled.${NC}"
    exit 0
  fi
fi

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                  Starting Build Process                     ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Clean previous builds if requested
if [ "$clean" == true ]; then
  echo -e "🧹 ${YELLOW}Cleaning previous builds...${NC}"
  rm -rf dist
  find . -name "dist" -type d -exec rm -rf {} \; 2>/dev/null || true
  find . -name ".turbo" -type d -exec rm -rf {} \; 2>/dev/null || true
  echo -e "${GREEN}Clean complete.${NC}"
  echo ""
fi

# Fix TypeScript declarations if requested
if [ "$fix_ts" == true ]; then
  echo -e "🔧 ${YELLOW}Fixing TypeScript declaration errors...${NC}"
  if [ -f "fix-declarations.mjs" ]; then
    node fix-declarations.mjs
  elif [ -f "fix-ts-declarations.js" ]; then
    node fix-ts-declarations.js
  else
    echo -e "${RED}TypeScript declaration fixer not found!${NC}"
  fi
  echo -e "${GREEN}TypeScript fixes applied.${NC}"
  echo ""
fi

# Setup environment
echo -e "🌍 ${YELLOW}Setting up environment...${NC}"
if [ -f .env ]; then
  echo -e "${GREEN}Using existing .env file${NC}"
else
  echo -e "${BLUE}Creating default .env file${NC}"
  cp .env.example .env
fi
echo ""

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
  echo -e "📦 ${YELLOW}Installing dependencies...${NC}"
  yarn install
  echo -e "${GREEN}Dependencies installed.${NC}"
  echo ""
fi

# Run database migrations if needed
if [ "$skip_db" != true ]; then
  echo -e "🗄️ ${YELLOW}Running database migrations...${NC}"
  yarn db:generate
  yarn db:migrate
  echo -e "${GREEN}Database migrations complete.${NC}"
  echo ""
else
  echo -e "${BLUE}Skipping database migrations...${NC}"
  echo ""
fi

# Build process
echo -e "🏗️ ${YELLOW}Building packages...${NC}"

# Determine specific packages to build or build incrementally
if [ "$incremental" == true ]; then
  echo -e "${CYAN}Building packages incrementally in dependency order...${NC}"
  
  echo -e "🧩 ${YELLOW}Building types package...${NC}"
  yarn workspace @the-new-fuse/types build
  
  echo -e "🧩 ${YELLOW}Building utils package...${NC}"
  yarn workspace @the-new-fuse/utils build
  
  echo -e "🧩 ${YELLOW}Building core package...${NC}"
  yarn workspace @the-new-fuse/core build
  
  echo -e "🧩 ${YELLOW}Building database package...${NC}"
  yarn workspace @the-new-fuse/database build
  
  echo -e "🧩 ${YELLOW}Building UI packages...${NC}"
  yarn workspace @the-new-fuse/ui build
  [ -d "packages/ui-components" ] && yarn workspace @the-new-fuse/ui-components build
  [ -d "packages/ui-consolidated" ] && yarn workspace @the-new-fuse/ui-consolidated build
  
  echo -e "🧩 ${YELLOW}Building feature packages...${NC}"
  [ -d "packages/feature-tracker" ] && yarn workspace @the-new-fuse/feature-tracker build
  [ -d "packages/feature-suggestions" ] && yarn workspace @the-new-fuse/feature-suggestions build
  
  echo -e "🧩 ${YELLOW}Building API packages...${NC}"
  [ -d "packages/api-types" ] && yarn workspace @the-new-fuse/api-types build
  yarn workspace @the-new-fuse/api-core build
  yarn workspace @the-new-fuse/api build
  [ -d "packages/api-client" ] && yarn workspace @the-new-fuse/api-client build
  
  echo -e "🧩 ${YELLOW}Building frontend and backend packages...${NC}"
  [ -d "packages/frontend" ] && yarn workspace @the-new-fuse/frontend build
  [ -d "packages/backend" ] && yarn workspace @the-new-fuse/backend build
  
elif [ ${#packages[@]} -gt 0 ]; then
  # Build specified packages
  for package in "${packages[@]}"; do
    echo -e "🧩 ${YELLOW}Building package: ${MAGENTA}$package${NC}..."
    if [ "$watch" == true ]; then
      yarn workspace @the-new-fuse/$package dev &
    else
      yarn workspace @the-new-fuse/$package build
    fi
  done
else
  # Build everything using turbo
  echo -e "${CYAN}Building all packages...${NC}"
  if [ "$production" == true ]; then
    yarn build
  elif [ "$watch" == true ]; then
    yarn dev
  else
    yarn build
  fi
fi

echo -e "${GREEN}Package builds complete.${NC}"
echo ""

# Build extensions if requested
if [ "$extensions" == true ]; then
  # VS Code extension
  if [ -d "packages/vscode-extension" ]; then
    echo -e "🧩 ${YELLOW}Building VS Code extension...${NC}"
    cd packages/vscode-extension
    yarn install
    yarn build
    yarn package
    cd ../..
    echo -e "${GREEN}VS Code extension built.${NC}"
    echo ""
  fi
  
  # Chrome extension
  if [ -d "packages/chrome-extension" ]; then
    echo -e "🧩 ${YELLOW}Building Chrome extension...${NC}"
    cd packages/chrome-extension
    yarn install
    yarn build
    cd ../..
    echo -e "${GREEN}Chrome extension built.${NC}"
    echo ""
  fi
fi

# Build Docker images if requested
if [ "$docker" == true ]; then
  echo -e "🐳 ${YELLOW}Building Docker images...${NC}"
  docker-compose -f docker-compose.yml build
  echo -e "${GREEN}Docker images built.${NC}"
  echo ""
fi

# Run tests if needed
if [ "$skip_tests" != true ] && [ "$watch" != true ]; then
  echo -e "🧪 ${YELLOW}Running tests...${NC}"
  yarn test
  echo -e "${GREEN}Tests complete.${NC}"
  echo ""
else
  echo -e "${BLUE}Skipping tests...${NC}"
  echo ""
fi

echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                    Build Process Complete                   ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✅ The New Fuse build completed successfully!${NC}"
echo ""

# Next steps
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  • ${BLUE}To run the development environment:${NC} ./run-dev-docker.sh"
echo -e "  • ${BLUE}To run the production environment:${NC} ./run-prod-docker.sh"
echo -e "  • ${BLUE}To start the API server:${NC} yarn workspace @the-new-fuse/api start"
echo -e "  • ${BLUE}To start the frontend:${NC} yarn workspace @the-new-fuse/frontend start"
echo ""

# If in watch mode, wait for Ctrl+C
if [ "$watch" == true ]; then
  echo -e "${YELLOW}Watch mode active. Press Ctrl+C to stop.${NC}"
  wait
fi