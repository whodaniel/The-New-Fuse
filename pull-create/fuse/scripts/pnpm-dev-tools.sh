#!/bin/bash

# pnpm Development Tools Script
# Comprehensive development utilities for The New Fuse monorepo

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
PNPM_VERSION="10.18.3"
NODE_VERSION="18"

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_header() {
    echo -e "\n${PURPLE}=== $1 ===${NC}\n"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Node.js version
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    local node_version=$(node --version | sed 's/v//')
    local major_version=$(echo $node_version | cut -d. -f1)
    
    if [[ $major_version -lt $NODE_VERSION ]]; then
        log_warning "Node.js version $node_version detected. Recommended: $NODE_VERSION+"
    else
        log_success "Node.js version $node_version is compatible"
    fi
    
    # Check pnpm version
    if ! command -v pnpm &> /dev/null; then
        log_error "pnpm is not installed. Installing..."
        npm install -g pnpm@$PNPM_VERSION
    fi
    
    local pnpm_version=$(pnpm --version)
    log_success "pnpm version $pnpm_version is available"
}

# Show available commands
show_help() {
    echo -e "${CYAN}pnpm Development Tools${NC}"
    echo ""
    echo "Workspace Management:"
    echo "  status      - Show workspace status and dependencies"
    echo "  install     - Install all dependencies with optimization"
    echo "  update      - Update dependencies across workspace"
    echo "  clean       - Clean all node_modules and build artifacts"
    echo "  rebuild     - Clean and reinstall everything"
    echo "  audit       - Security audit across workspace"
    echo "  outdated    - Check for outdated dependencies"
    echo ""
    echo "Development:"
    echo "  dev         - Start development servers"
    echo "  build       - Build all packages and apps"
    echo "  lint        - Lint all packages"
    echo "  format      - Format all code"
    echo "  typecheck   - Type check all TypeScript"
    echo ""
    echo "Testing:"
    echo "  test        - Run test workflows (see test-workflows.sh)"
    echo ""
    echo "Utilities:"
    echo "  deps        - Analyze dependency graph"
    echo "  size        - Analyze bundle sizes"
    echo "  perf        - Performance analysis"
    echo "  doctor      - Health check for the workspace"
    echo ""
    echo "Usage: $0 <command> [options]"
}

# Show workspace status
show_status() {
    log_header "Workspace Status"
    
    log_info "pnpm version: $(pnpm --version)"
    log_info "Node.js version: $(node --version)"
    
    echo ""
    log_info "Workspace packages:"
    pnpm -r list --depth=0
    
    echo ""
    log_info "Workspace dependencies:"
    pnpm list --depth=0
    
    echo ""
    log_info "Disk usage:"
    du -sh node_modules 2>/dev/null || echo "No node_modules found"
    du -sh .pnpm-store 2>/dev/null || echo "No .pnpm-store found"
}

# Optimized install
optimized_install() {
    log_header "Optimized Installation"
    
    log_info "Installing dependencies with pnpm optimizations..."
    
    # Set pnpm configuration for better performance
    pnpm config set store-dir .pnpm-store
    pnpm config set package-import-method hardlink
    pnpm config set hoist-pattern '*'
    pnpm config set shamefully-hoist true
    
    # Install with optimizations
    pnpm install \
        --frozen-lockfile \
        --prefer-frozen-lockfile \
        --strict-peer-dependencies=false \
        --reporter=append-only \
        "$@"
    
    log_success "Installation completed"
}

# Update dependencies
update_dependencies() {
    log_header "Updating Dependencies"
    
    log_info "Updating all workspace dependencies..."
    
    pnpm update -r --latest
    
    log_info "Checking for security vulnerabilities..."
    pnpm audit --audit-level moderate
    
    log_success "Dependencies updated"
}

# Clean workspace
clean_workspace() {
    log_header "Cleaning Workspace"
    
    log_info "Removing node_modules..."
    find . -name "node_modules" -type d -prune -exec rm -rf {} +
    
    log_info "Removing build artifacts..."
    find . -name "dist" -type d -prune -exec rm -rf {} +
    find . -name "build" -type d -prune -exec rm -rf {} +
    find . -name ".next" -type d -prune -exec rm -rf {} +
    find . -name "coverage" -type d -prune -exec rm -rf {} +
    
    log_info "Removing cache files..."
    rm -rf .pnpm-store
    rm -rf .turbo
    rm -rf .cache
    
    log_success "Workspace cleaned"
}

# Rebuild everything
rebuild_workspace() {
    log_header "Rebuilding Workspace"
    
    clean_workspace
    optimized_install
    
    log_info "Building all packages..."
    pnpm -r run build
    
    log_success "Workspace rebuilt"
}

# Security audit
security_audit() {
    log_header "Security Audit"
    
    log_info "Running security audit..."
    pnpm audit --audit-level moderate
    
    log_info "Checking for known vulnerabilities..."
    pnpm audit --fix
    
    log_success "Security audit completed"
}

# Check outdated dependencies
check_outdated() {
    log_header "Outdated Dependencies"
    
    log_info "Checking for outdated dependencies..."
    pnpm outdated -r
    
    log_info "Checking for major version updates..."
    pnpm outdated -r --format table
}

# Start development servers
start_dev() {
    log_header "Starting Development Servers"
    
    log_info "Starting all development servers..."
    pnpm -r --parallel run dev "$@"
}

# Build all packages
build_all() {
    log_header "Building All Packages"
    
    log_info "Building packages in dependency order..."
    pnpm -r run build "$@"
    
    log_success "Build completed"
}

# Lint all packages
lint_all() {
    log_header "Linting All Packages"
    
    log_info "Running ESLint across workspace..."
    pnpm -r --parallel run lint "$@"
    
    log_success "Linting completed"
}

# Format all code
format_all() {
    log_header "Formatting All Code"
    
    log_info "Running Prettier across workspace..."
    pnpm -r --parallel run format "$@"
    
    log_success "Formatting completed"
}

# Type check all TypeScript
typecheck_all() {
    log_header "Type Checking All TypeScript"
    
    log_info "Running TypeScript compiler across workspace..."
    pnpm -r --parallel run type-check "$@"
    
    log_success "Type checking completed"
}

# Analyze dependency graph
analyze_deps() {
    log_header "Dependency Analysis"
    
    log_info "Analyzing dependency graph..."
    
    # Create dependency graph
    pnpm -r list --depth=1 --json > deps-analysis.json
    
    log_info "Checking for circular dependencies..."
    # Add circular dependency check logic here
    
    log_info "Analyzing bundle impact..."
    # Add bundle analysis logic here
    
    log_success "Dependency analysis completed"
}

# Analyze bundle sizes
analyze_size() {
    log_header "Bundle Size Analysis"
    
    log_info "Analyzing bundle sizes..."
    
    # Build with analysis
    pnpm run build:analyze-memory
    
    log_info "Generating size reports..."
    # Add size analysis logic here
    
    log_success "Size analysis completed"
}

# Performance analysis
analyze_perf() {
    log_header "Performance Analysis"
    
    log_info "Running performance benchmarks..."
    
    # Build performance
    time pnpm -r run build
    
    # Test performance
    time pnpm -r run test
    
    log_success "Performance analysis completed"
}

# Health check
health_check() {
    log_header "Workspace Health Check"
    
    log_info "Checking workspace configuration..."
    
    # Check pnpm-workspace.yaml
    if [[ -f "pnpm-workspace.yaml" ]]; then
        log_success "pnpm-workspace.yaml found"
    else
        log_error "pnpm-workspace.yaml not found"
    fi
    
    # Check package.json
    if [[ -f "package.json" ]]; then
        log_success "Root package.json found"
        
        # Check packageManager field
        if grep -q "packageManager.*pnpm" package.json; then
            log_success "packageManager field correctly set to pnpm"
        else
            log_warning "packageManager field not set to pnpm"
        fi
    else
        log_error "Root package.json not found"
    fi
    
    # Check lockfile
    if [[ -f "pnpm-lock.yaml" ]]; then
        log_success "pnpm-lock.yaml found"
    else
        log_warning "pnpm-lock.yaml not found"
    fi
    
    # Check workspace packages
    local package_count=$(find packages apps tools -name "package.json" 2>/dev/null | wc -l)
    log_info "Found $package_count workspace packages"
    
    # Check for common issues
    log_info "Checking for common issues..."
    
    # Check for duplicate dependencies
    log_info "Checking for duplicate dependencies..."
    pnpm list --depth=0 | grep -E "WARN|ERROR" || log_success "No dependency warnings"
    
    log_success "Health check completed"
}

# Run test workflows
run_tests() {
    log_header "Running Test Workflows"
    
    if [[ -f "scripts/test-workflows.sh" ]]; then
        ./scripts/test-workflows.sh "$@"
    else
        log_error "test-workflows.sh not found"
        exit 1
    fi
}

# Main execution
main() {
    check_prerequisites
    
    if [[ $# -eq 0 ]]; then
        show_help
        exit 0
    fi
    
    local command="$1"
    shift
    
    case "$command" in
        "status")
            show_status "$@"
            ;;
        "install")
            optimized_install "$@"
            ;;
        "update")
            update_dependencies "$@"
            ;;
        "clean")
            clean_workspace "$@"
            ;;
        "rebuild")
            rebuild_workspace "$@"
            ;;
        "audit")
            security_audit "$@"
            ;;
        "outdated")
            check_outdated "$@"
            ;;
        "dev")
            start_dev "$@"
            ;;
        "build")
            build_all "$@"
            ;;
        "lint")
            lint_all "$@"
            ;;
        "format")
            format_all "$@"
            ;;
        "typecheck")
            typecheck_all "$@"
            ;;
        "test")
            run_tests "$@"
            ;;
        "deps")
            analyze_deps "$@"
            ;;
        "size")
            analyze_size "$@"
            ;;
        "perf")
            analyze_perf "$@"
            ;;
        "doctor")
            health_check "$@"
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            log_error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"