const fs = require('fs');
const path = require('path');

// Function to recursively find all .d.ts files in a directory
function findDtsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findDtsFiles(filePath, fileList);
    } else if (file.endsWith('.d.ts')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Function to fix the declaration files
function fixDeclarationFile(filePath) {
  console.log(`Fixing ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace incorrect syntax ': any:' with ': any'
  if (content.includes('): any:')) {
    content = content.replace(/\): any:/g, '): any');
    console.log(`  Fixed "): any:" pattern in ${filePath}`);
  }
  
  // Write the fixed content back to the file
  fs.writeFileSync(filePath, content, 'utf8');
}

// Main function
function main() {
  const frontendDir = path.join(__dirname, 'apps', 'frontend', 'src');
  console.log(`Searching for .d.ts files in ${frontendDir}`);
  
  const dtsFiles = findDtsFiles(frontendDir);
  console.log(`Found ${dtsFiles.length} .d.ts files to check`);
  
  let fixedCount = 0;
  dtsFiles.forEach(file => {
    const originalContent = fs.readFileSync(file, 'utf8');
    fixDeclarationFile(file);
    const newContent = fs.readFileSync(file, 'utf8');
    
    if (originalContent !== newContent) {
      fixedCount++;
    }
  });
  
  console.log(`Fixed ${fixedCount} declaration files!`);
}

main();
