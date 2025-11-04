#!/usr/bin/env node

/**
 * Comprehensive UI component fix after migration
 * Fixes JSX tags, props, and other issues
 */

const fs = require('fs');
const path = require('path');

const COMPONENT_FIXES = [
  {
    pattern: /<Box style=/g,
    replacement: '<Box'
  },
  {
    pattern: /<SimpleGrid columns=/g,
    replacement: '<SimpleGrid templateColumns='
  },
  {
    pattern: /<GridItem colSpan=/g,
    replacement: '<GridItem colSpan='
  },
  {
    pattern: /<Tabs.*onChange/g,
    replacement: '<Tabs onChange'
  },
  {
    pattern: /<Tab label=/g,
    replacement: '<Tab'
  }
];

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    COMPONENT_FIXES.forEach(rule => {
      if (content.includes(rule.pattern.source)) {
        content = content.replace(rule.pattern, rule.replacement);
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed: ${path.basename(filePath)}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

function findFilesToFix(dir) {
  const files = [];
  
  function scanDirectory(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        scanDirectory(fullPath);
      } else if (stat.isFile() && item.endsWith('.tsx')) {
        files.push(fullPath);
      }
    }
  }
  
  scanDirectory(dir);
  return files;
}

function main() {
  const frontendPath = '/workspace/apps/frontend/src';
  
  console.log('🔧 Fixing UI component issues...');
  
  // Focus on files that were recently migrated
  const filesToCheck = [
    '/workspace/apps/frontend/src/components/Analytics.tsx',
    '/workspace/apps/frontend/src/components/ChatRoom.tsx',
    '/workspace/apps/frontend/src/components/MessageSearch/MessageSearch.tsx'
  ];
  
  let fixedCount = 0;
  
  filesToCheck.forEach(file => {
    if (fs.existsSync(file)) {
      if (fixFile(file)) {
        fixedCount++;
      }
    }
  });
  
  console.log(`\n📊 Fix Summary:`);
  console.log(`✅ Fixed: ${fixedCount} files`);
  
  if (fixedCount > 0) {
    console.log('\n🎉 Component fixes completed!');
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixFile, COMPONENT_FIXES };