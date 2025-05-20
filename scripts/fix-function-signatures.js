#!/usr/bin/env node
/**
 * Fix malformed function signature declarations in TypeScript files
 * For The New Fuse project
 * 
 * This script targets specifically the parameter type declaration issues identified in the scan
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const ROOT_DIR = process.cwd();
const BACKUP_DIR = path.join(ROOT_DIR, 'backups', `signature_fixes_${new Date().toISOString().replace(/:/g, '-')}`);

// Create backup directory
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log(`Created backup directory: ${BACKUP_DIR}`);
}

// Fix patterns for function signatures
const fixPatterns = [
  // Fix 1: Fix malformed parameter declarations with no space after colon
  {
    pattern: /(\w+):((?!\s)[^,\)\s]+)/g,
    replacement: '$1: $2'
  },
  
  // Fix 2: Fix malformed Promise<void> declarations
  {
    pattern: /(Promise<void>\s*){2,}/g,
    replacement: 'Promise<void>'
  },
  
  // Fix 3: Fix malformed Promise return types with multiple Promise declarations
  {
    pattern: /:\s*Promise<([^>]+)>\s*{([^:]+):/g,
    replacement: ': Promise<$1> ($2:'
  },
  
  // Fix 4: Fix return types with missing space after colon
  {
    pattern: /\):(Promise<[^>]+>)/g,
    replacement: '): $1'
  },
  
  // Fix 5: Fix malformed parameter lists with missing spaces after commas
  {
    pattern: /,(\w+):/g,
    replacement: ', $1:'
  },
  
  // Fix 6: Fix malformed if statements
  {
    pattern: /if\(([^)]+)\)/g,
    replacement: 'if ($1)'
  },
  
  // Fix 7: Fix malformed switch statements
  {
    pattern: /switch\(([^)]+)\)/g,
    replacement: 'switch ($1)'
  },
  
  // Fix 8: Fix malformed catch statements
  {
    pattern: /catch\(([^)]+)\)/g,
    replacement: 'catch ($1)'
  },
  
  // Fix 9: Fix method calls with parentheses in wrong position
  {
    pattern: /(\w+)\.(\w+)\.\(([^)]+)\)/g,
    replacement: '$1.$2($3)'
  }
];

/**
 * Processes a file to fix TypeScript syntax issues
 */
function fixFile(filePath) {
  console.log(`Processing: ${filePath}`);
  
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log(`  ⚠️ File not found: ${filePath}`);
      return false;
    }
    
    // Read file content
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Create backup subdirectories if needed
    const relativePath = path.relative(ROOT_DIR, filePath);
    const backupPath = path.join(BACKUP_DIR, relativePath);
    const backupDir = path.dirname(backupPath);
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Save backup before making changes
    fs.writeFileSync(backupPath, content);
    
    // Apply all fix patterns
    let hasChanges = false;
    fixPatterns.forEach(({ pattern, replacement }) => {
      const newContent = content.replace(pattern, replacement);
      if (newContent !== content) {
        content = newContent;
        hasChanges = true;
      }
    });
    
    // Write changes back to the file if modified
    if (hasChanges) {
      fs.writeFileSync(filePath, content);
      console.log(`  ✅ Fixed file: ${filePath}`);
      return true;
    } else {
      console.log(`  ℹ️ No changes needed for: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`  ❌ Error processing file ${filePath}: ${error.message}`);
    return false;
  }
}

/**
 * Find all TypeScript files in a directory recursively
 */
function findTsFiles(dir) {
  const files = [];
  
  function traverse(currentDir) {
    const entries = fs.readdirSync(currentDir);
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !entry.includes('node_modules') && !entry.includes('.git')) {
        traverse(fullPath);
      } else if (stat.isFile() && (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx'))) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

/**
 * Main function to process files
 */
function main() {
  try {
    console.log('🔍 Finding TypeScript files with function signature issues...');
    
    // First, process specific directories with known issues
    const directoriesToProcess = [
      'packages/api-client/src/integrations',
      'packages/api-client/src/services',
      'packages/hooks/src',
      'packages/db/src/services',
      'packages/api/src',
      'packages/monitoring/src'
    ];
    
    let totalFiles = 0;
    let fixedFiles = 0;
    
    for (const dir of directoriesToProcess) {
      const dirPath = path.join(ROOT_DIR, dir);
      if (!fs.existsSync(dirPath)) {
        console.log(`⚠️ Directory not found: ${dirPath}`);
        continue;
      }
      
      // Find all TypeScript files in the directory
      const files = findTsFiles(dirPath);
      console.log(`Found ${files.length} TypeScript files in ${dir}`);
      totalFiles += files.length;
      
      // Process each file
      for (const file of files) {
        if (fixFile(file)) {
          fixedFiles++;
        }
      }
    }
    
    console.log(`\n✅ Processed ${totalFiles} files, fixed ${fixedFiles} files.`);
    console.log(`📁 Backups saved to: ${BACKUP_DIR}`);
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main();
