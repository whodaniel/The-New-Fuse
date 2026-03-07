#!/bin/bash

# Turbo Test Orchestrator
# Advanced test orchestration combining pnpm workspace filtering with Turbo caching

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
TURBO_CONFIG="turbo.test.json"
DEFAULT_CONCURRENCY=4
CI=${CI:-false}

# Check if turbo supports --root-turbo-json flag
TURBO_SUPPORTS_CONFIG=false
if turbo run --help 2>/dev/null | grep -q "\-\-root-turbo-json"; then
    TURBO_SUPPORTS_CONFIG=true
fi

# Helper function to run turbo with or without config
run_turbo() {
    local task="$1"
    shift
    
    if [[ "$TURBO_SUPPORTS_CONFIG" == "true" ]]; then
        turbo run "$task" --root-turbo-json="$TURBO_CONFIG" "$@"
    else
        # Fallback to default turbo.json
        turbo run "$task" "$@"
    fi
}

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
    if ! command -v turbo &> /dev/null; then
        log_error "Turbo is not installed. Please install turbo first."
        exit 1
    fi
    
    if ! command -v pnpm &> /dev/null; then
        log_error "pnpm is not installed. Please install pnpm first."
        exit 1
    fi
    
    if [[ ! -f "$TURBO_CONFIG" ]]; then
        log_error "Turbo test configuration not found: $TURBO_CONFIG"
        exit 1
    fi
    
    log_info "Prerequisites check passed"
}

# Show available orchestration strategies
show_help() {
    echo -e "${CYAN}Turbo Test Orchestrator${NC}"
    echo ""
    echo "Orchestration Strategies:"
    echo "  smart       - Intelligent test execution based on changes"
    echo "  parallel    - Maximum parallelization with Turbo + pnpm"
    echo "  sequential  - Sequential execution for debugging"
    echo "  staged      - Multi-stage test execution"
    echo "  affected    - Test only affected packages"
    echo "  incremental - Incremental testing with smart caching"
    echo "  ci          - CI-optimized test execution"
    echo "  watch       - Watch mode with intelligent rebuilds"
    echo ""
    echo "Test Types:"
    echo "  unit        - Unit tests only"
    echo "  integration - Integration tests only"
    echo "  e2e         - End-to-end tests only"
    echo "  all         - All test types"
    echo ""
    echo "Usage: $0 <strategy> [test-type] [options]"
    echo ""
    echo "Examples:"
    echo "  $0 smart unit"
    echo "  $0 parallel all --verbose"
    echo "  $0 affected integration"
    echo "  $0 ci all --coverage"
}

# Smart test execution
run_smart_tests() {
    local test_type=${1:-"all"}
    shift || true
    
    log_header "Smart Test Execution"
    
    # Check for changes
    if git diff --quiet HEAD^1; then
        log_info "No changes detected, running fast tests only"
        run_fast_tests "$test_type" "$@"
        return
    fi
    
    # Get changed packages
    local changed_packages=$(git diff --name-only HEAD^1 | grep -E '^(packages|apps)/' | cut -d'/' -f1-2 | sort -u)
    
    if [[ -z "$changed_packages" ]]; then
        log_info "No package changes detected, running core tests"
        run_core_tests "$test_type" "$@"
        return
    fi
    
    log_info "Changed packages detected: $changed_packages"
    
    # Run tests for changed packages and their dependents
    case "$test_type" in
        "unit")
            run_turbo test:unit --filter="[HEAD^1]" --filter="...[HEAD^1]" "$@"
            ;;
        "integration")
            run_turbo test:integration --filter="[HEAD^1]" --filter="...[HEAD^1]" "$@"
            ;;
        "e2e")
            run_turbo test:e2e --filter="[HEAD^1]" --filter="...[HEAD^1]" "$@"
            ;;
        "all"|*)
            run_turbo test --filter="[HEAD^1]" --filter="...[HEAD^1]" "$@"
            ;;
    esac
    
    log_success "Smart test execution completed"
}

# Parallel test execution
run_parallel_tests() {
    local test_type=${1:-"all"}
    shift || true
    
    log_header "Parallel Test Execution"
    
    local concurrency=$DEFAULT_CONCURRENCY
    if [[ "$CI" == "true" ]]; then
        concurrency=2
    fi
    
    case "$test_type" in
        "unit")
            run_turbo test:unit --concurrency="$concurrency" "$@"
            ;;
        "integration")
            run_turbo test:integration --concurrency="$concurrency" "$@"
            ;;
        "e2e")
            run_turbo test:e2e --concurrency=1 "$@"
            ;;
        "all"|*)
            run_turbo test --concurrency="$concurrency" "$@"
            ;;
    esac
    
    log_success "Parallel test execution completed"
}

# Sequential test execution
run_sequential_tests() {
    local test_type=${1:-"all"}
    shift || true
    
    log_header "Sequential Test Execution"
    
    case "$test_type" in
        "unit")
            run_turbo test:unit --concurrency=1 "$@"
            ;;
        "integration")
            run_turbo test:integration --concurrency=1 "$@"
            ;;
        "e2e")
            run_turbo test:e2e --concurrency=1 "$@"
            ;;
        "all"|*)
            log_info "Running unit tests..."
            run_turbo test:unit --concurrency=1 "$@"
            
            log_info "Running integration tests..."
            run_turbo test:integration --concurrency=1 "$@"
            
            log_info "Running e2e tests..."
            run_turbo test:e2e --concurrency=1 "$@"
            ;;
    esac
    
    log_success "Sequential test execution completed"
}

# Staged test execution
run_staged_tests() {
    local test_type=${1:-"all"}
    shift || true
    
    log_header "Staged Test Execution"
    
    # Stage 1: Core packages
    log_info "Stage 1: Testing core packages"
    run_turbo test:fast --filter="./packages/{core,types,utils}" "$@"
    
    # Stage 2: Other packages
    log_info "Stage 2: Testing other packages"
    run_turbo test --filter="./packages/*" --filter="!./packages/{core,types,utils}" "$@"
    
    # Stage 3: Applications (if all tests)
    if [[ "$test_type" == "all" || "$test_type" == "integration" ]]; then
        log_info "Stage 3: Testing applications"
        run_turbo test:integration --filter="./apps/*" "$@"
    fi
    
    # Stage 4: E2E tests (if requested)
    if [[ "$test_type" == "all" || "$test_type" == "e2e" ]]; then
        log_info "Stage 4: Running E2E tests"
        run_turbo test:e2e "$@"
    fi
    
    log_success "Staged test execution completed"
}

# Affected packages testing
run_affected_tests() {
    local test_type=${1:-"all"}
    shift || true
    
    log_header "Affected Packages Testing"
    
    case "$test_type" in
        "unit")
            run_turbo test:affected --filter="...[origin/main]" "$@"
            ;;
        "integration")
            run_turbo test:integration --filter="...[origin/main]" "$@"
            ;;
        "e2e")
            run_turbo test:e2e --filter="...[origin/main]" "$@"
            ;;
        "all"|*)
            run_turbo test:affected --filter="...[origin/main]" "$@"
            ;;
    esac
    
    log_success "Affected packages testing completed"
}

# Incremental testing
run_incremental_tests() {
    local test_type=${1:-"all"}
    shift || true
    
    log_header "Incremental Testing"
    
    # Use Turbo's caching to skip unchanged packages
    case "$test_type" in
        "unit")
            run_turbo test:unit "$@"
            ;;
        "integration")
            run_turbo test:integration "$@"
            ;;
        "e2e")
            run_turbo test:e2e "$@"
            ;;
        "all"|*)
            run_turbo test "$@"
            ;;
    esac
    
    log_success "Incremental testing completed"
}

# CI-optimized testing
run_ci_tests() {
    local test_type=${1:-"all"}
    shift || true
    
    log_header "CI-Optimized Testing"
    
    export CI=true
    export NODE_ENV=test
    
    case "$test_type" in
        "unit")
            run_turbo test:ci --filter="./packages/*" "$@"
            ;;
        "integration")
            run_turbo test:integration --filter="./apps/*" "$@"
            ;;
        "e2e")
            run_turbo test:e2e --concurrency=1 "$@"
            ;;
        "all"|*)
            # Run in stages for CI
            run_turbo test:ci --filter="./packages/*" "$@"
            run_turbo test:integration --filter="./apps/*" "$@"
            run_turbo test:e2e --concurrency=1 "$@"
            ;;
    esac
    
    log_success "CI-optimized testing completed"
}

# Watch mode testing
run_watch_tests() {
    local test_type=${1:-"all"}
    shift || true
    
    log_header "Watch Mode Testing"
    
    case "$test_type" in
        "unit")
            run_turbo test:watch --filter="./packages/*" "$@"
            ;;
        "integration")
            run_turbo test:watch --filter="./apps/*" "$@"
            ;;
        "all"|*)
            run_turbo test:watch "$@"
            ;;
    esac
}

# Fast tests (core packages only)
run_fast_tests() {
    local test_type=${1:-"unit"}
    shift || true
    
    log_header "Fast Tests"
    
    run_turbo test:fast --filter="./packages/{core,types,utils}" "$@"
    
    log_success "Fast tests completed"
}

# Core tests
run_core_tests() {
    local test_type=${1:-"unit"}
    shift || true
    
    log_header "Core Tests"
    
    run_turbo test --filter="./packages/{core,types,utils,shared}" "$@"
    
    log_success "Core tests completed"
}

# Main execution
main() {
    check_prerequisites
    
    if [[ $# -eq 0 ]]; then
        show_help
        exit 0
    fi
    
    local strategy="$1"
    shift
    
    case "$strategy" in
        "smart")
            run_smart_tests "$@"
            ;;
        "parallel")
            run_parallel_tests "$@"
            ;;
        "sequential")
            run_sequential_tests "$@"
            ;;
        "staged")
            run_staged_tests "$@"
            ;;
        "affected")
            run_affected_tests "$@"
            ;;
        "incremental")
            run_incremental_tests "$@"
            ;;
        "ci")
            run_ci_tests "$@"
            ;;
        "watch")
            run_watch_tests "$@"
            ;;
        "fast")
            run_fast_tests "$@"
            ;;
        "core")
            run_core_tests "$@"
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            log_error "Unknown strategy: $strategy"
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"