#!/usr/bin/env node
/**
 * Enhanced script to fix broken TypeScript syntax in files
 * For The New Fuse project
 */

import fs from 'fs';
import path from 'path';

// Specific files we know have issues
const filesToFix = [
  'src/components/features/settings/LLMConfigProvider.tsx',
  'src/components/core/CoreModule.tsx',
  'src/components/features/auth/AuthenticationModule.tsx',
  'src/components/features/data/DataModule.tsx',
  'src/components/features/marketplace/MarketplaceModule.tsx',
  'src/components/theme/ThemeModule.tsx',
];

function fixFile(filePath) {
  console.log(`Processing file: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  const contentBefore = content;
  
  // Save a backup of the original file
  const backupPath = `${filePath}.bak`;
  if (!fs.existsSync(backupPath)) {
    fs.writeFileSync(backupPath, content);
    console.log(`  Created backup: ${backupPath}`);
  }

  // Fix 1: Fix classic malformed function declarations with ") => Promise<void> {"
  content = content.replace(/async\s+(\w+)\(\)\s*=>\s*Promise<[^>]+>\s*{([^:]+):\s*/g, 
                           'async $1($2): ');

  // Fix 2: Fix malformed useCallback declarations
  content = content.replace(/const\s+(\w+):\s+([^)]+)\)\s*=\s*useCallback\(\s*\(([^>]+)>\s*{/g, 
                           'const $1 = useCallback(($3) => {');

  // Fix 3: Fix malformed repeated Promise<void> declarations
  content = content.replace(/async\s*\(\)\s*=>\s*(Promise<void>\s*){2,}\(\)\s*=>\s*{/g, 
                           'async () => {');

  // Fix 4: Fix malformed imports
  content = content.replace(/import:\s*React,\s*\},\s*{\s*FC\s*\},\s*from,\s*'react'\);/g, 
                           "import React, { FC } from 'react';");

  // Fix 5: Fix dangling variable declarations and trailing commas
  content = content.replace(/(\w+):\s*z\.\w+\(\)[,.]?\s*;/g, 
                           '$1: z.$1(),');

  // Fix 6: Fix string function declarations
  content = content.replace(/string\(\);\s*min\((\d+),\s*['"]([^'"]+)['"]\);/g, 
                           "string().min($1, '$2').");

  // Fix 7: Fix regex patterns
  content = content.replace(/regex\((\/[^\/]+\/),\s*['"]([^'"]+)['"]\);/g,
                           "regex($1, '$2').");

  // Fix 8: Fix malformed cva declarations
  content = content.replace(/const\s+(\w+)\s*=\s*cva\(\);\s*(['\"][^;]+;)/g,
                           'const $1 = cva(\n  $2\n  {');

  // Fix 9: Fix malformed object literals and trailing commas
  content = content.replace(/([a-zA-Z0-9_]+):\s+([a-zA-Z0-9_'"]+),\s*;/g,
                           '$1: $2,');
                           
  // Fix 10: Correct repeated Promise<void> declarations for useCallback
  content = content.replace(/= useCallback\(async \(\) => Promise<void> \(\): Promise<void> \(\): Promise<void> \(\): Promise<void> \(\): Promise<void> \(\) =>/g,
                           '= useCallback(async () =>');
  
  // Write fixed content back to file if changes were made
  if (content !== contentBefore) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed file: ${filePath}`);
  } else {
    console.log(`ℹ️ No changes needed for: ${filePath}`);
  }
}

// Main execution
console.log('🔍 Starting enhanced TypeScript syntax fixes...');
filesToFix.forEach(fixFile);
console.log('✅ All files have been processed');
