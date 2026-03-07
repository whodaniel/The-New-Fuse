import fs from 'fs';

// Read the package.json file
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Ensure name field is correct
if (!packageJson.name || packageJson.name !== 'the-new-fuse') {
  packageJson.name = 'the-new-fuse';
  
}

// Ensure correct workspace configuration
if (!packageJson.workspaces || !Array.isArray(packageJson.workspaces)) {
  packageJson.workspaces = ['apps/*', 'packages/*'];
  
}

// Write the updated package.json
fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2), 'utf8');

