#!/bin/bash

# TypeScript Import Fix Script for The New Fuse Monorepo
# Fixes common import extension issues across packages

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Function to fix import extensions in TypeScript files
fix_import_extensions() {
    local dir=$1
    print_status "Fixing import extensions in $dir..."
    
    # Find all TypeScript files
    find "$dir" -name "*.ts" -o -name "*.tsx" | while read -r file; do
        # Skip node_modules and dist directories
        if [[ "$file" == *"node_modules"* ]] || [[ "$file" == *"dist"* ]]; then
            continue
        fi
        
        # Fix .tsx extensions in imports
        if grep -q "\.tsx'" "$file" 2>/dev/null; then
            print_status "Fixing .tsx imports in $file"
            sed -i '' "s/from '\([^']*\)\.tsx'/from '\1'/g" "$file"
            sed -i '' 's/from "\([^"]*\)\.tsx"/from "\1"/g' "$file"
        fi
        
        # Fix .jsx extensions in imports
        if grep -q "\.jsx'" "$file" 2>/dev/null; then
            print_status "Fixing .jsx imports in $file"
            sed -i '' "s/from '\([^']*\)\.jsx'/from '\1'/g" "$file"
            sed -i '' 's/from "\([^"]*\)\.jsx"/from "\1"/g' "$file"
        fi
        
        # Fix .js extensions in imports (for TypeScript files)
        if grep -q "\.js'" "$file" 2>/dev/null; then
            print_status "Fixing .js imports in $file"
            sed -i '' "s/from '\([^']*\)\.js'/from '\1'/g" "$file"
            sed -i '' 's/from "\([^"]*\)\.js"/from "\1"/g' "$file"
        fi
        
        # Fix index.tsx/index.js imports
        if grep -q "index\.tsx'" "$file" 2>/dev/null || grep -q "index\.js'" "$file" 2>/dev/null; then
            print_status "Fixing index imports in $file"
            sed -i '' "s/from '\([^']*\)\/index\.tsx'/from '\1'/g" "$file"
            sed -i '' "s/from '\([^']*\)\/index\.js'/from '\1'/g" "$file"
            sed -i '' 's/from "\([^"]*\/index\)\.tsx"/from "\1"/g' "$file"
            sed -i '' 's/from "\([^"]*\/index\)\.js"/from "\1"/g' "$file"
        fi
    done
}

# Function to fix tsconfig tsBuildInfoFile conflicts
fix_tsbuildinfo_conflicts() {
    print_status "Fixing tsBuildInfoFile conflicts..."
    
    find packages apps -name "tsconfig.json" | while read -r tsconfig; do
        # Skip if file doesn't exist or is in node_modules
        if [[ ! -f "$tsconfig" ]] || [[ "$tsconfig" == *"node_modules"* ]]; then
            continue
        fi
        
        # Get the package name from the path
        package_dir=$(dirname "$tsconfig")
        package_name=$(basename "$package_dir")
        
        # Check if tsconfig has composite: true but no tsBuildInfoFile
        if grep -q '"composite": true' "$tsconfig" && ! grep -q '"tsBuildInfoFile"' "$tsconfig"; then
            print_status "Adding tsBuildInfoFile to $tsconfig"
            
            # Add tsBuildInfoFile after composite
            sed -i '' '/"composite": true/a\
    "tsBuildInfoFile": "./dist/.tsbuildinfo",
' "$tsconfig"
        fi
    done
}

# Function to fix Redis import issues
fix_redis_imports() {
    print_status "Fixing Redis import issues..."
    
    find . -name "*.ts" -o -name "*.tsx" | xargs grep -l "import.*Redis.*from.*ioredis" 2>/dev/null | while read -r file; do
        print_status "Fixing Redis import in $file"
        
        # Fix default import
        sed -i '' 's/import Redis from "ioredis"/import { Redis } from "ioredis"/g' "$file"
        sed -i '' "s/import Redis from 'ioredis'/import { Redis } from 'ioredis'/g" "$file"
        
        # Fix destructured default import
        sed -i '' 's/import { default: Redis }/import { Redis }/g' "$file"
    done
}

# Function to validate fixes
validate_fixes() {
    print_status "Validating TypeScript compilation..."
    
    # Run TypeScript compiler to check for errors
    if command -v tsc >/dev/null 2>&1; then
        tsc --noEmit --skipLibCheck || print_warning "TypeScript compilation has remaining issues"
    else
        print_warning "TypeScript compiler not found, skipping validation"
    fi
}

# Main execution
case ${1:-all} in
    "imports")
        print_status "Fixing import extensions..."
        fix_import_extensions "packages"
        fix_import_extensions "apps"
        ;;
    "tsbuildinfo")
        fix_tsbuildinfo_conflicts
        ;;
    "redis")
        fix_redis_imports
        ;;
    "validate")
        validate_fixes
        ;;
    "all")
        print_status "Running all TypeScript fixes..."
        fix_import_extensions "packages"
        fix_import_extensions "apps"
        fix_tsbuildinfo_conflicts
        fix_redis_imports
        validate_fixes
        ;;
    "help"|*)
        echo "TypeScript Fix Script for The New Fuse"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  imports       - Fix import extension issues (.tsx, .jsx, .js)"
        echo "  tsbuildinfo   - Fix tsBuildInfoFile conflicts"
        echo "  redis         - Fix Redis import issues"
        echo "  validate      - Validate TypeScript compilation"
        echo "  all           - Run all fixes (default)"
        echo "  help          - Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0 imports                # Fix only import extensions"
        echo "  $0 all                    # Fix all issues"
        echo "  $0 validate               # Check compilation"
        ;;
esac

print_success "TypeScript fix script completed"
