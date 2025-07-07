#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Starting targeted quote corruption fix...');

function fixAdvancedQuoteCorruption(content) {
  let fixedContent = content;
  let changesMade = 0;

  // Critical fixes for TypeScript/JavaScript syntax
  const fixes = [
    // Fix import statements missing quotes
    { pattern: /import\s+{([^}]+)}\s+from\s+([^;'"]+);/g, replacement: "import { $1 } from '$2';" },
    { pattern: /import\s+([^"']+)\s+from\s+([^;'"]+);/g, replacement: "import $1 from '$2';" },

    // Fix role definitions like role:system' -> role: 'system'
    { pattern: /role:(\w+)'/g, replacement: "role: '$1'" },

    // Fix string literals that start with : like ':system' -> 'system'
    { pattern: /:\s*'?(\w+)'\s*\|/g, replacement: "'$1' |" },

    // Fix unterminated string literals in imports
    { pattern: /@nestjs\/common;/g, replacement: "'@nestjs/common';" },
    { pattern: /@the-new-fuse\/(\w+)/g, replacement: "'@the-new-fuse/$1'" },

    // Fix logger imports without quotes
    { pattern: /Logger\s+}\s+from\s+([^'"]*);/g, replacement: "Logger } from '$1';" },

    // Fix corrupted type unions like 'system' | 'user' where quotes are missing
    { pattern: /(\w+)'\s*\|\s*'(\w+)'\s*\|\s*'(\w+)'/g, replacement: "'$1' | '$2' | '$3'" },

    // Fix method calls with corrupted strings
    { pattern: /'([^']*)'([^']*)'([^']*)'([^']*)'/, replacement: "'$1$2$3$4'" },

    // Fix object properties with corrupted quotes
    { pattern: /(\w+):\s*'([^']*)'([^',}]*)/g, replacement: "$1: '$2$3'" },

    // Fix template literals
    { pattern: /`([^`]*)'([^`]*)`/g, replacement: "`$1'$2`" },

    // Fix corrupted string concatenation
    { pattern: /'([^']*)\+\s*'([^']*)'/g, replacement: "'$1' + '$2'" },

    // Fix array/object access with corrupted strings
    { pattern: /\['([^']*)'([^\]]*)\]/g, replacement: "['$1$2']" },

    // Fix function calls with corrupted parameters
    { pattern: /\(([^)]*)'([^)]*)'([^)]*)\)/g, replacement: "($1'$2'$3)" },
  ];

  fixes.forEach((fix, index) => {
    const before = fixedContent;
    fixedContent = fixedContent.replace(fix.pattern, fix.replacement);
    if (before !== fixedContent) {
      changesMade++;
      console.log(`  Applied fix ${index + 1}: ${fix.pattern}`);
    }
  });

  return { content: fixedContent, changesMade };
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const result = fixAdvancedQuoteCorruption(content);

    if (result.changesMade > 0) {
      fs.writeFileSync(filePath, result.content, 'utf8');
      console.log(`✅ Fixed ${result.changesMade} issues in: ${filePath}`);
      return result.changesMade;
    }

    return 0;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return 0;
  }
}

function processDirectory(dirPath) {
  const items = fs.readdirSync(dirPath);
  let totalFiles = 0;
  let totalChanges = 0;

  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (['node_modules', 'dist', 'build', '.git', '.turbo'].includes(item)) {
        continue;
      }
      const subResult = processDirectory(fullPath);
      totalFiles += subResult.files;
      totalChanges += subResult.changes;
    } else if (
      stat.isFile() &&
      (item.endsWith('.ts') ||
        item.endsWith('.tsx') ||
        item.endsWith('.js') ||
        item.endsWith('.jsx'))
    ) {
      const changes = processFile(fullPath);
      totalChanges += changes;
      totalFiles++;
    }
  }

  return { files: totalFiles, changes: totalChanges };
}

// Process the current core package
const startPath = path.join(process.cwd(), 'src');
console.log(`🚀 Processing files in: ${startPath}`);

const result = processDirectory(startPath);

console.log(`\n📊 Summary:`);
console.log(`   Files processed: ${result.files}`);
console.log(`   Total fixes applied: ${result.changes}`);

if (result.changes > 0) {
  console.log(`\n✅ Advanced quote corruption fix completed!`);
} else {
  console.log(`\n ℹ️  No additional quote corruption found.`);
}
