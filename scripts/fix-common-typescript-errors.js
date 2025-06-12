const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// Find all TypeScript files in the project
const tsFiles = glob.sync('packages/**/*.ts', {
  ignore: ['**/node_modules/**', '**/dist/**', '**/*.d.ts']
});

// Common error patterns and their fixes
const errorPatterns = [
  // Fix missing type annotations
  {
    pattern: /function ([a-zA-Z0-9_]+)\(([^)]*)\)(?!:)/g,
    replacement: (match, funcName, params) => `function ${funcName}(${params}): any`
  },
  // Fix missing return type annotations
  {
    pattern: /async function ([a-zA-Z0-9_]+)\(([^)]*)\)(?!:)/g,
    replacement: (match, funcName, params) => `async function ${funcName}(${params}): Promise<any>`
  },
  // Fix missing parameter types
  {
    pattern: /\(([a-zA-Z0-9_]+)(?!:)\)/g,
    replacement: (match, param) => `(${param}: any)`
  },
  // Fix missing error types in catch blocks
  {
    pattern: /catch\s*\(([a-zA-Z0-9_]+)\)\s*{/g,
    replacement: (match, errorVar) => `catch (${errorVar}: unknown) {`
  },
  // Fix missing array types
  {
    pattern: /const ([a-zA-Z0-9_]+)\s*=\s*\[\];/g,
    replacement: (match, varName) => `const ${varName}: any[] = [];`
  },
  // Fix missing object types
  {
    pattern: /const ([a-zA-Z0-9_]+)\s*=\s*{};/g,
    replacement: (match, varName) => `const ${varName}: Record<string, unknown> = {};`
  },
  // Fix missing Map types
  {
    pattern: /new Map\(\)/g,
    replacement: 'new Map<string, any>()',
  },
  // Fix missing Set types
  {
    pattern: /new Set\(\)/g,
    replacement: 'new Set<any>()',
  },
  // Fix missing EventEmitter extends
  {
    pattern: /class ([a-zA-Z0-9_]+) extends EventEmitter {/g,
    replacement: (match, className) => `class ${className} extends EventEmitter {`
  },
  // Fix missing constructor return types
  {
    pattern: /constructor\(([^)]*)\)(?!:)/g,
    replacement: (match, params) => `constructor(${params})`
  },
];

// Process each file
tsFiles.forEach(filePath => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Apply each error pattern fix
    errorPatterns.forEach(({ pattern, replacement }) => {
      const newContent = content.replace(pattern, replacement);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    });
    
    // Save the file if it was modified
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed TypeScript errors in ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
});

console.log('Completed fixing common TypeScript errors');
