#!/usr/bin/env node

/**
 * UI Library Migration Script
 * Migrates Material-UI components to Chakra UI
 */

const fs = require('fs');
const path = require('path');

// Migration mappings
const MATERIAL_TO_CHAKRA_MAPPING = {
  // Components
  'material_1.Box': 'Chakra.Box',
  'material_1.Box': 'Box',
  'material_1.Grid': 'SimpleGrid', 
  'material_1.Grid item': 'GridItem',
  'material_1.Paper': 'Box',
  'material_1.Tabs': 'Tabs',
  'material_1.Tab': 'Tab',
  'material_1.Container': 'Container',
  'material_1.Card': 'Card',
  'material_1.CardContent': 'CardBody',
  'material_1.CardHeader': 'CardHeader',
  'material_1.Button': 'Button',
  'material_1.TextField': 'Input',
  'material_1.Select': 'Select',
  'material_1.Menu': 'Menu',
  'material_1.MenuItem': 'MenuItem',
  'material_1.Dialog': 'Modal',
  'material_1.DialogTitle': 'ModalHeader',
  'material_1.DialogContent': 'ModalBody',
  'material_1.DialogActions': 'ModalFooter',
  
  // Icons (replace with Chakra icons or use @chakra-ui/icons)
  'icons_material_1': '@chakra-ui/icons',
  
  // Props mappings
  'sx={{': 'style={{',
  'container spacing={': 'spacing={', 
  'item xs={': 'colSpan={',
  'variant="outlined"': 'variant="outline"',
  'variant="contained"': 'variant="solid"',
  'size="small"': 'size="sm"',
  'size="large"': 'size="lg"',
};

const MIGRATION_RULES = [
  {
    pattern: /import material_1 from '@mui\/material';/g,
    replacement: "import { Box, SimpleGrid, GridItem, Tabs, Tab, Container, Card, CardBody, CardHeader, Button, Input, Select, Menu, MenuItem, Modal, ModalHeader, ModalBody, ModalFooter } from '@chakra-ui/react';"
  },
  {
    pattern: /import icons_material_1 from '@mui\/icons-material';/g,
    replacement: "import { Search, Settings, Home, User, Menu as MenuIcon } from '@chakra-ui/icons';"
  },
  {
    pattern: /material_1\.Box sx=/g,
    replacement: 'Box style='
  },
  {
    pattern: /material_1\.Grid container spacing=/g,
    replacement: 'SimpleGrid columns='
  },
  {
    pattern: /material_1\.Grid item xs=/g,
    replacement: 'GridItem colSpan='
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
  }
];

function migrateFile(filePath) {
  console.log(`Migrating: ${filePath}`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    MIGRATION_RULES.forEach(rule => {
      content = content.replace(rule.pattern, rule.replacement);
    });
    
    // Additional manual fixes for specific patterns
    content = content.replace(/spacing=\{(\d+)\}/g, 'columns={$1}');
    content = content.replace(/colSpan=\{(\d+)\}/g, 'colSpan={$1}');
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Successfully migrated: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`❌ Error migrating ${filePath}:`, error.message);
    return false;
  }
}

function findFilesToMigrate(dir, extension = '.tsx') {
  const files = [];
  
  function scanDirectory(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        scanDirectory(fullPath);
      } else if (stat.isFile() && item.endsWith(extension)) {
        files.push(fullPath);
      }
    }
  }
  
  scanDirectory(dir);
  return files;
}

function main() {
  const frontendPath = '/workspace/apps/frontend/src';
  
  console.log('🔄 Starting UI Library Migration...');
  console.log(`📁 Scanning directory: ${frontendPath}`);
  
  // Find files with Material-UI imports
  const filesToMigrate = findFilesToMigrate(frontendPath, '.tsx')
    .filter(file => {
      const content = fs.readFileSync(file, 'utf8');
      return content.includes('@mui/material') || content.includes('@mui/icons-material');
    });
  
  console.log(`📋 Found ${filesToMigrate.length} files to migrate:`);
  filesToMigrate.forEach(file => console.log(`  - ${path.relative(frontendPath, file)}`));
  
  let successCount = 0;
  let failCount = 0;
  
  filesToMigrate.forEach(file => {
    if (migrateFile(file)) {
      successCount++;
    } else {
      failCount++;
    }
  });
  
  console.log('\n📊 Migration Summary:');
  console.log(`✅ Successfully migrated: ${successCount} files`);
  console.log(`❌ Failed to migrate: ${failCount} files`);
  
  if (failCount === 0) {
    console.log('\n🎉 Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Test the build process: npm run build');
    console.log('2. Check for any remaining Material-UI imports');
    console.log('3. Update package.json dependencies');
    console.log('4. Test the application functionality');
  } else {
    console.log('\n⚠️  Some files failed to migrate. Please review the errors above.');
  }
}

if (require.main === module) {
  main();
}

module.exports = { migrateFile, findFilesToMigrate, MIGRATION_RULES };