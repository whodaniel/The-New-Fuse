const fs = require('fs');
const path = require('path');

// Function to recursively find all package.json files
function findPackageJsonFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && file !== 'node_modules' && file !== '.git') {
      findPackageJsonFiles(filePath, fileList);
    } else if (file === 'package.json') {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Function to fix workspace references in a package.json file
function fixWorkspaceRefs(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let packageJson;
  
  try {
    packageJson = JSON.parse(content);
  } catch (e) {
    console.log(`Error parsing ${filePath}: ${e.message}`);
    return false;
  }
  
  let modified = false;
  
  // Check dependencies
  if (packageJson.dependencies) {
    Object.keys(packageJson.dependencies).forEach(dep => {
      const version = packageJson.dependencies[dep];
      if (typeof version === 'string' && version.startsWith('workspace:')) {
        packageJson.dependencies[dep] = '*';
        modified = true;
        console.log(`Fixed dependency ${dep} in ${filePath}`);
      }
    });
  }
  
  // Check devDependencies
  if (packageJson.devDependencies) {
    Object.keys(packageJson.devDependencies).forEach(dep => {
      const version = packageJson.devDependencies[dep];
      if (typeof version === 'string' && version.startsWith('workspace:')) {
        packageJson.devDependencies[dep] = '*';
        modified = true;
        console.log(`Fixed devDependency ${dep} in ${filePath}`);
      }
    });
  }
  
  // Check peerDependencies
  if (packageJson.peerDependencies) {
    Object.keys(packageJson.peerDependencies).forEach(dep => {
      const version = packageJson.peerDependencies[dep];
      if (typeof version === 'string' && version.startsWith('workspace:')) {
        packageJson.peerDependencies[dep] = '*';
        modified = true;
        console.log(`Fixed peerDependency ${dep} in ${filePath}`);
      }
    });
  }
  
  if (modified) {
    fs.writeFileSync(filePath, JSON.stringify(packageJson, null, 2), 'utf8');
    return true;
  }
  
  return false;
}

// Start at the root dir (adjust as needed)
const rootDir = process.argv[2] || '.';
const packageFiles = findPackageJsonFiles(rootDir);

console.log(`Found ${packageFiles.length} package.json files`);
let fixedCount = 0;

packageFiles.forEach(file => {
  if (fixWorkspaceRefs(file)) {
    fixedCount++;
  }
});

console.log(`Fixed workspace references in ${fixedCount} files`);