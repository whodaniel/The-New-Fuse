const fs = require('fs');
const path = require('path');

// Function to fix decorator errors in a file
function fixDecoratorErrors(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Fix missing property names after decorators
    const fixedContent = content.replace(
      /@(PrimaryGeneratedColumn|Column|CreateDateColumn|UpdateDateColumn)(\([^)]*\)):\s*([^;]+);/g,
      (match, decorator, args, type) => {
        // Extract the property name from the type
        const propertyName = type.trim().split(' ')[0];
        return `@${decorator}${args}\n  ${propertyName}: ${type};`;
      }
    );
    
    // Fix Object.assign syntax
    const finalContent = fixedContent.replace(
      /\(Object as any\)\.assign\(this, partial\);/g,
      'Object.assign(this, partial);'
    );
    
    // Fix string literals in column types
    const fixedStringLiterals = finalContent.replace(
      /type:\s*'([^']+)'/g,
      "type: '$1'"
    );
    
    // Write the fixed content back to the file
    fs.writeFileSync(filePath, fixedStringLiterals);
    
    console.log(`Fixed decorator errors in ${filePath}`);
    return true;
  } catch (error) {
    console.error(`Error fixing decorator errors in ${filePath}: ${error.message}`);
    return false;
  }
}

// Function to recursively find all TypeScript files in a directory
function findTSFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    
    if (fs.statSync(filePath).isDirectory()) {
      findTSFiles(filePath, fileList);
    } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Main function
function main() {
  const modelsDirs = [
    './packages/database/src/models',
    './apps/frontend/src/models',
    './apps/api/src/models'
  ];
  
  let totalFiles = 0;
  let fixedFiles = 0;
  
  modelsDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      const tsFiles = findTSFiles(dir);
      totalFiles += tsFiles.length;
      
      tsFiles.forEach(file => {
        if (fixDecoratorErrors(file)) {
          fixedFiles++;
        }
      });
    }
  });
  
  console.log(`\nFixed decorator errors in ${fixedFiles} out of ${totalFiles} files.`);
}

main();
