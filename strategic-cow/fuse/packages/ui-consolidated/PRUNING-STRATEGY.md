# UI Component Pruning Strategy

This document outlines the strategy for pruning redundant UI components after consolidation.

## Goals

1. **Reduce Codebase Size**: Remove redundant code to reduce the overall size of the codebase
2. **Eliminate Confusion**: Remove duplicate implementations to eliminate confusion about which component to use
3. **Simplify Maintenance**: Make it easier to maintain the codebase by having a single source of truth
4. **Improve Performance**: Reduce bundle size by eliminating duplicate code

## Approach

### 1. Identify Components to Prune

Based on our consolidation work, we've identified the following components to prune:

#### UI Components

- `packages/ui/src/components/Button.tsx`
- `packages/ui-components/src/core/button/Button.tsx`
- `apps/frontend/src/shared/ui/core/Button/Button.tsx`
- `packages/ui/src/components/Card.tsx`
- `packages/ui-components/src/core/card/Card.tsx`
- `apps/frontend/src/shared/ui/core/Card/Card.tsx`
- `packages/ui/src/components/Input.tsx`
- `packages/ui-components/src/core/input/Input.tsx`
- `apps/frontend/src/shared/ui/core/Input/Input.tsx`
- `packages/ui/src/components/Select.tsx`
- `packages/ui-components/src/core/select/Select.tsx`
- `apps/frontend/src/shared/ui/core/Select/Select.tsx`

#### Layout Components

- `packages/core/components/layout/Container.tsx`
- `packages/ui-components/src/layout/Container.tsx`
- `apps/frontend/src/components/layout/Container.tsx`
- `packages/core/components/layout/Split.tsx`
- `packages/ui-components/src/layout/Split.tsx`
- `apps/frontend/src/components/layout/Split.tsx`
- `packages/layout/Layout.tsx`
- `packages/ui-components/src/layout/BaseLayout/index.tsx`
- `packages/ui-components/src/consolidated/Layout.tsx`
- `apps/frontend/src/components/layout/Layout.tsx`
- `packages/layout/Sidebar.tsx`
- `packages/ui-components/src/layout/Sidebar.tsx`
- `apps/frontend/src/components/layout/Sidebar.tsx`

#### Utility Functions

- `packages/ui/src/utils/cn.ts`
- `packages/ui-components/src/utils/cn.ts`
- `apps/frontend/src/lib/utils.ts`

### 2. Pruning Process

To safely prune these components, we'll follow this process:

1. **Verify Migration**: Ensure all references to the old components have been updated to use the consolidated components
2. **Run Tests**: Run all tests to ensure the application still works as expected
3. **Deprecate**: Mark the old components as deprecated with a comment pointing to the new components
4. **Remove**: Remove the old components after a grace period to allow for any missed references to be updated

### 3. Deprecation Notice

For each component to be pruned, we'll add a deprecation notice:

```tsx
/**
 * @deprecated This component is deprecated. Please use the consolidated component from @the-new-fuse/ui-consolidated instead.
 * Example: import { Button } from '@the-new-fuse/ui-consolidated';
 */
```

### 4. Pruning Schedule

To ensure a smooth transition, we'll follow this pruning schedule:

1. **Week 1**: Add deprecation notices to all components to be pruned
2. **Week 2**: Run the migration script to update all references to the old components
3. **Week 3**: Verify that all references have been updated and run tests
4. **Week 4**: Remove the old components

### 5. Pruning Script

To automate the pruning process, we'll create a pruning script:

```javascript
#!/usr/bin/env node

/**
 * UI Component Pruning Script
 * 
 * This script helps prune redundant UI components after consolidation.
 * It adds deprecation notices to all components to be pruned.
 * 
 * Usage:
 * node scripts/prune.js [--dry-run] [--remove]
 * 
 * Options:
 * --dry-run: Don't actually modify any files, just show what would be changed
 * --remove: Remove the components instead of adding deprecation notices
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const remove = args.includes('--remove');

// Components to prune
const componentsToPrune = [
  // UI Components
  'packages/ui/src/components/Button.tsx',
  'packages/ui-components/src/core/button/Button.tsx',
  'apps/frontend/src/shared/ui/core/Button/Button.tsx',
  // ... more components
];

// Deprecation notice
const deprecationNotice = `/**
 * @deprecated This component is deprecated. Please use the consolidated component from @the-new-fuse/ui-consolidated instead.
 * Example: import { Component } from '@the-new-fuse/ui-consolidated';
 */
`;

// Process a file
const processFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  
  if (remove) {
    console.log(`Removing: ${filePath}`);
    
    if (!dryRun) {
      fs.unlinkSync(filePath);
    }
    
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Add deprecation notice if not already present
  if (!content.includes('@deprecated')) {
    const componentName = path.basename(filePath, path.extname(filePath));
    const notice = deprecationNotice.replace('Component', componentName);
    
    // Add deprecation notice after imports
    const importEndIndex = content.lastIndexOf('import');
    const importEndLineIndex = content.indexOf('\n', importEndIndex);
    
    if (importEndLineIndex !== -1) {
      content = content.slice(0, importEndLineIndex + 1) + '\n' + notice + content.slice(importEndLineIndex + 1);
    } else {
      content = notice + content;
    }
    
    console.log(`Adding deprecation notice to: ${filePath}`);
    
    if (!dryRun) {
      fs.writeFileSync(filePath, content, 'utf8');
    }
  }
};

// Main function
const main = () => {
  console.log(`Pruning UI components...`);
  console.log(`Dry run: ${dryRun ? 'yes' : 'no'}`);
  console.log(`Remove: ${remove ? 'yes' : 'no'}`);
  
  for (const component of componentsToPrune) {
    processFile(component);
  }
  
  console.log(`Pruning complete.`);
  
  if (dryRun) {
    console.log('This was a dry run. No files were actually modified.');
  }
};

main();
```

### 6. Monitoring

After pruning, we'll monitor the application for any issues related to the pruned components. If any issues are found, we'll address them immediately.

## Benefits

1. **Reduced Codebase Size**: By pruning redundant components, we'll reduce the overall size of the codebase
2. **Eliminated Confusion**: By having a single source of truth, we'll eliminate confusion about which component to use
3. **Simplified Maintenance**: By having a single implementation, we'll make it easier to maintain the codebase
4. **Improved Performance**: By eliminating duplicate code, we'll reduce bundle size and improve performance
