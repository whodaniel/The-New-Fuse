#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all TypeScript files in build-optimization package
const files = glob.sync('packages/build-optimization/src/**/*.ts');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace .js imports with no extension (TypeScript will resolve them)
  content = content.replace(/from\s+['"]([^'"]+)\.js['"]/g, "from '$1'");
  
  fs.writeFileSync(file, content);
  console.log(`Fixed imports in ${file}`);
});

console.log(`Fixed imports in ${files.length} files`);