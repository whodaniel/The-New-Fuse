#!/usr/bin/env node

/**
 * Script to fix path aliases in TypeScript imports
 */

import fs from 'fs';
import path from 'path';
import { execSync  } from 'child_process';

// Find all TypeScript files recursively
function findTypescriptFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory() && !filePath.includes('node_modules')) {
      fileList = findTypescriptFiles(filePath, fileList);
    } else if (filePath.match(/\.(ts|tsx)$/)) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Fix imports in TypeScript files
function fixImportsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Fix @the-new-fuse/types imports
  const oldTypeImports = content.match(/from ['"]@\/types\/@the-new-fuse\/types['"]/g);
  if (oldTypeImports) {
    content = content.replace(
      /from ['"]@\/types\/@the-new-fuse\/types['"]/g,
      'from \'@the-new-fuse/types\''
    );
    changed = true;
  }

  // Fix @fuse/core imports
  const oldCoreImports = content.match(/from ['"]@\/core['"]/g) || content.match(/from ['"]@fuse\/core['"]/g);
  if (oldCoreImports) {
    content = content.replace(
      /from ['"]@\/core['"]/g,
      'from \'@the-new-fuse/core\''
    ).replace(
      /from ['"]@fuse\/core['"]/g,
      'from \'@the-new-fuse/core\''
    );
    changed = true;
  }

  if (changed) {
    
    fs.writeFileSync(filePath, content, 'utf8');
  }
}

try {

  const srcDir = path.join(process.cwd(), 'src');
  if (fs.existsSync(srcDir)) {
    const files = findTypescriptFiles(srcDir);

    files.forEach(file => {
      fixImportsInFile(file);
    });
  }
  
  // Also check packages directories
  const packagesDir = path.join(process.cwd(), 'packages');
  if (fs.existsSync(packagesDir)) {
    const packages = fs.readdirSync(packagesDir)
      .filter(pkg => fs.statSync(path.join(packagesDir, pkg)).isDirectory());
    
    packages.forEach(pkg => {
      const pkgSrcDir = path.join(packagesDir, pkg, 'src');
      if (fs.existsSync(pkgSrcDir)) {
        const files = findTypescriptFiles(pkgSrcDir);

        files.forEach(file => {
          fixImportsInFile(file);
        });
      }
    });
  }

} catch (error) {
  console.error('Error fixing path aliases:', error);
  process.exit(1);
}
