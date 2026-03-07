import fs from 'fs';
import path from 'path';

// Function to check if a file has TypeScript syntax errors
function checkTSFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');

    // Check for common TypeScript syntax errors
    const errors = [];

    // Check for missing semicolons
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Check for missing property names in decorators
      if (line.match(/@\w+\(.*\):\s*\w+;/) && !line.match(/@\w+\(.*\)\s+\w+:\s*\w+;/)) {
        errors.push(`Line ${i + 1}: Missing property name in decorator: ${line}`);
      }
    }

    return errors;
  } catch (error) {
    return [`Error reading file: ${error.message}`];
  }
}

// Function to recursively find all TypeScript files in a directory
function findTSFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);

    if (fs.statSync(filePath).isDirectory()) {
      findTSFiles(filePath, fileList);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Main function
function main() {
  const srcDir = './src';
  const tsFiles = findTSFiles(srcDir);

  let totalErrors = 0;

  tsFiles.forEach(file => {
    const errors = checkTSFile(file);

    if (errors.length > 0) {
      console.log(`\nErrors in ${file}:`);
      errors.forEach(error => console.log(`  ${error}`));
      totalErrors += errors.length;
    }
  });

  console.log(`\nFound ${totalErrors} errors in ${tsFiles.length} files.`);
}

main();
