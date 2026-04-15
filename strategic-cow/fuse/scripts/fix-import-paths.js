const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// Find all TypeScript files in the project
const tsFiles = glob.sync('packages/**/*.ts', {
  ignore: ['**/node_modules/**', '**/dist/**', '**/*.d.ts']
});

// Common import path patterns and their fixes
const importPatterns = [
  // Fix relative imports to use path aliases
  {
    pattern: /import\s+{([^}]+)}\s+from\s+['"]\.\.\/([^'"]+)['"];/g,
    replacement: (match, imports, relativePath) => {
      // Extract the package name from the file path
      const filePath = match.split('from')[1].trim().slice(1, -1);
      const parts = filePath.split('/');
      if (parts[0] === '..') {
        // Try to determine the package name
        return `import {${imports}} from '@the-new-fuse/${parts[1]}';`;
      }
      return match;
    }
  },
  // Fix case sensitivity in imports
  {
    pattern: /import\s+{([^}]+)}\s+from\s+['"]([@a-zA-Z0-9\-\/]+)['"];/g,
    replacement: (match, imports, importPath) => {
      // Normalize import path to lowercase
      return `import {${imports}} from '${importPath}';`;
    }
  },
  // Fix missing extensions in imports
  {
    pattern: /import\s+{([^}]+)}\s+from\s+['"]\.\.\/([^'"]+)['"];/g,
    replacement: (match, imports, relativePath) => {
      if (!relativePath.endsWith('.js') && !relativePath.endsWith('.ts')) {
        return `import {${imports}} from '../${relativePath}.js';
`;
      }
      return match;
    }
  },
];

// Process each file
tsFiles.forEach(filePath => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Apply each import pattern fix
    importPatterns.forEach(({ pattern, replacement }) => {
      const newContent = content.replace(pattern, replacement);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    });
    
    // Save the file if it was modified
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed import paths in ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
});

console.log('Completed fixing import paths');
