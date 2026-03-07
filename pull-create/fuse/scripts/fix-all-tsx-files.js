const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get a list of all .ts files
const findTsFiles = () => {
  try {
    const output = execSync('find src -name "*.ts" -type f').toString();
    return output.split('\n').filter(Boolean);
  } catch (error) {
    console.error('Error finding .ts files:', error);
    return [];
  }
};

// Check if a file contains JSX syntax
const containsJsx = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return /<[A-Za-z][A-Za-z0-9]*(\s+[^>]*)?\/?>/.test(content);
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return false;
  }
};

// Create a .tsx file with the same content
const createTsxFile = (tsFilePath) => {
  try {
    const tsxFilePath = tsFilePath.replace(/\.ts$/, '.tsx');
    fs.copyFileSync(tsFilePath, tsxFilePath);
    console.log(`Created ${tsxFilePath}`);
    
    // Update the original .ts file to export from the .tsx file
    const relativePath = './' + path.basename(tsxFilePath);
    fs.writeFileSync(tsFilePath, `export * from '${relativePath}';\n`);
    console.log(`Updated ${tsFilePath} to export from ${relativePath}`);
    
    return true;
  } catch (error) {
    console.error(`Error creating .tsx file for ${tsFilePath}:`, error);
    return false;
  }
};

// Main function
const main = () => {
  const tsFiles = findTsFiles();
  console.log(`Found ${tsFiles.length} .ts files`);
  
  let convertedCount = 0;
  
  for (const tsFile of tsFiles) {
    if (containsJsx(tsFile)) {
      console.log(`${tsFile} contains JSX syntax`);
      if (createTsxFile(tsFile)) {
        convertedCount++;
      }
    }
  }
  
  console.log(`Converted ${convertedCount} files to .tsx`);
};

main();
