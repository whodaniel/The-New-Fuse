#!/usr/bin/env node

/**
 * Cleanup remaining Material-UI references after migration
 */

const fs = require('fs');
const path = require('path');

const CLEANUP_RULES = [
  {
    pattern: /material_1\.Box/g,
    replacement: 'Box'
  },
  {
    pattern: /material_1\.Grid/g,
    replacement: 'SimpleGrid'
  },
  {
    pattern: /material_1\.Paper/g,
    replacement: 'Box'
  },
  {
    pattern: /material_1\.Tabs/g,
    replacement: 'Tabs'
  },
  {
    pattern: /material_1\.Tab/g,
    replacement: 'Tab'
  },
  {
    pattern: /material_1\.Container/g,
    replacement: 'Container'
  },
  {
    pattern: /material_1\.Card/g,
    replacement: 'Card'
  },
  {
    pattern: /material_1\.Button/g,
    replacement: 'Button'
  },
  {
    pattern: /material_1\.TextField/g,
    replacement: 'Input'
  },
  {
    pattern: /material_1\.Select/g,
    replacement: 'Select'
  }
];

function cleanupFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    CLEANUP_RULES.forEach(rule => {
      if (content.includes(rule.pattern.source)) {
        content = content.replace(rule.pattern, rule.replacement);
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Cleaned: ${path.basename(filePath)}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error cleaning ${filePath}:`, error.message);
    return false;
  }
}

function findFilesWithReferences(dir) {
  const files = [];
  
  function scanDirectory(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        scanDirectory(fullPath);
      } else if (stat.isFile() && item.endsWith('.tsx')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (content.includes('material_1.')) {
            files.push(fullPath);
          }
        } catch (error) {
          // Skip files that can't be read
        }
      }
    }
  }
  
  scanDirectory(dir);
  return files;
}

function main() {
  const frontendPath = '/workspace/apps/frontend/src';
  
  console.log('🧹 Cleaning up remaining Material-UI references...');
  
  const filesToClean = findFilesWithReferences(frontendPath);
  
  if (filesToClean.length === 0) {
    console.log('✅ No remaining Material-UI references found!');
    return;
  }
  
  console.log(`📋 Found ${filesToClean.length} files with remaining references:`);
  filesToClean.forEach(file => console.log(`  - ${path.relative(frontendPath, file)}`));
  
  let cleanedCount = 0;
  
  filesToClean.forEach(file => {
    if (cleanupFile(file)) {
      cleanedCount++;
    }
  });
  
  console.log(`\n📊 Cleanup Summary:`);
  console.log(`✅ Cleaned: ${cleanedCount} files`);
  
  if (cleanedCount > 0) {
    console.log('\n🎉 Cleanup completed!');
  }
}

if (require.main === module) {
  main();
}

module.exports = { cleanupFile, CLEANUP_RULES };