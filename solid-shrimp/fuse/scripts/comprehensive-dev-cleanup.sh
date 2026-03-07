#!/bin/bash

# Comprehensive Development Environment Cleanup Script
# Cleans processes, ports, build artifacts, and temporary files

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}🔧${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

echo -e "${BLUE}🧹 Comprehensive Development Environment Cleanup${NC}"
echo "This script will:"
echo "  • Kill running development processes"
echo "  • Clear occupied ports"
echo "  • Remove build artifacts and caches"
echo "  • Clean temporary files"
echo "  • Optimize disk space"
echo ""

# Ask for cleanup level
echo "Choose cleanup level:"
echo "  1) Standard cleanup (keeps node_modules)"
echo "  2) Deep cleanup (removes node_modules, requires reinstall)"
echo "  3) Process cleanup only (just kill processes and clear ports)"
echo ""
read -p "Enter choice (1-3): " -n 1 -r cleanup_level
echo ""

if [[ ! $cleanup_level =~ ^[1-3]$ ]]; then
    print_error "Invalid choice. Exiting."
    exit 1
fi

# Function to safely remove directories with size reporting
safe_remove() {
    local path="$1"
    local description="$2"
    
    if [ -d "$path" ]; then
        local size=$(du -sh "$path" 2>/dev/null | cut -f1 || echo "unknown")
        print_status "Removing $description ($size): $path"
        rm -rf "$path"
    fi
}

# Function to remove files matching pattern
remove_files() {
    local pattern="$1"
    local description="$2"
    
    print_status "Removing $description..."
    find . -name "$pattern" -type f -delete 2>/dev/null || true
}

# Function to remove directories matching pattern
remove_dirs() {
    local pattern="$1"
    local description="$2"
    
    print_status "Removing $description..."
    find . -name "$pattern" -type d -exec rm -rf {} + 2>/dev/null || true
}

# Function to kill processes by name
kill_processes() {
    local process_name="$1"
    local description="$2"
    
    local pids=$(pgrep -f "$process_name" 2>/dev/null || true)
    if [ -n "$pids" ]; then
        print_status "Killing $description processes..."
        echo "$pids" | xargs kill -TERM 2>/dev/null || true
        sleep 2
        # Force kill if still running
        local remaining_pids=$(pgrep -f "$process_name" 2>/dev/null || true)
        if [ -n "$remaining_pids" ]; then
            echo "$remaining_pids" | xargs kill -KILL 2>/dev/null || true
        fi
        print_success "$description processes terminated"
    fi
}

# Function to clear specific ports
clear_port() {
    local port="$1"
    local description="$2"
    
    local pid=$(lsof -ti:$port 2>/dev/null || true)
    if [ -n "$pid" ]; then
        print_status "Clearing port $port ($description)..."
        kill -TERM $pid 2>/dev/null || true
        sleep 1
        # Force kill if still running
        local remaining_pid=$(lsof -ti:$port 2>/dev/null || true)
        if [ -n "$remaining_pid" ]; then
            kill -KILL $remaining_pid 2>/dev/null || true
        fi
        print_success "Port $port cleared"
    fi
}

print_status "Current space usage:"
du -sh . 2>/dev/null || echo "Could not calculate current size"
echo ""

# STEP 1: Process and Port Cleanup (always done)
print_status "🔄 Killing development processes..."

# Kill common development processes
kill_processes "node.*dev" "Node.js development"
kill_processes "node.*start" "Node.js start"
kill_processes "bun.*dev" "Bun development"
kill_processes "yarn.*dev" "Yarn development"
kill_processes "npm.*dev" "NPM development"
kill_processes "turbo.*dev" "Turbo development"
kill_processes "webpack" "Webpack"
kill_processes "vite" "Vite"
kill_processes "next" "Next.js"
kill_processes "electron" "Electron"
kill_processes "ide" "SkIDEancer IDE"

# Clear common development ports
print_status "🔌 Clearing development ports..."
clear_port 3000 "Frontend App"
clear_port 3001 "API Server"
clear_port 3002 "Backend App"
clear_port 3003 "Message Broker"
clear_port 3004 "Backend API"
clear_port 3005 "API Gateway"
clear_port 3006 "A2A Service"
clear_port 3007 "SkIDEancer IDE"
clear_port 8080 "Browser Hub"
clear_port 8081 "Development Server"
clear_port 5173 "Vite Dev Server"
clear_port 4200 "Angular Dev Server"

# Clear any remaining processes on these ports
for port in 3000 3001 3002 3003 3004 3005 3006 3007 8080 8081 5173 4200; do
    clear_port $port "Port $port"
done

print_success "Process and port cleanup complete"

# Exit if only process cleanup was requested
if [ "$cleanup_level" = "3" ]; then
    print_success "Process cleanup complete. Development environment ready."
    exit 0
fi

# STEP 2: File System Cleanup
print_status "🗑️  Cleaning build artifacts and caches..."

# Remove Turbo cache
safe_remove ".turbo" "Turbo cache"
remove_dirs ".turbo" "nested Turbo caches"

# Remove TypeScript build outputs
remove_dirs "dist" "TypeScript dist folders"
remove_dirs "lib" "lib folders"
safe_remove "apps/ide-ide/lib" "SkIDEancer IDE lib folder"
safe_remove "apps/ide-ide/src-gen" "SkIDEancer IDE generated sources"

# Remove test coverage and artifacts
remove_dirs "coverage" "test coverage reports"
remove_dirs ".nyc_output" "NYC coverage output"
remove_dirs "test-results" "test results"
remove_dirs "playwright-report" "Playwright reports"

# Remove logs and temporary files
print_status "📝 Cleaning logs and temporary files..."
remove_files "*.log" "log files"
remove_files "npm-debug.log*" "npm debug logs"
remove_files "yarn-debug.log*" "yarn debug logs"
remove_files "yarn-error.log*" "yarn error logs"
remove_files "bun-debug.log*" "bun debug logs"
remove_files "*.tmp" "temporary files"
remove_files "*.temp" "temp files"
remove_files ".DS_Store" "macOS .DS_Store files"

# Remove development caches
print_status "🔧 Cleaning development caches..."
remove_dirs ".cache" "cache directories"
remove_dirs ".parcel-cache" "Parcel cache"
remove_dirs ".next" "Next.js cache"
remove_dirs ".nuxt" "Nuxt cache"
remove_dirs ".vite" "Vite cache"
remove_dirs ".webpack" "Webpack cache"
remove_dirs ".rollup.cache" "Rollup cache"
remove_dirs ".babel-cache" "Babel cache"
remove_dirs ".swc" "SWC cache"
remove_dirs ".jest" "Jest cache"
remove_dirs "node_modules/.vitest" "Vitest cache"
remove_dirs "node_modules/.cache" "Node modules cache"

# Remove linter/formatter caches
remove_files ".eslintcache" "ESLint cache"
remove_files ".prettiercache" "Prettier cache"
remove_files ".stylelintcache" "Stylelint cache"

# Remove TypeScript build info
remove_files "*.tsbuildinfo" "TypeScript build info"
remove_files "tsconfig.tsbuildinfo" "TypeScript config build info"

# Remove IDE artifacts
print_status "🎯 Cleaning IDE and editor artifacts..."
remove_files "*.swp" "Vim swap files"
remove_files "*.swo" "Vim swap files"
remove_files "*~" "editor backup files"
remove_files ".vscode/settings.json.bak" "VS Code backup settings"

# STEP 3: Deep cleanup (if requested)
if [ "$cleanup_level" = "2" ]; then
    print_warning "🚨 Deep cleanup mode - removing node_modules..."
    
    # Remove all node_modules directories
    find . -name "node_modules" -type d -prune -exec rm -rf {} + 2>/dev/null || true
    
    # Remove lock files (will be regenerated)
    safe_remove "yarn.lock" "Yarn lock file"
    safe_remove "package-lock.json" "NPM lock file"
    safe_remove "pnpm-lock.yaml" "PNPM lock file"
    safe_remove "bun.lockb" "Bun lock file"
    
    # Remove Yarn cache and state
    safe_remove ".yarn/cache" "Yarn cache"
    safe_remove ".yarn/install-state.gz" "Yarn install state"
    safe_remove ".yarn/unplugged" "Yarn unplugged"
    safe_remove ".pnp.cjs" "Yarn PnP file"
    safe_remove ".pnp.loader.mjs" "Yarn PnP loader"
    
    print_warning "Deep cleanup complete - you'll need to run 'pnpm install' to restore dependencies"
fi

# Final cleanup
print_status "🔍 Final cleanup - removing empty directories..."
find . -type d -empty -delete 2>/dev/null || true

print_success "Cleanup complete!"
echo ""
print_status "📊 New space usage:"
du -sh . 2>/dev/null || echo "Could not calculate new size"

echo ""
print_status "🔄 Next steps:"
if [ "$cleanup_level" = "2" ]; then
    echo "  1. Run: pnpm install"
    echo "  2. Run: pnpm run build (if needed)"
    echo "  3. Run: pnpm run dev"
else
    echo "  1. Run: pnpm run dev (should start cleanly)"
    echo "  2. All processes and ports have been cleared"
fi

echo ""
print_status "💡 Additional maintenance tips:"
echo "  • Run this script regularly to keep your dev environment clean"
echo "  • Use 'pnpm run clear-ports' for quick port cleanup"
echo "  • Monitor disk usage with 'du -sh .' in project root"
echo "  • Consider using 'pnpm install --frozen-lockfile' for consistent installs"

print_success "Development environment cleanup complete! 🎉"