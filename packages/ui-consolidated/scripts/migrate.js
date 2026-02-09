#!/usr/bin/env node

/**
 * UI Component Migration Script
 *
 * This script helps migrate from the old UI components to the consolidated UI components.
 * It scans the codebase for imports of the old components and replaces them with imports
 * of the new consolidated components.
 *
 * Usage:
 * node scripts/migrate.js [--dry-run] [--path <path>]
 *
 * Options:
 * --dry-run: Don't actually modify any files, just show what would be changed
 * --path: The path to scan for files (default: src)
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const pathIndex = args.indexOf('--path');
const scanPath = pathIndex !== -1 ? args[pathIndex + 1] : 'src';

// Import patterns to replace
const importPatterns = [
  // UI Components
  {
    // Button component
    from: [
      /@the-new-fuse\/ui\/src\/components\/Button/g,
      /@the-new-fuse\/ui-components\/src\/core\/button/g,
      /@\/shared\/ui\/core\/Button/g,
    ],
    to: '@the-new-fuse/ui-consolidated',
  },
  {
    // Card component
    from: [
      /@the-new-fuse\/ui\/src\/components\/Card/g,
      /@the-new-fuse\/ui-components\/src\/core\/card/g,
      /@\/shared\/ui\/core\/Card/g,
    ],
    to: '@the-new-fuse/ui-consolidated',
  },
  {
    // Input component
    from: [
      /@the-new-fuse\/ui\/src\/components\/Input/g,
      /@the-new-fuse\/ui-components\/src\/core\/input/g,
      /@\/shared\/ui\/core\/Input/g,
    ],
    to: '@the-new-fuse/ui-consolidated',
  },
  {
    // Select component
    from: [
      /@the-new-fuse\/ui\/src\/components\/Select/g,
      /@the-new-fuse\/ui-components\/src\/core\/select/g,
      /@\/shared\/ui\/core\/Select/g,
    ],
    to: '@the-new-fuse/ui-consolidated',
  },

  // Layout Components
  {
    // Container component
    from: [
      /@the-new-fuse\/core\/components\/layout\/Container/g,
      /@the-new-fuse\/ui-components\/src\/layout\/Container/g,
      /@\/components\/layout\/Container/g,
    ],
    to: '@the-new-fuse/ui-consolidated',
  },
  {
    // Split component
    from: [
      /@the-new-fuse\/core\/components\/layout\/Split/g,
      /@the-new-fuse\/ui-components\/src\/layout\/Split/g,
      /@\/components\/layout\/Split/g,
      /@\/components\/ui\/split/g,
    ],
    to: '@the-new-fuse/ui-consolidated',
  },
  {
    // Layout component
    from: [
      /@the-new-fuse\/layout/g,
      /@the-new-fuse\/ui-components\/src\/layout\/BaseLayout/g,
      /@the-new-fuse\/ui-components\/src\/consolidated\/Layout/g,
      /@\/components\/layout\/Layout/g,
    ],
    to: '@the-new-fuse/ui-consolidated',
  },
  {
    // Sidebar component
    from: [
      /@the-new-fuse\/layout\/Sidebar/g,
      /@the-new-fuse\/ui-components\/src\/layout\/Sidebar/g,
      /@\/components\/layout\/Sidebar/g,
    ],
    to: '@the-new-fuse/ui-consolidated',
  },

  // Utility functions
  {
    // Utility functions
    from: [
      /@the-new-fuse\/ui\/src\/utils\/cn/g,
      /@the-new-fuse\/ui-components\/src\/utils\/cn/g,
      /@\/lib\/utils/g,
    ],
    to: '@the-new-fuse/ui-consolidated',
  },
];

// Find all TypeScript and JavaScript files
const findFiles = (dir) => {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== '.git') {
        files.push(...findFiles(fullPath));
      }
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
};

// Process a file
const processFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  for (const pattern of importPatterns) {
    for (const fromPattern of pattern.from) {
      if (fromPattern.test(content)) {
        content = content.replace(fromPattern, pattern.to);
        modified = true;
      }
    }
  }

  if (modified) {
    console.log(`Modified: ${filePath}`);

    if (!dryRun) {
      fs.writeFileSync(filePath, content, 'utf8');
    }
  }

  return modified;
};

// Main function
const main = () => {
  console.log(`Scanning ${scanPath} for files to migrate...`);
  console.log(`Dry run: ${dryRun ? 'yes' : 'no'}`);

  const files = findFiles(scanPath);
  console.log(`Found ${files.length} files to scan`);

  let modifiedCount = 0;

  for (const file of files) {
    if (processFile(file)) {
      modifiedCount++;
    }
  }

  console.log(`Modified ${modifiedCount} files`);

  if (dryRun) {
    console.log('This was a dry run. No files were actually modified.');
  } else {
    console.log('Migration complete. Please check the modified files and run your tests.');
  }
};

main();
