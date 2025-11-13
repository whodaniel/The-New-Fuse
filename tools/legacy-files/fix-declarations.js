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
  content = content.replace(/\): any:/g, '): any');
  
  // Fix other common syntax errors
  content = content.replace(/\[\]: any:/g, '[]): any');
  content = content.replace(/\): any: {/g, '): any & {');
  content = content.replace(/\): any: \[/g, '): any & [');
  
  // Write the fixed content back to the file
  fs.writeFileSync(filePath, content, 'utf8');
}

// Main function
function main() {
  const frontendDir = path.join(__dirname, 'apps', 'frontend', 'src');
  const dtsFiles = findDtsFiles(frontendDir);
  
  console.log(`Found ${dtsFiles.length} .d.ts files to fix`);
  
  dtsFiles.forEach(file => {
    fixDeclarationFile(file);
  });
  
  console.log('All declaration files fixed!');
}

main();
