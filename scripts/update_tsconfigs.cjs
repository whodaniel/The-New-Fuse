const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');

const rootDir = process.env.TNF_ROOT_DIR
  ? path.resolve(process.env.TNF_ROOT_DIR)
  : path.resolve(__dirname, '..');

const patterns = [
  path.join(rootDir, '**/tsconfig*.json')
];

const files = patterns.flatMap(p => globSync(p, { 
  ignore: ['**/node_modules/**', '**/temp/**', '**/dist/**', '**/out/**'] 
}));

console.log(`Found ${files.length} tsconfig files.`);

files.forEach(filePath => {
  try {
    const rawContent = fs.readFileSync(filePath, 'utf-8');
    let content = rawContent;
    
    // 1. Remove baseUrl: property and its value, following by optional comma and spaces
    content = content.replace(/"baseUrl"\s*:\s*"[^"]*"\s*,?\s*/g, '');
    
    // 2. Update module and moduleResolution
    // Prompt says: Update EVERY tsconfig.json and tsconfig.*.json in packages/ and apps/ to use "moduleResolution": "bundler" and "module": "ESNext"
    // And Requirement 2: Remove "baseUrl" property from EVERY tsconfig.json and tsconfig.*.json in the repository.
    
    const relativePath = path.relative(rootDir, filePath);
    const isAppOrPackage = relativePath.startsWith('apps' + path.sep) || relativePath.startsWith('packages' + path.sep);
    const isRoot = path.dirname(filePath) === rootDir;

    // Requirement 1: apps/ and packages/ (and arguably root configs that they extend)
    if (isAppOrPackage || isRoot) {
      if (content.match(/"module"\s*:\s*"[^"]*"/)) {
        content = content.replace(/"module"\s*:\s*"[^"]*"/g, '"module": "ESNext"');
      } else if (content.match(/"compilerOptions"\s*:\s*\{/)) {
        content = content.replace(/"compilerOptions"\s*:\s*\{/, '"compilerOptions": {\n    "module": "ESNext",');
      }

      if (content.match(/"moduleResolution"\s*:\s*"[^"]*"/)) {
        content = content.replace(/"moduleResolution"\s*:\s*"[^"]*"/g, '"moduleResolution": "bundler"');
      } else if (content.match(/"compilerOptions"\s*:\s*\{/)) {
        content = content.replace(/"compilerOptions"\s*:\s*\{/, '"compilerOptions": {\n    "moduleResolution": "bundler",');
      }
    }

    // Fix possible trailing comma issues after removal
    content = content.replace(/,\s*\}/g, '\n  }');
    content = content.replace(/,\s*\]/g, '\n  ]');

    if (content !== rawContent) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`Updated: ${filePath}`);
    }
  } catch (err) {
    console.error(`Error processing ${filePath}: ${err.message}`);
  }
});
