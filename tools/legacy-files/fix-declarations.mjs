import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  console.log(`Checking ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');
  let fixed = false;

  // Replace incorrect syntax ': any:' with ': any'
  if (content.includes('): any:')) {
    console.log(`  Fixing '): any:' pattern in ${filePath}`);
    content = content.replace(/\): any:/g, '): any');
    fixed = true;
  }

  // Fix other common syntax errors
  if (content.includes('[]): any:')) {
    console.log(`  Fixing '[]): any:' pattern in ${filePath}`);
    content = content.replace(/\[\]\): any:/g, '[]): any');
    fixed = true;
  }

  if (content.includes('): any: {')) {
    console.log(`  Fixing '): any: {' pattern in ${filePath}`);
    content = content.replace(/\)\: any\: \{/g, '): any & {');
    fixed = true;
  }

  if (content.includes('): any: [')) {
    console.log(`  Fixing '): any: [' pattern in ${filePath}`);
    content = content.replace(/\)\: any\: \[/g, '): any & [');
    fixed = true;
  }

  if (content.includes('): any: void')) {
    console.log(`  Fixing '): any: void' pattern in ${filePath}`);
    content = content.replace(/\)\: any\: void/g, '): void');
    fixed = true;
  }

  if (content.includes('): any: string')) {
    console.log(`  Fixing '): any: string' pattern in ${filePath}`);
    content = content.replace(/\)\: any\: string/g, '): string');
    fixed = true;
  }

  if (content.includes('): any: boolean')) {
    console.log(`  Fixing '): any: boolean' pattern in ${filePath}`);
    content = content.replace(/\)\: any\: boolean/g, '): boolean');
    fixed = true;
  }

  if (fixed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  Fixed ${filePath}`);
    return true;
  }

  return false;
}

// Main function
function main() {
  console.log('🔍 Searching for TypeScript declaration files with syntax errors...');

  // Search in all relevant directories
  const directories = [
    path.join(__dirname, 'apps'),
    path.join(__dirname, 'packages'),
    path.join(__dirname, 'src')
  ];

  let totalFiles = 0;
  let fixedFiles = 0;

  directories.forEach(dir => {
    if (fs.existsSync(dir)) {
      console.log(`Searching in ${dir}...`);
      const dtsFiles = findDtsFiles(dir);
      totalFiles += dtsFiles.length;

      dtsFiles.forEach(file => {
        if (fixDeclarationFile(file)) {
          fixedFiles++;
        }
      });
    } else {
      console.log(`Directory does not exist: ${dir}`);
    }
  });

  console.log(`\n✅ Checked ${totalFiles} declaration files and fixed ${fixedFiles} files with syntax errors.`);

  if (fixedFiles > 0) {
    console.log('\n🚀 You can now try building the project again.');
  } else {
    console.log('\n🔍 No syntax errors found in declaration files.');
  }
}

main();
