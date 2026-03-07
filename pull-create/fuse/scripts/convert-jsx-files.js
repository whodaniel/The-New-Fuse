const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Function to check if a file contains JSX
function containsJSX(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.includes('<') && content.includes('/>') && content.includes('className=');
  } catch (error) {
    console.error(`Error reading file ${filePath}: ${error.message}`);
    return false;
  }
}

// Function to convert a .ts file to .tsx
function convertToTSX(filePath) {
  try {
    if (!containsJSX(filePath)) {
      return false;
    }

    const dirName = path.dirname(filePath);
    const baseName = path.basename(filePath, '.ts');
    const newPath = path.join(dirName, `${baseName}.tsx`);

    // Copy the file content
    const content = fs.readFileSync(filePath, 'utf8');
    fs.writeFileSync(newPath, content);

    console.log(`Converted ${filePath} to ${newPath}`);
    return true;
  } catch (error) {
    console.error(`Error converting file ${filePath}: ${error.message}`);
    return false;
  }
}

// Main function
function main() {
  try {
    // Find all .ts files in the src directory
    const output = execSync('find ./src -name "*.ts" -not -path "*/node_modules/*"').toString();
    const files = output.split('\n').filter(Boolean);

    let convertedCount = 0;
    for (const file of files) {
      if (convertToTSX(file)) {
        convertedCount++;
      }
    }

    console.log(`\nConverted ${convertedCount} files from .ts to .tsx`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

main();
