#!/bin/bash
set -e

# Base directories and imports
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Source common functions
source "$SCRIPT_DIR/common/logging.sh"

# Environment variable
ENV=${ENV:-development}
VERBOSE=${VERBOSE:-false}

# Main menu options
declare -A MENU_OPTIONS=(
    [1]="Initialize/Reset Project"
    [2]="Build Project"
    [3]="Deploy Application"
    [4]="Development Tools"
    [5]="Maintenance Tasks"
    [6]="Monitoring & Status"
    [7]="Exit"
)

# Development tools submenu
declare -A DEV_TOOLS=(
    [1]="Start Development Server"
    [2]="Run Tests"
    [3]="TypeScript Fixes"
    [4]="Lint Code"
    [5]="Back to Main Menu"
)

# Maintenance submenu
declare -A MAINTENANCE_TOOLS=(
    [1]="Clean Project"
    [2]="Update Dependencies"
    [3]="Fix Common Issues"
    [4]="Verify Project Structure"
    [5]="Back to Main Menu"
)

# Show spinner while waiting
show_spinner() {
    local pid=$1
    local delay=0.1
    local spinstr='|/-\'
    while [ "$(ps a | awk '{print $1}' | grep $pid)" ]; do
        local temp=${spinstr#?}
        printf " [%c]  " "$spinstr"
        local spinstr=$temp${spinstr%"$temp"}
        sleep $delay
        printf "\b\b\b\b\b\b"
    done
    printf "    \b\b\b\b"
}

# Print header
print_header() {
    clear
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}   The New Fuse Control Panel${NC}"
    echo -e "${BLUE}================================${NC}"
    echo -e "Environment: ${YELLOW}$ENV${NC}"
    echo
}

# Show menu and get choice
show_menu() {
    local -n options=$1
    local i=1
    
    for key in "${!options[@]}"; do
        echo -e "${BLUE}$key${NC}. ${options[$key]}"
    done
    
    echo
    read -p "Enter your choice: " choice
    echo
    echo -e "${YELLOW}Selected: ${options[$choice]}${NC}"
    echo
    return $choice
}

# Initialize project
initialize_project() {
    log_info "Initializing project..."
    
    # Create directory structure
    bash "$SCRIPT_DIR/organize-project-structure.sh"
    
    # Install dependencies
    yarn install --frozen-lockfile
    
    # Setup environment
    cp .env.example .env
    
    # Generate Prisma client
    yarn workspace @the-new-fuse/database generate
    
    # Run initial build
    build_core_packages
    
    log_success "Project initialized successfully!"
}

# Build core packages
build_core_packages() {
    log_info "Building core packages..."
    
    yarn workspace @the-new-fuse/types build
    yarn workspace @the-new-fuse/utils build
    yarn workspace @the-new-fuse/core build
    yarn workspace @the-new-fuse/database build
    yarn workspace @the-new-fuse/feature-tracker build
    yarn workspace @the-new-fuse/feature-suggestions build
    
    log_success "Core packages built successfully!"
}

# Development tools menu
dev_tools_menu() {
    while true; do
        print_header
        echo -e "${BLUE}Development Tools${NC}"
        echo
        show_menu DEV_TOOLS
        case $? in
            1) yarn dev & show_spinner $! ;;
            2) yarn test ;;
            3) bash "$SCRIPT_DIR/typescript-fixes/fix-typescript-consolidated.sh" ;;
            4) yarn lint ;;
            5) return ;;
            *) log_error "Invalid option" ;;
        esac
        read -p "Press Enter to continue..."
    done
}

# Maintenance menu
maintenance_menu() {
    while true; do
        print_header
        echo -e "${BLUE}Maintenance Tools${NC}"
        echo
        show_menu MAINTENANCE_TOOLS
        case $? in
            1) bash "$SCRIPT_DIR/cleanup.sh" --all ;;
            2) yarn upgrade-interactive --latest ;;
            3) bash "$SCRIPT_DIR/fix-all.sh" ;;
            4) bash "$SCRIPT_DIR/manage/verify.sh" ;;
            5) return ;;
            *) log_error "Invalid option" ;;
        esac
        read -p "Press Enter to continue..."
    done
}

# Deploy application
deploy_application() {
    log_info "Deploying application..."
    
    # Build first
    build_core_packages
    
    # Run deployment script
    bash "$SCRIPT_DIR/deploy.sh" "$ENV"
    
    # Verify deployment
    bash "$SCRIPT_DIR/verify-services.sh"
    
    log_success "Deployment completed!"
}

# Monitor status
monitor_status() {
    log_info "Checking system status..."
    
    # Show service status
    bash "$SCRIPT_DIR/deployment-status-extended.sh"
    
    # Show monitoring dashboard if available
    if [ -f "$SCRIPT_DIR/monitor.sh" ]; then
        bash "$SCRIPT_DIR/monitor.sh"
    fi
}

# Main menu loop
main_menu() {
    while true; do
        print_header
        show_menu MENU_OPTIONS
        case $? in
            1) initialize_project ;;
            2) build_core_packages ;;
            3) deploy_application ;;
            4) dev_tools_menu ;;
            5) maintenance_menu ;;
            6) monitor_status ;;
            7) 
                echo -e "${GREEN}Goodbye!${NC}"
                exit 0
                ;;
            *)
                log_error "Invalid option"
                ;;
        esac
        read -p "Press Enter to continue..."
    done
}

# Handle command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --env)
            ENV="$2"
            shift 2
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Start the interactive menu
main_menu