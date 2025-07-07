#!/bin/bash
# Create core UI component directory
mkdir -p packages/ui-components/src/core

# Move and consolidate core components
mv apps/frontend/src/shared/ui/core/* packages/ui-components/src/core/
mv apps/frontend/src/components/ui/* packages/ui-components/src/core/

# Create index exports
echo "export * from './button';
export * from './card';
export * from './input';
export * from './select';
export * from './switch';
export * from './checkbox';
export * from './dropdown-menu';
export * from './typing-indicator';
export * from './theme-toggle';
export * from './sidebar';
export * from './app-card';
export * from './user-icon';
export * from './chat-bubble';" > packages/ui-components/src/core/index.ts