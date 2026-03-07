#!/bin/bash

# Build Optimization Script for The New Fuse Monorepo
# This script provides various optimized build strategies

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if turbo daemon is running and start if needed
check_turbo_daemon() {
    print_status "Checking Turbo daemon..."
    if ! turbo daemon status >/dev/null 2>&1; then
        print_status "Starting Turbo daemon..."
        turbo daemon start
    else
        print_success "Turbo daemon is running"
    fi
}

# Function to clean caches
clean_cache() {
    print_status "Cleaning build caches..."
    turbo daemon stop || true
    rm -rf .turbo
    rm -rf node_modules/.cache
    find . -name 'dist' -type d -not -path './node_modules/*' -exec rm -rf {} + 2>/dev/null || true
    find . -name 'lib' -type d -not -path './node_modules/*' -exec rm -rf {} + 2>/dev/null || true
    print_success "Caches cleaned"
}

# Function to perform optimized build
optimized_build() {
    local strategy=$1
    
    print_status "Starting optimized build with strategy: $strategy"
    
    case $strategy in
        "fast")
            print_status "Running fast build (high concurrency)..."
            turbo run build --concurrency=50
            ;;
        "parallel")
            print_status "Running parallel build..."
            turbo run build --concurrency=50
            ;;
        "incremental")
            print_status "Running incremental build (changes since last commit)..."
            turbo run build --filter='[HEAD~1]' --concurrency=50
            ;;
        "affected")
            print_status "Running affected build..."
            turbo run build --affected --concurrency=50
            ;;
        "production")
            print_status "Running production build..."
            NODE_ENV=production turbo run build:production --concurrency=50
            ;;
        "watch")
            print_status "Running watch build..."
            turbo run build --watch --no-cache --concurrency=50
            ;;
        "types-first")
            print_status "Running types-first build strategy..."
            turbo run build:types --concurrency=50
            turbo run build --filter='!@the-new-fuse/types' --concurrency=50
            ;;
        "full")
            print_status "Running full clean build..."
            clean_cache
            check_turbo_daemon
            turbo run build --concurrency=50
            ;;
        *)
            print_error "Unknown strategy: $strategy"
            echo "Available strategies: fast, parallel, incremental, affected, production, watch, types-first, full"
            exit 1
            ;;
    esac
}

# Function to show build profile
show_profile() {
    print_status "Running build with profiling..."
    turbo run build --profile --timeline --concurrency=50
    print_success "Build completed. Check the generated profile for optimization insights."
}

# Function to analyze build performance
analyze_performance() {
    print_status "Analyzing build performance..."
    
    # Get turbo info
    echo "=== Turbo Configuration ==="
    turbo info
    
    echo -e "\n=== Package Count ==="
    find packages -name 'package.json' | wc -l | xargs echo "Packages:"
    find apps -name 'package.json' | wc -l | xargs echo "Apps:"
    
    echo -e "\n=== Build Dependencies ==="
    turbo run build --dry-run --graph
    
    echo -e "\n=== Cache Status ==="
    if [ -d ".turbo" ]; then
        du -sh .turbo
    else
        echo "No cache directory found"
    fi
}

# Function to optimize TypeScript builds
optimize_typescript() {
    print_status "Optimizing TypeScript configurations..."
    
    # Check for composite projects
    find . -name 'tsconfig.json' -not -path './node_modules/*' | while read -r tsconfig; do
        if grep -q '"composite": true' "$tsconfig"; then
            print_success "Composite project found: $tsconfig"
        else
            print_warning "Non-composite project: $tsconfig"
        fi
    done
    
    # Check for project references
    if [ -f "tsconfig.references.json" ]; then
        print_success "TypeScript project references configured"
    else
        print_warning "Consider setting up TypeScript project references for better incremental builds"
    fi
}

# Function to check for build bottlenecks
check_bottlenecks() {
    print_status "Checking for potential build bottlenecks..."
    
    # Check for large packages
    echo "=== Large Packages (>100MB) ==="
    find packages apps -name 'node_modules' -prune -o -type d -exec du -sm {} + 2>/dev/null | awk '$1 > 100' | sort -nr
    
    # Check for packages with many dependencies
    echo -e "\n=== Packages with Many Dependencies ==="
    find packages apps -name 'package.json' -not -path '*/node_modules/*' | while read -r pkg; do
        deps=$(jq -r '.dependencies // {} | keys | length' "$pkg" 2>/dev/null || echo 0)
        devDeps=$(jq -r '.devDependencies // {} | keys | length' "$pkg" 2>/dev/null || echo 0)
        total=$((deps + devDeps))
        if [ $total -gt 20 ]; then
            echo "$pkg: $total dependencies"
        fi
    done
}

# Main script logic
case ${1:-help} in
    "fast")
        check_turbo_daemon
        optimized_build "fast"
        ;;
    "parallel")
        check_turbo_daemon
        optimized_build "parallel"
        ;;
    "incremental")
        check_turbo_daemon
        optimized_build "incremental"
        ;;
    "affected")
        check_turbo_daemon
        optimized_build "affected"
        ;;
    "production"|"prod")
        check_turbo_daemon
        optimized_build "production"
        ;;
    "watch")
        check_turbo_daemon
        optimized_build "watch"
        ;;
    "types-first")
        check_turbo_daemon
        optimized_build "types-first"
        ;;
    "full")
        optimized_build "full"
        ;;
    "profile")
        check_turbo_daemon
        show_profile
        ;;
    "analyze")
        analyze_performance
        ;;
    "optimize-ts")
        optimize_typescript
        ;;
    "bottlenecks")
        check_bottlenecks
        ;;
    "clean")
        clean_cache
        check_turbo_daemon
        ;;
    "help"|*)
        echo "Build Optimization Script for The New Fuse"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Build Commands:"
        echo "  fast          - Fast build with high concurrency, no dependency checks"
        echo "  parallel      - Parallel build with maximum concurrency"
        echo "  incremental   - Build only packages changed since last commit"
        echo "  affected      - Build only packages affected since origin/main"
        echo "  production    - Production build with optimizations"
        echo "  watch         - Watch mode build"
        echo "  types-first   - Build types first, then other packages"
        echo "  full          - Clean build from scratch"
        echo ""
        echo "Analysis Commands:"
        echo "  profile       - Run build with profiling enabled"
        echo "  analyze       - Analyze build performance and configuration"
        echo "  optimize-ts   - Check TypeScript configuration optimization"
        echo "  bottlenecks   - Check for potential build bottlenecks"
        echo ""
        echo "Utility Commands:"
        echo "  clean         - Clean all caches and build artifacts"
        echo "  help          - Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0 fast                    # Quick build for development"
        echo "  $0 affected               # Build only changed packages"
        echo "  $0 production             # Production build"
        echo "  $0 profile                # Profile the build"
        echo "  $0 analyze                # Analyze performance"
        ;;
esac

print_success "Build optimization script completed"
