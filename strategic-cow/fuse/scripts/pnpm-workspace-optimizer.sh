#!/bin/bash

# pnpm Workspace Optimizer
# Advanced workspace filtering and optimization for maximum development efficiency

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
WORKSPACE_ROOT=$(pwd)
PNPM_WORKSPACE_FILE="pnpm-workspace.yaml"
FILTERS_CONFIG="scripts/workspace-filters.json"

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
    if ! command -v pnpm &> /dev/null; then
        log_error "pnpm is not installed. Please install pnpm first."
        exit 1
    fi
    
    if [[ ! -f "$PNPM_WORKSPACE_FILE" ]]; then
        log_error "pnpm workspace file not found: $PNPM_WORKSPACE_FILE"
        exit 1
    fi
    
    log_info "Prerequisites check passed"
}

# Show help
show_help() {
    echo -e "${CYAN}pnpm Workspace Optimizer${NC}"
    echo ""
    echo "Commands:"
    echo "  analyze     - Analyze workspace structure and dependencies"
    echo "  filter      - Apply workspace filters for targeted operations"
    echo "  optimize    - Optimize workspace configuration and performance"
    echo "  test        - Run targeted tests with workspace filtering"
    echo "  build       - Build packages with optimal filtering"
    echo "  dev         - Start development with filtered packages"
    echo "  clean       - Clean workspace with filtering options"
    echo "  deps        - Analyze and optimize dependencies"
    echo "  health      - Check workspace health and performance"
    echo ""
    echo "Filter Types:"
    echo "  --core      - Core packages only"
    echo "  --apps      - Applications only"
    echo "  --tools     - Tools and utilities"
    echo "  --changed   - Changed packages since last commit"
    echo "  --affected  - Packages affected by changes"
    echo "  --scope     - Filter by package scope (e.g., @the-new-fuse)"
    echo ""
    echo "Usage: $0 <command> [options]"
}

# Analyze workspace structure
analyze_workspace() {
    log_header "Workspace Analysis"
    
    log_info "Workspace structure:"
    pnpm list --depth=0 --json | jq -r '.[] | select(.name != null) | "  \(.name) (\(.path))"'
    
    echo ""
    log_info "Package dependencies:"
    pnpm list --depth=1 --json | jq -r '.[] | select(.dependencies != null) | "  \(.name): \(.dependencies | keys | length) dependencies"'
    
    echo ""
    log_info "Workspace statistics:"
    local total_packages=$(pnpm list --depth=0 --json | jq '. | length')
    local core_packages=$(pnpm list --depth=0 --filter="./packages/*" --json 2>/dev/null | jq '. | length' || echo "0")
    local apps=$(pnpm list --depth=0 --filter="./apps/*" --json 2>/dev/null | jq '. | length' || echo "0")
    local tools=$(pnpm list --depth=0 --filter="./tools/*" --json 2>/dev/null | jq '. | length' || echo "0")
    
    echo "  Total packages: $total_packages"
    echo "  Core packages: $core_packages"
    echo "  Applications: $apps"
    echo "  Tools: $tools"
    
    echo ""
    log_info "Dependency graph complexity:"
    pnpm why --json 2>/dev/null | jq -r 'keys | length' | xargs -I {} echo "  Unique dependencies: {}"
    
    log_success "Workspace analysis completed"
}

# Apply workspace filters
apply_filters() {
    local filter_type="$1"
    local command="$2"
    shift 2
    
    log_header "Applying Workspace Filters: $filter_type"
    
    case "$filter_type" in
        "core")
            log_info "Filtering core packages..."
            pnpm --filter="./packages/{core,types,utils,shared}" "$command" "$@"
            ;;
        "apps")
            log_info "Filtering applications..."
            pnpm --filter="./apps/*" "$command" "$@"
            ;;
        "tools")
            log_info "Filtering tools..."
            pnpm --filter="./tools/*" "$command" "$@"
            ;;
        "changed")
            log_info "Filtering changed packages..."
            pnpm --filter="[HEAD^1]" "$command" "$@"
            ;;
        "affected")
            log_info "Filtering affected packages..."
            pnpm --filter="...[HEAD^1]" "$command" "$@"
            ;;
        "scope")
            local scope="$1"
            shift
            log_info "Filtering by scope: $scope"
            pnpm --filter="$scope/*" "$command" "$@"
            ;;
        "frontend")
            log_info "Filtering frontend packages..."
            pnpm --filter="./apps/frontend" --filter="./packages/{ui,components}" "$command" "$@"
            ;;
        "backend")
            log_info "Filtering backend packages..."
            pnpm --filter="./apps/api" --filter="./packages/{core,database}" "$command" "$@"
            ;;
        "fast")
            log_info "Filtering fast-building packages..."
            pnpm --filter="./packages/{types,utils}" "$command" "$@"
            ;;
        *)
            log_error "Unknown filter type: $filter_type"
            return 1
            ;;
    esac
    
    log_success "Filter applied successfully"
}

# Optimize workspace configuration
optimize_workspace() {
    log_header "Workspace Optimization"
    
    # Check .pnpmrc configuration
    log_info "Checking .pnpmrc configuration..."
    if [[ -f ".pnpmrc" ]]; then
        log_success ".pnpmrc found and configured"
    else
        log_warning ".pnpmrc not found, workspace may not be optimized"
    fi
    
    # Optimize node_modules structure
    log_info "Optimizing node_modules structure..."
    if ! pnpm install --frozen-lockfile --prefer-offline 2>/dev/null; then
        log_warning "Lockfile is outdated, updating..."
        pnpm install --no-frozen-lockfile --prefer-offline
    fi
    
    # Clean up unused dependencies
    log_info "Cleaning up unused dependencies..."
    pnpm prune
    
    # Update lockfile
    log_info "Updating lockfile..."
    pnpm install --lockfile-only
    
    # Check for duplicate dependencies
    log_info "Checking for duplicate dependencies..."
    pnpm list --depth=Infinity --json | jq -r '
        [.[] | .dependencies // {} | to_entries[]] 
        | group_by(.key) 
        | map(select(length > 1)) 
        | map({package: .[0].key, versions: map(.value.version) | unique}) 
        | map(select(.versions | length > 1))
        | .[]
        | "  Duplicate: \(.package) - versions: \(.versions | join(", "))"
    '
    
    log_success "Workspace optimization completed"
}

# Targeted testing with filters
run_filtered_tests() {
    local filter_type="$1"
    local test_type="${2:-unit}"
    
    log_header "Filtered Testing: $filter_type ($test_type)"
    
    case "$test_type" in
        "unit")
            apply_filters "$filter_type" "test:unit"
            ;;
        "integration")
            apply_filters "$filter_type" "test:integration"
            ;;
        "e2e")
            apply_filters "$filter_type" "test:e2e"
            ;;
        "all")
            apply_filters "$filter_type" "test"
            ;;
        *)
            log_error "Unknown test type: $test_type"
            return 1
            ;;
    esac
}

# Optimized build with filters
run_filtered_build() {
    local filter_type="$1"
    shift
    
    log_header "Filtered Build: $filter_type"
    
    case "$filter_type" in
        "staged")
            log_info "Stage 1: Building core packages..."
            apply_filters "core" "build" "$@"
            
            log_info "Stage 2: Building other packages..."
            pnpm --filter="./packages/*" --filter="!./packages/{core,types,utils,shared}" build "$@"
            
            log_info "Stage 3: Building applications..."
            apply_filters "apps" "build" "$@"
            ;;
        "parallel")
            log_info "Building all packages in parallel..."
            pnpm --filter="./packages/*" --filter="./apps/*" build "$@"
            ;;
        *)
            apply_filters "$filter_type" "build" "$@"
            ;;
    esac
}

# Development with filters
run_filtered_dev() {
    local filter_type="$1"
    shift
    
    log_header "Filtered Development: $filter_type"
    
    case "$filter_type" in
        "frontend")
            log_info "Starting frontend development..."
            pnpm --filter="./apps/frontend" --filter="./packages/{ui,components}" dev "$@"
            ;;
        "backend")
            log_info "Starting backend development..."
            pnpm --filter="./apps/api" --filter="./packages/{core,database}" dev "$@"
            ;;
        "full")
            log_info "Starting full development environment..."
            pnpm --filter="./apps/*" dev "$@"
            ;;
        *)
            apply_filters "$filter_type" "dev" "$@"
            ;;
    esac
}

# Clean with filters
run_filtered_clean() {
    local filter_type="$1"
    shift
    
    log_header "Filtered Clean: $filter_type"
    
    case "$filter_type" in
        "build")
            log_info "Cleaning build artifacts..."
            pnpm --filter="./packages/*" --filter="./apps/*" clean:build "$@"
            ;;
        "deps")
            log_info "Cleaning dependencies..."
            find . -name "node_modules" -type d -prune -exec rm -rf {} +
            pnpm install
            ;;
        "cache")
            log_info "Cleaning cache..."
            pnpm store prune
            rm -rf .turbo
            ;;
        "all")
            log_info "Full clean..."
            pnpm --filter="./packages/*" --filter="./apps/*" clean "$@"
            find . -name "node_modules" -type d -prune -exec rm -rf {} +
            pnpm store prune
            rm -rf .turbo
            ;;
        *)
            apply_filters "$filter_type" "clean" "$@"
            ;;
    esac
}

# Dependency analysis and optimization
analyze_dependencies() {
    log_header "Dependency Analysis"
    
    log_info "Analyzing dependency sizes..."
    pnpm list --depth=0 --json | jq -r '.[] | select(.name != null) | "\(.name)"' | while read -r package; do
        if [[ -d "$package" ]]; then
            local size=$(du -sh "$package/node_modules" 2>/dev/null | cut -f1 || echo "N/A")
            echo "  $package: $size"
        fi
    done
    
    echo ""
    log_info "Checking for security vulnerabilities..."
    pnpm audit --audit-level moderate
    
    echo ""
    log_info "Checking for outdated dependencies..."
    pnpm outdated --recursive
    
    echo ""
    log_info "Analyzing bundle sizes (if applicable)..."
    if command -v bundlesize &> /dev/null; then
        pnpm --filter="./apps/*" run analyze:bundle 2>/dev/null || log_warning "Bundle analysis not available"
    fi
    
    log_success "Dependency analysis completed"
}

# Health check
check_workspace_health() {
    log_header "Workspace Health Check"
    
    local issues=0
    
    # Check pnpm version
    log_info "Checking pnpm version..."
    local pnpm_version=$(pnpm --version)
    echo "  pnpm version: $pnpm_version"
    
    # Check workspace configuration
    log_info "Checking workspace configuration..."
    if [[ -f "$PNPM_WORKSPACE_FILE" ]]; then
        log_success "Workspace file found"
    else
        log_error "Workspace file missing"
        ((issues++))
    fi
    
    # Check for common issues
    log_info "Checking for common issues..."
    
    # Check for phantom dependencies
    local phantom_deps=$(pnpm list --depth=Infinity --json 2>/dev/null | jq -r '
        [.[] | select(.problems != null) | .problems[]] 
        | map(select(. | contains("phantom"))) 
        | length
    ' || echo "0")
    
    if [[ "$phantom_deps" -gt 0 ]]; then
        log_warning "Found $phantom_deps phantom dependencies"
        ((issues++))
    fi
    
    # Check lockfile consistency
    if ! pnpm install --frozen-lockfile --dry-run &>/dev/null; then
        log_warning "Lockfile may be inconsistent"
        ((issues++))
    fi
    
    # Performance metrics
    log_info "Performance metrics..."
    local install_time=$(time (pnpm install --frozen-lockfile --offline) 2>&1 | grep real | awk '{print $2}' || echo "N/A")
    echo "  Install time: $install_time"
    
    # Summary
    echo ""
    if [[ $issues -eq 0 ]]; then
        log_success "Workspace health check passed - no issues found"
    else
        log_warning "Workspace health check completed with $issues issues"
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
        "analyze")
            analyze_workspace "$@"
            ;;
        "filter")
            if [[ $# -lt 2 ]]; then
                log_error "Filter command requires filter type and command"
                show_help
                exit 1
            fi
            apply_filters "$@"
            ;;
        "optimize")
            optimize_workspace "$@"
            ;;
        "test")
            if [[ $# -lt 1 ]]; then
                log_error "Test command requires filter type"
                show_help
                exit 1
            fi
            run_filtered_tests "$@"
            ;;
        "build")
            if [[ $# -lt 1 ]]; then
                log_error "Build command requires filter type"
                show_help
                exit 1
            fi
            run_filtered_build "$@"
            ;;
        "dev")
            if [[ $# -lt 1 ]]; then
                log_error "Dev command requires filter type"
                show_help
                exit 1
            fi
            run_filtered_dev "$@"
            ;;
        "clean")
            if [[ $# -lt 1 ]]; then
                log_error "Clean command requires filter type"
                show_help
                exit 1
            fi
            run_filtered_clean "$@"
            ;;
        "deps")
            analyze_dependencies "$@"
            ;;
        "health")
            check_workspace_health "$@"
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