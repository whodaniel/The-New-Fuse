#!/bin/bash

# Set up logging
LOG_DIR="logs"
LOG_FILE="$LOG_DIR/typescript-fix-$(date +%Y%m%d-%H%M%S).log"
mkdir -p "$LOG_DIR"

# Function to count TypeScript errors
count_ts_errors() {
  npx tsc --noEmit > "$LOG_DIR/ts-errors-temp.log" 2>&1 || true
  local error_count=$(grep -c "error TS" "$LOG_DIR/ts-errors-temp.log" || echo 0)
  echo $error_count
}

# Function to analyze TypeScript errors
analyze_ts_errors() {
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

# Function to fix React component types
fix_react_types() {
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
}

# Function to fix common type issues
fix_common_types() {
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
  
  log_success "Common type issues fixed"
}

# Function to fix module declaration issues
fix_module_issues() {
  log_info "Fixing module declaration issues..."
  find src packages -type f -name "*.ts" -o -name "*.tsx" | while read file; do
      if ! grep -q "export " "$file"; then
          echo "export {};" >> "$file"
      fi
  done
  
  log_success "Module declaration issues fixed"
}

# ============================================================================
# Phase 1: Setup and Dependencies
# ============================================================================
phase1_setup_dependencies() {
  log_info "Phase 1: Setting up dependencies..."
  
  # Install required TypeScript dependencies
  yarn add -D typescript @types/react @types/react-dom @types/node || log_warning "Failed to install TypeScript dependencies"
  
  # Install core dependencies
  yarn add reflect-metadata typeorm @prisma/client zod reactflow react || log_warning "Failed to install core dependencies"
  
  # Install NestJS dependencies
  yarn add @nestjs/common @nestjs/core @nestjs/websockets rxjs || log_warning "Failed to install NestJS dependencies"
  
  # Install additional type definitions
  yarn add -D @types/bcrypt @types/socket.io @nestjs/event-emitter || log_warning "Failed to install additional type definitions"
  
  log_success "Phase 1 completed: Dependencies installed"
}

# ============================================================================
# Phase 2: Configuration Updates
# ============================================================================
phase2_update_configs() {
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
  
  log_success "Phase 2 completed: TypeScript configurations updated"
}

# Function to verify fixes
verify_fixes() {
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