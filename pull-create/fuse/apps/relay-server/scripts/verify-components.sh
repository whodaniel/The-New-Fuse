#!/bin/bash
set -e

echo "🔍 Verifying component implementations..."

# Check for required type definitions
required_types=(
    "src/types/core.ts"
    "src/types/api.ts"
    "src/types/auth.ts"
)

for type_file in "${required_types[@]}"; do
    if [ ! -f "$type_file" ]; then
        echo "❌ Missing type definition: $type_file"
        exit 1
    fi
done

# Verify component implementations
required_components=(
    "src/components/auth/AuthModule.tsx"
    "src/components/core/CoreModule.tsx"
    "src/components/features/api/APIModule.tsx"
)

for component in "${required_components[@]}"; do
    if [ ! -f "$component" ]; then
        echo "❌ Missing component: $component"
        exit 1
    fi
    
    # Check for proper TypeScript usage
    if ! grep -q "React.FC<" "$component"; then
        echo "❌ Missing TypeScript FC type in: $component"
        exit 1
    fi
    
    # Check for proper error handling
    if ! grep -q "catch (err)" "$component"; then
        echo "❌ Missing error handling in: $component"
        exit 1
    fi
done

echo "✅ All component implementations verified!"