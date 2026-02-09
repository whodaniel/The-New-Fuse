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

import fs from 'fs';
import path from 'path';

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
  'packages/ui/src/components/Card.tsx',
  'packages/ui-components/src/core/card/Card.tsx',
  'apps/frontend/src/shared/ui/core/Card/Card.tsx',
  'packages/ui/src/components/Input.tsx',
  'packages/ui-components/src/core/input/Input.tsx',
  'apps/frontend/src/shared/ui/core/Input/Input.tsx',
  'packages/ui/src/components/Select.tsx',
  'packages/ui-components/src/core/select/Select.tsx',
  'apps/frontend/src/shared/ui/core/Select/Select.tsx',

  // Layout Components
  'packages/core/components/layout/Container.tsx',
  'packages/ui-components/src/layout/Container.tsx',
  'apps/frontend/src/components/layout/Container.tsx',
  'packages/core/components/layout/Split.tsx',
  'packages/ui-components/src/layout/Split.tsx',
  'apps/frontend/src/components/layout/Split.tsx',
  'packages/layout/Layout.tsx',
  'packages/ui-components/src/layout/BaseLayout/index.tsx',
  'packages/ui-components/src/consolidated/Layout.tsx',
  'apps/frontend/src/components/layout/Layout.tsx',
  'packages/layout/Sidebar.tsx',
  'packages/ui-components/src/layout/Sidebar.tsx',
  'apps/frontend/src/components/layout/Sidebar.tsx',

  // Utility Functions
  'packages/ui/src/utils/cn.ts',
  'packages/ui-components/src/utils/cn.ts',
  'apps/frontend/src/lib/utils.ts',
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
