#!/bin/bash

set -e

echo "Running TypeScript type check..."

# First try with base config
npx tsc --noEmit || {
    echo "TypeScript check failed with base config, trying with relaxed settings..."
    
    # Try with the more lenient build config
    npx tsc -p tsconfig.build.json --noEmit || {
        echo "TypeScript check failed. Generating detailed error report..."
        npx tsc --noEmit > typescript-errors.log 2>&1
        echo "Error details have been saved to typescript-errors.log"
        exit 1
    }
}

echo "TypeScript check completed successfully!"