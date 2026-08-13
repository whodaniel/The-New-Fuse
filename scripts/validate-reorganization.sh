#!/bin/bash
set -e

echo "🔍 Starting Post-Reorganization Validation"

# Function to log steps and results
log_step() {
    echo -e "\n📋 ${1}"
}

log_error() {
    echo -e "❌ ${1}"
    echo "${1}" >> validation-errors.log
}

log_success() {
    echo -e "✅ ${1}"
}

# Step 1: TypeScript Validation
log_step "Running TypeScript Checks"
typescript_check() {
    # Run incremental checks using different tsconfig files
    for phase in {1..4}; do
        echo "Running TypeScript phase ${phase} checks..."
        if ! yarn tsc --project config/tsconfig.fix.phase${phase}.json --noEmit; then
            log_error "TypeScript phase ${phase} check failed"
            return 1
        fi
    done
    
    # Run final strict check
    if ! yarn tsc --noEmit; then
        log_error "Final TypeScript check failed"
        return 1
    fi
    
    log_success "TypeScript validation completed"
}

# Step 2: Component Rendering Verification
log_step "Verifying Component Rendering"
component_check() {
    # Run component tests
    if ! yarn test --testPathPattern="packages/ui-components|packages/features" --coverage; then
        log_error "Component tests failed"
        return 1
    fi
    
    # Run storybook build check if available
    if [ -f ".storybook/main.js" ]; then
        if ! yarn build-storybook --quiet; then
            log_error "Storybook build failed"
            return 1
        fi
    fi
    
    log_success "Component verification completed"
}

# Step 3: Navigation Flow Testing
log_step "Testing Navigation Flows"
navigation_check() {
    # Run navigation-specific tests
    if ! yarn test --testPathPattern="src/pages|src/navigation" --coverage; then
        log_error "Navigation tests failed"
        return 1
    fi
    
    log_success "Navigation flow testing completed"
}

# Step 4: Import Validation
log_step "Checking for Broken Imports"
import_check() {
    # Use madge to check for circular dependencies
    if ! yarn madge --circular --extensions ts,tsx .; then
        log_error "Circular dependencies detected"
        return 1
    fi
    
    # Check for broken imports
    if ! yarn tsc --noEmit --traceResolution > import-trace.log; then
        log_error "Import resolution check failed"
        return 1
    fi
    
    # Look for common import errors
    if grep -r "Cannot find module" import-trace.log; then
        log_error "Found broken imports"
        return 1
    fi
    
    log_success "Import validation completed"
}

# Step 5: Build Process Validation
log_step "Validating Build Process"
build_check() {
    # Clean previous builds
    yarn clean
    
    # Run production build
    if ! yarn build; then
        log_error "Production build failed"
        return 1
    fi
    
    # Verify build output
    if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then
        log_error "Build output verification failed"
        return 1
    fi
    
    log_success "Build process validation completed"
}

# Step 6: End-to-End Testing
log_step "Running End-to-End Tests"
e2e_check() {
    # Start the application in test mode
    yarn start:test &
    APP_PID=$!
    
    # Wait for app to start
    sleep 10
    
    # Run E2E tests
    if ! yarn test:e2e; then
        log_error "E2E tests failed"
        kill $APP_PID
        return 1
    fi
    
    # Cleanup
    kill $APP_PID
    
    log_success "E2E testing completed"
}

# Run all checks
main() {
    # Create fresh log file
    > validation-errors.log
    
    typescript_check || exit 1
    component_check || exit 1
    navigation_check || exit 1
    import_check || exit 1
    build_check || exit 1
    e2e_check || exit 1
    
    if [ -s validation-errors.log ]; then
        echo -e "\n❌ Validation failed. Check validation-errors.log for details."
        exit 1
    else
        echo -e "\n✅ All validation steps completed successfully!"
    fi
}

# Execute main function
main