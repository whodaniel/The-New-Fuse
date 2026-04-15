#!/bin/bash

# Test Workflows Script for pnpm Monorepo
# Provides optimized testing strategies for The New Fuse project

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
MAX_WORKERS=${MAX_WORKERS:-4}
MEMORY_LIMIT=${MEMORY_LIMIT:-2048}
CI=${CI:-false}

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

# Check if pnpm is available
check_pnpm() {
    if ! command -v pnpm &> /dev/null; then
        log_error "pnpm is not installed. Please install pnpm first."
        exit 1
    fi
    log_info "Using pnpm version: $(pnpm --version)"
}

# Show available test workflows
show_help() {
    echo -e "${CYAN}Available Test Workflows:${NC}"
    echo ""
    echo "  fast        - Run fast tests (core, types, utils)"
    echo "  unit        - Run all unit tests in packages"
    echo "  integration - Run all integration tests in apps"
    echo "  changed     - Run tests for changed files since last commit"
    echo "  affected    - Run tests for packages affected by changes"
    echo "  watch       - Run tests in watch mode"
    echo "  coverage    - Run tests with coverage reporting"
    echo "  ci          - Run tests optimized for CI environment"
    echo "  parallel    - Run all tests in parallel"
    echo "  memory      - Run tests with memory optimization"
    echo "  debug       - Run tests with debug information"
    echo "  specific    - Run tests for specific package(s)"
    echo ""
    echo "Usage: $0 <workflow> [options]"
    echo ""
    echo "Examples:"
    echo "  $0 fast"
    echo "  $0 unit --verbose"
    echo "  $0 specific core api"
    echo "  $0 watch --filter=frontend"
}

# Fast tests - core packages only
run_fast_tests() {
    log_header "Running Fast Tests"
    log_info "Testing core packages: core, types, utils"
    
    pnpm --filter './packages/{core,types,utils}' \
         --parallel \
         --workspace-concurrency=$MAX_WORKERS \
         run test "$@"
    
    log_success "Fast tests completed"
}

# Unit tests - all packages
run_unit_tests() {
    log_header "Running Unit Tests"
    log_info "Testing all packages"
    
    pnpm --filter './packages/*' \
         --parallel \
         --workspace-concurrency=$MAX_WORKERS \
         run test "$@"
    
    log_success "Unit tests completed"
}

# Integration tests - all apps
run_integration_tests() {
    log_header "Running Integration Tests"
    log_info "Testing all applications"
    
    pnpm --filter './apps/*' \
         --parallel \
         --workspace-concurrency=$MAX_WORKERS \
         run test "$@"
    
    log_success "Integration tests completed"
}

# Changed files tests
run_changed_tests() {
    log_header "Running Tests for Changed Files"
    log_info "Testing packages with changes since last commit"
    
    if git diff --quiet HEAD^1; then
        log_warning "No changes detected since last commit"
        return 0
    fi
    
    pnpm --filter '[HEAD^1]' \
         --parallel \
         --workspace-concurrency=$MAX_WORKERS \
         run test "$@"
    
    log_success "Changed tests completed"
}

# Affected packages tests
run_affected_tests() {
    log_header "Running Tests for Affected Packages"
    log_info "Testing packages affected by changes since origin/main"
    
    pnpm --filter '...[origin/main]' \
         --parallel \
         --workspace-concurrency=$MAX_WORKERS \
         run test "$@"
    
    log_success "Affected tests completed"
}

# Watch mode tests
run_watch_tests() {
    log_header "Running Tests in Watch Mode"
    log_info "Starting test watchers for all packages"
    
    local filter_arg=""
    if [[ "$1" == "--filter="* ]]; then
        filter_arg="$1"
        shift
    fi
    
    if [[ -n "$filter_arg" ]]; then
        pnpm --filter "${filter_arg#--filter=}" run test:watch "$@"
    else
        pnpm -r --parallel run test:watch "$@"
    fi
}

# Coverage tests
run_coverage_tests() {
    log_header "Running Tests with Coverage"
    log_info "Generating coverage reports for all packages"
    
    pnpm -r --parallel run test:coverage "$@"
    
    log_info "Merging coverage reports..."
    # Add coverage merging logic here if needed
    
    log_success "Coverage tests completed"
}

# CI optimized tests
run_ci_tests() {
    log_header "Running CI Optimized Tests"
    log_info "Running tests with CI optimizations"
    
    export CI=true
    export NODE_ENV=test
    
    pnpm -r --workspace-concurrency=2 run test:ci "$@"
    
    log_success "CI tests completed"
}

# Parallel tests
run_parallel_tests() {
    log_header "Running All Tests in Parallel"
    log_info "Running all tests with maximum parallelization"
    
    pnpm -r --parallel run test "$@"
    
    log_success "Parallel tests completed"
}

# Memory optimized tests
run_memory_tests() {
    log_header "Running Memory Optimized Tests"
    log_info "Running tests with memory constraints"
    
    export BUILD_MEMORY_LIMIT=$MEMORY_LIMIT
    export NODE_OPTIONS="--max-old-space-size=$MEMORY_LIMIT"
    
    pnpm -r --workspace-concurrency=2 run test "$@"
    
    log_success "Memory optimized tests completed"
}

# Debug tests
run_debug_tests() {
    log_header "Running Tests with Debug Information"
    log_info "Running tests with verbose output and debugging"
    
    export JEST_VERBOSE=true
    export DEBUG=true
    
    pnpm -r --workspace-concurrency=1 run test --verbose "$@"
    
    log_success "Debug tests completed"
}

# Specific package tests
run_specific_tests() {
    local packages=("$@")
    
    if [[ ${#packages[@]} -eq 0 ]]; then
        log_error "Please specify package names"
        echo "Available packages:"
        pnpm -r list --depth=0 | grep -E "^@the-new-fuse/" | sed 's/^/@the-new-fuse\//'
        exit 1
    fi
    
    log_header "Running Tests for Specific Packages"
    log_info "Testing packages: ${packages[*]}"
    
    for package in "${packages[@]}"; do
        log_info "Testing package: $package"
        pnpm --filter "@the-new-fuse/$package" run test
    done
    
    log_success "Specific package tests completed"
}

# Main execution
main() {
    check_pnpm
    
    if [[ $# -eq 0 ]]; then
        show_help
        exit 0
    fi
    
    local workflow="$1"
    shift
    
    case "$workflow" in
        "fast")
            run_fast_tests "$@"
            ;;
        "unit")
            run_unit_tests "$@"
            ;;
        "integration")
            run_integration_tests "$@"
            ;;
        "changed")
            run_changed_tests "$@"
            ;;
        "affected")
            run_affected_tests "$@"
            ;;
        "watch")
            run_watch_tests "$@"
            ;;
        "coverage")
            run_coverage_tests "$@"
            ;;
        "ci")
            run_ci_tests "$@"
            ;;
        "parallel")
            run_parallel_tests "$@"
            ;;
        "memory")
            run_memory_tests "$@"
            ;;
        "debug")
            run_debug_tests "$@"
            ;;
        "specific")
            run_specific_tests "$@"
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            log_error "Unknown workflow: $workflow"
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"