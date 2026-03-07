#!/bin/bash
set -e

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load common functions and configurations
source "$SCRIPT_DIR/common/colors.sh"
source "$SCRIPT_DIR/common/logging.sh"
source "$SCRIPT_DIR/build-config.sh"

# Module definitions
MODULES=(
    "init"
    "build"
    "deploy"
    "monitor"
    "maintenance"
)

# Help function
show_help() {
    echo -e "${BLUE}The New Fuse - Master Control Script${NC}"
    echo "Usage: ./master.sh [command] [options]"
    echo ""
    echo "Commands:"
    echo "  init        - Initialize or reset project structure"
    echo "  build       - Build all packages and applications"
    echo "  deploy      - Deploy the application"
    echo "  monitor     - Show monitoring dashboard"
    echo "  status      - Check system status"
    echo "  maintenance - Perform maintenance tasks"
    echo "  help        - Show this help message"
    echo ""
    echo "Options:"
    echo "  --env [development|staging|production]"
    echo "  --verbose   Enable verbose logging"
    echo "  --force     Force operation"
}

# Initialize project
init_project() {
    log_info "Initializing project structure..."
    
    # Create directory structure
    bash "$SCRIPT_DIR/manage/init.sh"
    
    # Setup workspaces
    node "$SCRIPT_DIR/setup-workspaces.js"
    
    # Sync dependencies
    bash "$SCRIPT_DIR/manage/sync-deps.sh"
    
    # Verify structure
    bash "$SCRIPT_DIR/manage/verify.sh"
}

# Build function
build_project() {
    local env=${1:-development}
    log_info "Building project for $env..."
    
    # Clean previous builds
    bash "$SCRIPT_DIR/manage/clean-all.sh"
    
    # Install dependencies
    yarn install --frozen-lockfile
    
    # Build packages in correct order
    build_packages
    
    # Run type checks and linting
    yarn workspaces foreach -ptv run type-check
    yarn workspaces foreach -ptv run lint
}

# Deploy function
deploy_project() {
    local env=${1:-development}
    log_info "Deploying to $env..."
    
    # Build first
    build_project "$env"
    
    # Run deployment script
    bash "$SCRIPT_DIR/deploy.sh" "$env"
    
    # Verify deployment
    verify_deployment "$env"
}

# Monitor function
show_monitoring() {
    log_info "Showing monitoring dashboard..."
    
    # Check Grafana status
    bash "$SCRIPT_DIR/check-grafana-status.sh"
    
    # Check Prometheus alerts
    bash "$SCRIPT_DIR/check-prometheus-alerts.sh"
    
    # Show deployment status
    bash "$SCRIPT_DIR/deployment-status-extended.sh"
}

# Status check function
check_status() {
    log_info "Checking system status..."
    
    # Check services health
    local services_healthy=true
    
    # Check API
    if ! curl -s http://localhost:3001/health > /dev/null; then
        log_error "API is not healthy"
        services_healthy=false
    fi
    
    # Check Frontend
    if ! curl -s http://localhost:3000/health > /dev/null; then
        log_error "Frontend is not healthy"
        services_healthy=false
    fi
    
    # Check Database
    if ! yarn workspace @the-new-fuse/database check-connection; then
        log_error "Database is not healthy"
        services_healthy=false
    fi
    
    # Show monitoring data if services are unhealthy
    if [ "$services_healthy" = false ]; then
        show_monitoring
    fi
    
    return $services_healthy
}

# Maintenance function
perform_maintenance() {
    log_info "Performing maintenance tasks..."
    
    # Clean up old builds
    bash "$SCRIPT_DIR/manage/clean-all.sh"
    
    # Fix common issues
    bash "$SCRIPT_DIR/fix-all.sh"
    
    # Update dependencies
    yarn upgrade-interactive --latest
    
    # Verify project structure
    bash "$SCRIPT_DIR/manage/verify.sh"
}

# Verify deployment function
verify_deployment() {
    local env=$1
    log_info "Verifying deployment in $env..."
    
    # Check deployment status
    bash "$SCRIPT_DIR/deployment-status-extended.sh"
    
    # Check services health
    check_status
}

# Main execution logic
main() {
    local command=$1
    shift
    
    case $command in
        "init")
            init_project "$@"
            ;;
        "build")
            build_project "$@"
            ;;
        "deploy")
            deploy_project "$@"
            ;;
        "monitor")
            show_monitoring
            ;;
        "status")
            check_status
            ;;
        "maintenance")
            perform_maintenance
            ;;
        "help"|"--help"|"-h")
            show_help
            ;;
        *)
            echo -e "${RED}Unknown command: $command${NC}"
            show_help
            exit 1
            ;;
    esac
}

# Execute main function with all arguments
main "$@"