#!/bin/bash
# Create feature module directories
for feature in agents chat workflow auth analytics marketplace; do
    mkdir -p packages/features/$feature/{components,hooks,utils}
    
    # Move components
    mv apps/frontend/src/components/$feature/* packages/features/$feature/components/
    
    # Create feature index
    echo "export * from './components';
export * from './hooks';
export * from './utils';" > packages/features/$feature/index.ts
done