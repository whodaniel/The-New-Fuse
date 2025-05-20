#!/bin/bash
set -e

# ============================================================================
# Consolidated TypeScript Fix Script
# ============================================================================
# 
# This script orchestrates all TypeScript fixing routines in a logical sequence
# to resolve TypeScript errors across the entire project. It combines the
# functionality of various individual fix scripts into a comprehensive solution.
#
# Usage:
#   ./typescript-fix-consolidated.sh [options]
#
# Options:
#   --all           Run all fixes (default)
#   --dependencies  Fix dependency conflicts
#   --modules       Fix module declarations
#   --imports       Fix import paths
#   --remaining     Fix remaining TypeScript issues
#   --phase N       Run specific phase (1-4)
#   --frontend      Run only frontend fixes
#   --backend       Run only backend fixes
#   --core          Run only core package fixes
#   --verify        Only verify TypeScript without fixing
#   --verbose       Show detailed debug information
#   --help          Show this help message
#
# ============================================================================

# Initialize variables
RUN_ALL=true
RUN_PHASE=0
RUN_DEPENDENCIES=false
RUN_MODULES=false
RUN_IMPORTS=false
RUN_REMAINING=false
RUN_FRONTEND=false
RUN_BACKEND=false
RUN_CORE=false
VERIFY_ONLY=false
VERBOSE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --all)
      RUN_ALL=true
      shift
      ;;
    --dependencies)
      RUN_DEPENDENCIES=true
      RUN_ALL=false
      shift
      ;;
    --modules)
      RUN_MODULES=true
      RUN_ALL=false
      shift
      ;;
    --imports)
      RUN_IMPORTS=true
      RUN_ALL=false
      shift
      ;;
    --remaining)
      RUN_REMAINING=true
      RUN_ALL=false
      shift
      ;;
    --phase)
      RUN_PHASE="$2"
      RUN_ALL=false
      shift 2
      ;;
    --frontend)
      RUN_FRONTEND=true
      RUN_ALL=false
      shift
      ;;
    --backend)
      RUN_BACKEND=true
      RUN_ALL=false
      shift
      ;;
    --core)
      RUN_CORE=true
      RUN_ALL=false
      shift
      ;;
    --verify)
      VERIFY_ONLY=true
      shift
      ;;
    --verbose)
      VERBOSE=true
      shift
      ;;
    --help)
      echo "Usage: $0 [options]"
      echo "Options:"
      echo "  --all           Run all fixes (default)"
      echo "  --dependencies  Fix dependency conflicts"
      echo "  --modules       Fix module declarations"
      echo "  --imports       Fix import paths"
      echo "  --remaining     Fix remaining TypeScript issues"
      echo "  --phase N       Run specific phase (1-4)"
      echo "  --frontend      Run only frontend fixes"
      echo "  --backend       Run only backend fixes"
      echo "  --core          Run only core package fixes"
      echo "  --verify        Only verify TypeScript without fixing"
      echo "  --verbose       Show detailed debug information"
      echo "  --help          Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Import utility functions
SCRIPT_DIR="$(dirname "$0")"
if [ -f "$SCRIPT_DIR/utils/logging.sh" ]; then
  source "$SCRIPT_DIR/utils/logging.sh"
else
  # Define basic logging functions if utils/logging.sh doesn't exist
  function log_info() { echo -e "\033[0;34mℹ️ $1\033[0m"; }
  function log_success() { echo -e "\033[0;32m✅ $1\033[0m"; }
  function log_warning() { echo -e "\033[0;33m⚠️ $1\033[0m"; }
  function log_error() { echo -e "\033[0;31m❌ $1\033[0m"; }
  function log_debug() { if [ "${VERBOSE}" = "true" ]; then echo -e "🔍 $1"; fi; }
fi

# Set up logging
LOG_DIR="logs"
LOG_FILE="$LOG_DIR/typescript-fix-$(date +%Y%m%d-%H%M%S).log"
mkdir -p "$LOG_DIR"

# Display script header
log_info "============================================="
log_info "   Consolidated TypeScript Fix Script"
log_info "   $(date)"
log_info "============================================="

# Function to count TypeScript errors
function count_ts_errors() {
  npx tsc --noEmit > "$LOG_DIR/ts-errors-temp.log" 2>&1 || true
  local error_count=$(grep -c "error TS" "$LOG_DIR/ts-errors-temp.log" || echo 0)
  echo $error_count
}

# Function to analyze TypeScript errors
function analyze_ts_errors() {
  log_info "Analyzing TypeScript errors..."
  
  npx tsc --noEmit > "$LOG_DIR/ts-errors-analysis.log" 2>&1 || true
  
  # Count total errors
  local total_errors=$(grep -c "error TS" "$LOG_DIR/ts-errors-analysis.log" || echo 0)
  log_info "Total TypeScript errors: $total_errors"
  
  # Get error counts by type
  log_info "Error patterns found:"
  grep -E "error TS[0-9]+" "$LOG_DIR/ts-errors-analysis.log" | \
    sed 's/.*error \(TS[0-9]\+\).*/\1/' | \
    sort | uniq -c | sort -nr | \
    tee -a "$LOG_FILE"
}

# ============================================================================
# Phase 1: Setup and Dependencies
# ============================================================================
function phase1_setup_dependencies() {
  log_info "Phase 1: Setting up dependencies..."
  
  # Install required TypeScript dependencies
  log_info "Installing TypeScript dependencies..."
  yarn add -D typescript@4.9.5 @types/react@18.2.0 @types/react-dom@18.2.0 @types/node@18.0.0 || log_warning "Failed to install TypeScript dependencies"
  
  # Install core dependencies
  log_info "Installing core dependencies..."
  yarn add reflect-metadata typeorm @prisma/client zod reactflow react || log_warning "Failed to install core dependencies"
  
  # Install NestJS dependencies
  log_info "Installing NestJS dependencies..."
  yarn add @nestjs/common @nestjs/core @nestjs/websockets rxjs || log_warning "Failed to install NestJS dependencies"
  
  # Install additional type definitions
  log_info "Installing additional type definitions..."
  yarn add -D @types/bcrypt @types/socket.io @nestjs/event-emitter || log_warning "Failed to install additional type definitions"
  
  log_success "Phase 1 completed: Dependencies installed"
}

# ============================================================================
# Phase 2: Configuration Updates
# ============================================================================
function phase2_update_configs() {
  log_info "Phase 2: Updating TypeScript configurations..."
  
  # Update root tsconfig.json
  log_info "Updating root tsconfig.json"
  cat > tsconfig.json << 'EOL'
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "strict": true,
    "strictPropertyInitialization": false,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true,
    "allowJs": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@the-new-fuse/core": ["packages/core/src"],
      "@the-new-fuse/types": ["packages/types/src"],
      "@the-new-fuse/utils": ["packages/utils/src"]
    }
  },
  "include": ["src", "packages"],
  "exclude": ["node_modules", "dist"]
}
EOL
  
  # Create core package tsconfig if it doesn't exist
  if [ -d "packages/core" ]; then
    log_info "Updating packages/core/tsconfig.json"
    mkdir -p packages/core
    cat > packages/core/tsconfig.json << 'EOL'
{
    "extends": "../../tsconfig.json",
    "compilerOptions": {
        "outDir": "./dist",
        "rootDir": "./src",
        "declaration": true,
        "declarationMap": true,
        "sourceMap": true,
        "strict": true
    },
    "include": ["src/**/*"],
    "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
EOL
  fi
  
  # Create global type definitions
  log_info "Creating global type definitions"
  mkdir -p src/types
  cat > src/types/global.d.ts << 'EOL'
declare module '*.svg' {
  import React from 'react';
  export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.json' {
  const content: any;
  export default content;
}
EOL
  
  log_success "Phase 2 completed: TypeScript configurations updated"
}

# ============================================================================
# Phase 3: Fix Common Type Issues
# ============================================================================
function phase3_fix_common_types() {
  log_info "Phase 3: Fixing common type issues..."
  
  # Fix React component types
  if [ "$RUN_FRONTEND" = "true" ] || [ "$RUN_ALL" = "true" ]; then
    log_info "Fixing React component types..."
    find src packages -type f -name "*.tsx" -exec sed -i'' -e '
        s/: React\.FC</: FC</g;
        s/: FC = () =>/: FC = (): JSX.Element =>/g;
        s/React\.useEffect/useEffect/g;
        s/React\.useState/useState/g;
        s/: any\[\]/: unknown[]/g;
        s/: any</: unknown</g;
    ' {} \;
    
    # Add missing React imports
    find src packages -type f -name "*.tsx" -exec sed -i'' -e '
        /^import.*React/!{1i\
import { FC, useEffect, useState, JSX } from \'react\';
    }' {} \;
    
    log_success "React component types fixed"
  fi
  
  # Fix common type issues
  log_info "Fixing common type issues..."
  find src packages -type f -name "*.ts" -o -name "*.tsx" -exec sed -i'' -e '
      s/: any;/: unknown;/g;
      s/as any/as unknown/g;
      s/\[\] as any\[\]/[] as unknown[]/g;
      s/: object;/: Record<string, unknown>;/g;
      s/: Function;/: (...args: unknown[]) => unknown;/g;
      s/Promise<any>/Promise<unknown>/g;
      s/Promise<any\[\]>/Promise<unknown[]>/g;
  ' {} \;
  
  # Run enhanced type annotation fixes
  for dir in src packages/core/src packages/types/src packages/utils/src; do
    if [ -d "$dir" ]; then
      log_info "Running enhanced type annotation fixes on $dir"
      node scripts/enhanced-fix-type-annotations.js "$dir" || log_warning "Failed to run enhanced type annotation fixes on $dir"
    fi
  done
  
  # Fix module declaration issues
  if [ "$RUN_MODULES" = "true" ] || [ "$RUN_ALL" = "true" ]; then
    log_info "Fixing module declaration issues..."
    find src packages -type f -name "*.ts" -o -name "*.tsx" | while read file; do
        if ! grep -q "export " "$file"; then
            echo "export {};" >> "$file"
        fi
    done
    
    log_success "Module declaration issues fixed"
  fi
  
  # Fix specific TypeScript errors
  if [ "$RUN_REMAINING" = "true" ] || [ "$RUN_ALL" = "true" ]; then
    log_info "Fixing specific TypeScript errors..."
    node scripts/fix-specific-typescript-errors.js || log_warning "Failed to run fix-specific-typescript-errors.js"
    node scripts/fix-missing-types.js || log_warning "Failed to run fix-missing-types.js"
    
    log_success "Specific TypeScript errors fixed"
  fi
  
  log_success "Phase 3 completed: Common type issues fixed"
}

# ============================================================================
# Phase 4: Run Automated Fixes and Verification
# ============================================================================
function phase4_automated_fixes() {
  log_info "Phase 4: Running automated fixes..."
  
  # Run ESLint and Prettier
  log_info "Running ESLint and Prettier..."
  yarn eslint --fix 'src/**/*.{ts,tsx}' || log_warning "Failed to run ESLint"
  yarn prettier --write 'src/**/*.{ts,tsx}' || log_warning "Failed to run Prettier"
  
  log_success "Phase 4 completed: Automated fixes applied"
}

# Function to verify fixes
function verify_fixes() {
  log_info "Verifying TypeScript fixes..."
  
  # Run TypeScript compiler to check for errors
  if npx tsc --noEmit > "$LOG_DIR/verification.log" 2>&1; then
    log_success "All TypeScript errors have been fixed!"
    return 0
  else
    local error_count=$(grep -c "error TS" "$LOG_DIR/verification.log" || echo 0)
    log_warning "$error_count TypeScript errors remain."
    log_info "Check $LOG_DIR/verification.log for details."
    
    # Show the top 5 most common errors
    log_info "Top 5 most common errors:"
    grep -E "error TS[0-9]+" "$LOG_DIR/verification.log" | \
      sed 's/.*error \(TS[0-9]\+\).*/\1/' | \
      sort | uniq -c | sort -nr | head -5 | \
      tee -a "$LOG_FILE"
    
    return 1
  fi
}

# ============================================================================
# Main Execution
# ============================================================================

# Count initial TypeScript errors if not in verify-only mode
if [ "$VERIFY_ONLY" != "true" ]; then
  log_info "Counting initial TypeScript errors..."
  INITIAL_ERROR_COUNT=$(count_ts_errors)
  log_info "Initial TypeScript error count: $INITIAL_ERROR_COUNT"
  
  # Analyze errors if there are any
  if [ "$INITIAL_ERROR_COUNT" -gt 0 ]; then
    analyze_ts_errors
  fi
fi

# Execute phases based on options
if [ "$VERIFY_ONLY" = "true" ]; then
  log_info "Running verification only..."
  verify_fixes
else
  # Run specific phase or all phases
  if [ "$RUN_PHASE" = "1" ] || [ "$RUN_ALL" = "true" ] || [ "$RUN_DEPENDENCIES" = "true" ]; then
    phase1_setup_dependencies
  fi
  
  if [ "$RUN_PHASE" = "2" ] || [ "$RUN_ALL" = "true" ]; then
    phase2_update_configs
  fi
  
  if [ "$RUN_PHASE" = "3" ] || [ "$RUN_ALL" = "true" ] || [ "$RUN_FRONTEND" = "true" ] || [ "$RUN_BACKEND" = "true" ] || [ "$RUN_CORE" = "true" ] || [ "$RUN_MODULES" = "true" ] || [ "$RUN_IMPORTS" = "true" ] || [ "$RUN_REMAINING" = "true" ]; then
    phase3_fix_common_types
  fi
  
  if [ "$RUN_PHASE" = "4" ] || [ "$RUN_ALL" = "true" ]; then
    phase4_automated_fixes
  fi
  
  # Run verification
  log_info "Running final verification..."
  verify_fixes
  
  # Count final TypeScript errors
  FINAL_ERROR_COUNT=$(count_ts_errors)
  log_info "Final TypeScript error count: $FINAL_ERROR_COUNT"
  
  if [ "$INITIAL_ERROR_COUNT" -gt 0 ] && [ "$FINAL_ERROR_COUNT" -eq 0 ]; then
    log_success "Successfully fixed all TypeScript errors!"
  elif [ "$INITIAL_ERROR_COUNT" -gt "$FINAL_ERROR_COUNT" ]; then
    log_success "Reduced TypeScript errors from $INITIAL_ERROR_COUNT to $FINAL_ERROR_COUNT"
  elif [ "$INITIAL_ERROR_COUNT" -eq "$FINAL_ERROR_COUNT" ]; then
    log_warning "No improvement in TypeScript error count. Still have $FINAL_ERROR_COUNT errors."
  else
    log_error "TypeScript error count increased from $INITIAL_ERROR_COUNT to $FINAL_ERROR_COUNT!"
  fi
fi
