#!/usr/bin/env node

/**
 * Final UI Library Cleanup Script
 * This script will clean up the remaining Material-UI and Radix UI imports
 * that were missed in the first consolidation pass.
 */

const fs = require('fs');
const path = require('path');

// Files that still need cleanup
const filesToClean = [
  'src/components/demo/ChromeExtensionDemo.tsx',
  'src/components/demo/EnhancedChromeExtensionDemo.tsx',
  'src/components/scroll-area.tsx',
  'src/components/select.tsx',
  'src/components/tabs.tsx',
  'src/components/toast.tsx',
  'src/components/ui/popup/PopupContainer.tsx',
  'src/themes/chromeExtensionTheme.ts'
];

// Chakra UI replacements for Material-UI icons
const iconReplacements = {
  'ExtensionIcon': 'Extension',
  'CloseIcon': 'Close',
  'LaunchIcon': 'ExternalLink',
  'IntegrationInstructionsIcon': 'Code',
  'CompareArrowsIcon': 'ArrowRightLeft',
  'RefreshIcon': 'RefreshCw',
  'SettingsIcon': 'Settings',
  'DarkModeIcon': 'Moon',
  'LightModeIcon': 'Sun',
  'BugReportIcon': 'Bug',
  'KeyboardIcon': 'Keyboard',
  'HelpIcon': 'HelpCircle',
  'DashboardIcon': 'LayoutDashboard',
  'LanguageIcon': 'Globe',
  'AutoAwesomeIcon': 'Sparkles',
  'BuildIcon': 'Wrench',
  'MonitorIcon': 'Monitor',
  'HistoryIcon': 'Clock',
  'CodeIcon': 'Code',
  'StorageIcon': 'HardDrive',
  'SecurityIcon': 'Shield',
  'SpeedIcon': 'Zap'
};

// Function to clean up a file
function cleanFile(filePath) {
  const fullPath = path.join(__dirname, 'apps', 'frontend', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`  ⚠️  File not found: ${filePath}`);
    return false;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let updated = content;
  
  // Handle ChromeExtensionDemo files
  if (filePath.includes('ChromeExtensionDemo')) {
    // Remove all Material-UI imports
    updated = updated.replace(/import\s+.*\s+from\s+["']@mui\/material["'];?/g, '');
    updated = updated.replace(/import\s+.*\s+from\s+["']@mui\/icons-material["'];?/g, '');
    
    // Replace icon usage with Chakra UI icons
    Object.keys(iconReplacements).forEach(oldIcon => {
      const newIcon = iconReplacements[oldIcon];
      const regex = new RegExp(`<${oldIcon}`, 'g');
      updated = updated.replace(regex, `<${newIcon}`);
    });
  }
  
  // Handle scroll-area.tsx
  if (filePath === 'src/components/scroll-area.tsx') {
    // Remove Radix UI import and replace with Chakra UI
    updated = updated.replace(/import\s+.*ScrollAreaPrimitive.*from\s+['"]@radix-ui\/react-scroll-area['"];?/g, '');
    updated = updated.replace(/ScrollAreaPrimitive/g, 'ScrollArea');
  }
  
  // Handle select.tsx  
  if (filePath === 'src/components/select.tsx') {
    // Remove Radix UI import and replace with Chakra UI
    updated = updated.replace(/import\s+.*SelectPrimitive.*from\s+['"]@radix-ui\/react-select['"];?/g, '');
    updated = updated.replace(/SelectPrimitive/g, 'Select');
  }
  
  // Handle tabs.tsx
  if (filePath === 'src/components/tabs.tsx') {
    // Remove Radix UI import and replace with Chakra UI
    updated = updated.replace(/import\s+.*TabsPrimitive.*from\s+['"]@radix-ui\/react-tabs['"];?/g, '');
    updated = updated.replace(/TabsPrimitive/g, 'Tabs');
  }
  
  // Handle toast.tsx
  if (filePath === 'src/components/toast.tsx') {
    // Remove Radix UI import and replace with Chakra UI
    updated = updated.replace(/import\s+.*ToastPrimitives.*from\s+['"]@radix-ui\/react-toast['"];?/g, '');
    updated = updated.replace(/ToastPrimitives/g, 'Toast');
  }
  
  // Handle PopupContainer
  if (filePath === 'src/components/ui/popup/PopupContainer.tsx') {
    // Remove all Material-UI icon imports
    Object.keys(iconReplacements).forEach(icon => {
      const importRegex = new RegExp(`import\\s+${icon}\\s+from\\s+["']@mui\\/icons-material\\/${icon.replace('Icon', '')}["'];?\\s*`, 'g');
      updated = updated.replace(importRegex, '');
      
      // Replace icon usage
      const newIcon = iconReplacements[icon];
      const usageRegex = new RegExp(`<${icon}`, 'g');
      updated = updated.replace(usageRegex, `<${newIcon}`);
    });
  }
  
  // Handle chromeExtensionTheme.ts
  if (filePath === 'src/themes/chromeExtensionTheme.ts') {
    // Replace Material-UI theme with Chakra UI theme
    updated = updated.replace(/import\s+{.*createTheme.*}\s+from\s+['"]@mui\/material\/styles['"];?/g, '');
    updated = updated.replace(/createTheme\([^)]*\)/g, 'createChakraTheme()');
    
    // Add Chakra UI theme import
    if (!updated.includes('@chakra-ui/react')) {
      updated = `import { extendTheme } from '@chakra-ui/react';\n\n${updated}`;
    }
  }
  
  // Clean up multiple consecutive empty lines
  updated = updated.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  // Only write if changes were made
  if (updated !== content) {
    fs.writeFileSync(fullPath, updated);
    console.log(`  ✅ Cleaned: ${filePath}`);
    return true;
  } else {
    console.log(`  ℹ️  No changes needed: ${filePath}`);
    return false;
  }
}

// Main function
function finalCleanup() {
  console.log('🧹 Starting Final UI Library Cleanup...');
  
  let filesCleaned = 0;
  
  filesToClean.forEach(file => {
    if (cleanFile(file)) {
      filesCleaned++;
    }
  });
  
  console.log(`\n📊 Final Cleanup Summary:`);
  console.log(`  🔄 Files processed: ${filesToClean.length}`);
  console.log(`  ✅ Files cleaned: ${filesCleaned}`);
  
  return filesCleaned;
}

// Run the cleanup
if (require.main === module) {
  try {
    finalCleanup();
    process.exit(0);
  } catch (error) {
    console.error('❌ Final cleanup failed:', error);
    process.exit(1);
  }
}

module.exports = { finalCleanup };