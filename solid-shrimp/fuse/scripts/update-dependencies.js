import fs from 'fs';
import path from 'path';
import { globSync } from 'glob';

// Find all package.json files in the workspace
const packageJsonFiles = globSync('**/package.json', {
  ignore: ['**/node_modules/**', 'package.json'],
});

packageJsonFiles.forEach(filePath => {
  if (filePath === 'packages/api-client/package.json') {
    // Skip the package we've renamed
    return;
  }

  const packageJsonPath = path.join(process.cwd(), filePath);
  const packageJsonString = fs.readFileSync(packageJsonPath, 'utf-8');
  const packageJson = JSON.parse(packageJsonString);
  let updated = false;

  // Check various dependency types
  ['dependencies', 'devDependencies', 'peerDependencies'].forEach(depType => {
    if (packageJson[depType] && packageJson[depType]['@the-new-fuse/api']) {
      const version = packageJson[depType]['@the-new-fuse/api'];
      delete packageJson[depType]['@the-new-fuse/api'];
      packageJson[depType]['@the-new-fuse/api-client'] = version;
      updated = true;
    }
  });

  if (updated) {
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  }
});

