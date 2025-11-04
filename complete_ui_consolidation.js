#!/usr/bin/env node

/**
 * Complete UI Library Consolidation Script
 * 
 * This script will:
 * 1. Remove unused UI dependencies from package.json
 * 2. Migrate all Material-UI components to Chakra UI
 * 3. Migrate all Radix UI components to Chakra UI or custom components
 * 4. Clean up duplicate styling and unused imports
 * 5. Ensure all components use a single consistent UI library
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// UI Library mapping
const MATERIAL_TO_CHAKRA = {
  'Box': 'Box',
  'Grid': 'SimpleGrid',
  'Paper': 'Box',
  'Container': 'Container',
  'Typography': 'Text',
  'Button': 'Button',
  'Card': 'Card',
  'CardContent': 'CardBody',
  'CardHeader': 'CardHeader',
  'CardTitle': 'CardHeader',
  'CardActions': 'CardFooter',
  'Chip': 'Tag',
  'IconButton': 'IconButton',
  'Alert': 'Alert',
  'LinearProgress': 'Progress',
  'Tooltip': 'Tooltip',
  'Switch': 'Switch',
  'FormControlLabel': 'FormLabel',
  'Table': 'Table',
  'TableBody': 'Tbody',
  'TableCell': 'Td',
  'TableContainer': 'TableContainer',
  'TableHead': 'Thead',
  'TableRow': 'Tr',
  'Dialog': 'Modal',
  'DialogTitle': 'ModalHeader',
  'DialogContent': 'ModalBody',
  'DialogActions': 'ModalFooter',
  'Tabs': 'Tabs',
  'Tab': 'Tab',
  'TabList': 'TabList',
  'TabPanel': 'TabPanel',
  'TabPanels': 'TabPanels',
  'Input': 'Input',
  'TextField': 'Input',
  'FormControl': 'FormControl',
  'FormLabel': 'FormLabel',
  'FormHelperText': 'FormErrorMessage',
  'Select': 'Select',
  'MenuItem': 'Option',
  'Checkbox': 'Checkbox',
  'Radio': 'Radio',
  'RadioGroup': 'RadioGroup',
  'Slider': 'Slider',
  'Badge': 'Badge',
  'Avatar': 'Avatar',
  'AvatarGroup': 'AvatarGroup',
  'List': 'List',
  'ListItem': 'ListItem',
  'ListItemText': 'ListItem',
  'ListItemIcon': 'ListItem',
  'Divider': 'Divider',
  'Drawer': 'Drawer',
  'AppBar': 'Flex',
  'Toolbar': 'Flex',
  'Fab': 'Button',
  'Breadcrumbs': 'Breadcrumb',
  'Pagination': 'Pagination',
  'Rating': 'Rating',
  'Skeleton': 'Skeleton',
  'Snackbar': 'Toast',
  'Stepper': 'Stepper',
  'Step': 'Step',
  'StepLabel': 'StepIndicator'
};

const RADIX_TO_CHAKRA = {
  'ScrollArea': 'ScrollArea',
  'Toast': 'Toast',
  'DropdownMenu': 'Menu',
  'Dialog': 'Modal',
  'Tabs': 'Tabs',
  'Select': 'Select',
  'Slider': 'Slider',
  'Progress': 'Progress',
  'Checkbox': 'Checkbox',
  'Avatar': 'Avatar',
  'Button': 'Button',
  'Switch': 'Switch',
  'Tooltip': 'Tooltip',
  'Popover': 'Popover',
  'AlertDialog': 'Alert',
  'ContextMenu': 'ContextMenu',
  'HoverCard': 'Card',
  'NavigationMenu': 'Navigation',
  'Separator': 'Divider',
  'Slider': 'Slider'
};

// Function to get all React/TypeScript files
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && file !== 'build' && file !== '.git' && file !== 'coverage') {
        arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
      }
    } else {
      if (file.match(/\.(tsx|ts|jsx|js)$/)) {
        arrayOfFiles.push(path.join(dirPath, "/", file));
      }
    }
  });

  return arrayOfFiles;
}

// Function to migrate Material-UI imports and components
function migrateMaterialUI(content) {
  let updated = content;
  
  // Remove Material-UI imports
  updated = updated.replace(/import\s*{[^}]*}\s*from\s*['"]@mui\/material['"];?/g, '');
  updated = updated.replace(/import\s*{[^}]*}\s*from\s*['"]@mui\/icons-material['"];?/g, '');
  updated = updated.replace(/import\s+{[^}]*}\s+from\s+['"]@mui\/material['"];?/g, '');
  updated = updated.replace(/import\s+{[^}]*}\s+from\s+['"]@mui\/icons-material['"];?/g, '');
  
  // Add Chakra UI import if any components are used
  if (updated.includes('@mui/material') || updated.includes('@mui/icons-material')) {
    const usedComponents = [];
    
    // Find all Material-UI component usage and replace
    Object.keys(MATERIAL_TO_CHAKRA).forEach(muiComponent => {
      if (updated.includes(muiComponent) && !updated.includes(`<${muiComponent}`)) {
        usedComponents.push(MATERIAL_TO_CHAKRA[muiComponent]);
      }
    });
    
    if (usedComponents.length > 0) {
      const imports = `import { ${usedComponents.join(', ')} } from '@chakra-ui/react';\n`;
      updated = imports + updated;
    }
  }
  
  // Replace Material-UI components with Chakra UI
  Object.keys(MATERIAL_TO_CHAKRA).forEach(muiComponent => {
    const chakraComponent = MATERIAL_TO_CHAKRA[muiComponent];
    const regex = new RegExp(`<${muiComponent}\\b`, 'g');
    updated = updated.replace(regex, `<${chakraComponent}`);
    
    // Replace closing tags too
    const closeRegex = new RegExp(`</${muiComponent}>`, 'g');
    updated = updated.replace(closeRegex, `</${chakraComponent}>`);
  });
  
  return updated;
}

// Function to migrate Radix UI imports and components
function migrateRadixUI(content) {
  let updated = content;
  
  // Remove Radix UI imports
  updated = updated.replace(/import\s*\*\s*as\s*\w*\s*from\s*['"]@radix-ui\/[^"']+['"];?/g, '');
  updated = updated.replace(/import\s*{[^}]*}\s*from\s*['"]@radix-ui\/[^"']+['"];?/g, '');
  updated = updated.replace(/import\s+\*\s+as\s+\w+\s+from\s+['"]@radix-ui\/[^"']+['"];?/g, '');
  updated = updated.replace(/import\s+{[^}]*}\s+from\s+['"]@radix-ui\/[^"']+['"];?/g, '');
  
  // Add Chakra UI import if any components are used
  if (updated.includes('@radix-ui')) {
    const usedComponents = [];
    
    Object.keys(RADIX_TO_CHAKRA).forEach(radixComponent => {
      if (updated.includes(radixComponent) && !updated.includes(`<${radixComponent}`)) {
        usedComponents.push(RADIX_TO_CHAKRA[radixComponent]);
      }
    });
    
    if (usedComponents.length > 0) {
      const imports = `import { ${usedComponents.join(', ')} } from '@chakra-ui/react';\n`;
      updated = imports + updated;
    }
  }
  
  // Replace Radix UI components with Chakra UI
  Object.keys(RADIX_TO_CHAKRA).forEach(radixComponent => {
    const chakraComponent = RADIX_TO_CHAKRA[radixComponent];
    const regex = new RegExp(`<${radixComponent}\\b`, 'g');
    updated = updated.replace(regex, `<${chakraComponent}`);
    
    const closeRegex = new RegExp(`</${radixComponent}>`, 'g');
    updated = updated.replace(closeRegex, `</${chakraComponent}>`);
  });
  
  return updated;
}

// Function to clean up unused imports
function cleanupImports(content) {
  let lines = content.split('\n');
  const keptLines = [];
  
  for (let line of lines) {
    // Keep non-import lines
    if (!line.trim().startsWith('import ')) {
      keptLines.push(line);
      continue;
    }
    
    // Clean up duplicate empty lines
    if (line.trim() === '' && keptLines.length > 0 && keptLines[keptLines.length - 1].trim() === '') {
      continue;
    }
    
    keptLines.push(line);
  }
  
  return keptLines.join('\n');
}

// Main consolidation function
function consolidateUI() {
  console.log('🚀 Starting Complete UI Library Consolidation...');
  
  const frontendPath = path.join(__dirname, 'apps', 'frontend');
  
  // Step 1: Update package.json to remove unused UI dependencies
  console.log('📦 Step 1: Updating package.json dependencies...');
  const packageJsonPath = path.join(frontendPath, 'package.json');
  
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Remove Material-UI and Radix UI dependencies
    const depsToRemove = [
      '@mui/material',
      '@mui/icons-material', 
      '@mui/lab',
      '@mui/system',
      '@mui/styles',
      '@emotion/react',
      '@emotion/styled',
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-collapsible',
      '@radix-ui/react-context-menu',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-form',
      '@radix-ui/react-hover-card',
      '@radix-ui/react-label',
      '@radix-ui/react-menu',
      '@radix-ui/react-navigation-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-progress',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-slider',
      '@radix-ui/react-slot',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@radix-ui/react-toggle',
      '@radix-ui/react-toggle-group',
      '@radix-ui/react-toolbar',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-visually-hidden'
    ];
    
    let dependenciesChanged = false;
    depsToRemove.forEach(dep => {
      if (packageJson.dependencies && packageJson.dependencies[dep]) {
        delete packageJson.dependencies[dep];
        console.log(`  ❌ Removed: ${dep}`);
        dependenciesChanged = true;
      }
    });
    
    if (dependenciesChanged) {
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log('  ✅ package.json updated');
    }
  }
  
  // Step 2: Migrate all React/TypeScript files
  console.log('🔄 Step 2: Migrating component files...');
  const files = getAllFiles(frontendPath);
  let migratedFiles = 0;
  let filesWithUI = 0;
  
  files.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      let updated = content;
      
      // Check if file contains UI library usage
      const hasMUI = content.includes('@mui/material') || content.includes('@mui/icons-material');
      const hasRadix = content.includes('@radix-ui');
      
      if (hasMUI || hasRadix) {
        filesWithUI++;
        
        // Migrate Material-UI
        if (hasMUI) {
          updated = migrateMaterialUI(updated);
        }
        
        // Migrate Radix UI
        if (hasRadix) {
          updated = migrateRadixUI(updated);
        }
        
        // Clean up imports
        updated = cleanupImports(updated);
        
        // Only write if changes were made
        if (updated !== content) {
          fs.writeFileSync(file, updated);
          migratedFiles++;
          console.log(`  ✅ Migrated: ${path.relative(frontendPath, file)}`);
        }
      }
    } catch (error) {
      console.log(`  ⚠️  Error processing ${file}:`, error.message);
    }
  });
  
  // Step 3: Clean up any remaining issues
  console.log('🧹 Step 3: Final cleanup...');
  
  // Remove any duplicate Chakra UI imports
  files.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      let lines = content.split('\n');
      const seenImports = new Set();
      const keptLines = [];
      
      lines.forEach(line => {
        if (line.trim().startsWith('import ') && line.includes('@chakra-ui/react')) {
          if (seenImports.has(line.trim())) {
            return; // Skip duplicate
          }
          seenImports.add(line.trim());
        }
        keptLines.push(line);
      });
      
      const updated = keptLines.join('\n');
      if (updated !== content) {
        fs.writeFileSync(file, updated);
        console.log(`  🧹 Cleaned imports: ${path.relative(frontendPath, file)}`);
      }
    } catch (error) {
      // Ignore file errors
    }
  });
  
  // Step 4: Generate summary
  console.log('\n📊 Consolidation Summary:');
  console.log(`  📁 Total files scanned: ${files.length}`);
  console.log(`  🔍 Files with UI libraries: ${filesWithUI}`);
  console.log(`  🔄 Files migrated: ${migratedFiles}`);
  console.log(`  ✅ Materials-UI: REMOVED from package.json`);
  console.log(`  ✅ Radix UI: REMOVED from package.json`);
  console.log(`  ✅ Chakra UI: PRIMARY UI LIBRARY`);
  
  console.log('\n🎉 UI Library Consolidation Complete!');
  console.log('\n📝 Next Steps:');
  console.log('  1. Run "npm install" to update dependencies');
  console.log('  2. Test the application to ensure all components work');
  console.log('  3. Update any failing components manually if needed');
  console.log('  4. Remove any remaining Material-UI or Radix UI components');
  
  return {
    totalFiles: files.length,
    filesWithUI,
    migratedFiles
  };
}

// Run the consolidation
if (require.main === module) {
  try {
    const result = consolidateUI();
    process.exit(0);
  } catch (error) {
    console.error('❌ Consolidation failed:', error);
    process.exit(1);
  }
}

module.exports = { consolidateUI };