/**
 * This script installs TypeScript type dependencies needed for the VS Code extension
 * without using Yarn workspace resolution, to avoid workspace dependency issues.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Path to the temporary .yarnrc.yml file
const tempYarnConfigPath = path.join(__dirname, '.temp-yarnrc.yml');

// Create a temporary .yarnrc.yml that disables workspace resolution
const disableWorkspaceConfig = `
nodeLinker: node-modules
enableGlobalCache: false
nmMode: hardlinks-local

# Disable workspace protocols to avoid dependency resolution issues
# with packages that don't exist in the npm registry
npmScopes:
  the-new-fuse:
    npmRegistryServer: "https://registry.npmjs.org/"
    npmAlwaysAuth: false

# Do not use workspace protocols for these packages
packageExtensions:
  "*@*":
    dependencies:
      "@the-new-fuse/database": "*"

# Disable workspace features for this installation
enableWorkspaces: false
`;

console.log('Creating temporary Yarn configuration...');
fs.writeFileSync(tempYarnConfigPath, disableWorkspaceConfig, 'utf8');

try {
  console.log('Installing TypeScript type definitions...');
  
  // Install the required packages using NPM instead of Yarn
  // This avoids workspace resolution completely
  execSync('npm install --no-save @types/vscode @types/node @types/mocha @types/jest @vscode/test-electron', {
    stdio: 'inherit'
  });
  
  console.log('✅ TypeScript type definitions installed successfully!');
} catch (error) {
  console.error('❌ Failed to install TypeScript type definitions:', error.message);
} finally {
  // Clean up the temporary configuration
  if (fs.existsSync(tempYarnConfigPath)) {
    fs.unlinkSync(tempYarnConfigPath);
    console.log('Temporary Yarn configuration removed.');
  }
}