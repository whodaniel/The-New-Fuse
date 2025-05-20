#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Update package.json to use TypeScript 5.3.3 (a more widely available version)
function updateRootPackageJson() {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    return;
  }
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Update TypeScript version in resolutions and devDependencies
    if (packageJson.resolutions) {
      packageJson.resolutions.typescript = "5.3.3";
    }
    
    if (packageJson.devDependencies && packageJson.devDependencies.typescript) {
      packageJson.devDependencies.typescript = "^5.3.3";
    }
    
    // Write updated package.json
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('Updated TypeScript version in root package.json');
    
  } catch (err) {
    console.error('Error updating package.json:', err);
  }
}

// Create .npmrc file to allow legacy peer deps
function createNpmrc() {
  const npmrcPath = path.join(process.cwd(), '.npmrc');
  
  try {
    fs.writeFileSync(npmrcPath, 'legacy-peer-deps=true\n');
  } catch (err) {
    console.error('Error creating .npmrc:', err);
  }
}

// Temporary fix for direct TypeScript checks
function createDirectTscScript() {
  const scriptPath = path.join(process.cwd(), 'scripts', 'direct-tsc.js');
  
  try {
    fs.writeFileSync(scriptPath, `#!/usr/bin/env node
const { spawnSync } = require('child_process');
const fs = require('fs');

// Install TypeScript directly with npm
spawnSync('npm', ['install', '--no-save', 'typescript@5.3.3', '--force'], { 
  stdio: 'inherit',
  shell: true 
});

// Create a minimal tsconfig if needed
if (!fs.existsSync('tsconfig-minimal.json')) {
  fs.writeFileSync('tsconfig-minimal.json', JSON.stringify({
    compilerOptions: {
      target: "es2016",
      module: "commonjs",
      esModuleInterop: true,
      skipLibCheck: true,
      strict: false,
      noImplicitAny: false
    },
    include: ["src/**/*"],
    exclude: ["node_modules"]
  }, null, 2));
}

// Run TypeScript check
spawnSync('npx', ['tsc', '--project', 'tsconfig-minimal.json', '--noEmit'], {
  stdio: 'inherit',
  shell: true
});
`);
    
    // Make executable
    fs.chmodSync(scriptPath, '755');
    console.log('Created direct TypeScript check script with updated version');
    
  } catch (err) {
    console.error('Error creating direct-tsc.js:', err);
  }
}

// Fix Angular DevKit dependencies
function fixAngularDevkitDependencies() {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    return;
  }
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Add Angular DevKit resolutions 
    if (!packageJson.resolutions) {
      packageJson.resolutions = {};
    }
    
    // Set specific versions to ensure compatibility
    packageJson.resolutions["@angular-devkit/core"] = "15.2.9";
    packageJson.resolutions["@angular-devkit/schematics"] = "15.2.9";
    packageJson.resolutions["@nestjs/schematics"] = "9.2.0";
    packageJson.resolutions["rxjs"] = "7.8.1";
    
    // Update or add overrides if needed
    if (!packageJson.overrides) {
      packageJson.overrides = {};
    }
    
    packageJson.overrides["@angular-devkit/core"] = "15.2.9";
    packageJson.overrides["@angular-devkit/schematics"] = "15.2.9";
    
    // Write updated package.json
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    
    console.log('Fixed Angular DevKit dependencies in package.json');
  } catch (err) {
    console.error('Error updating package.json for Angular DevKit:', err);
  }
}

// Fix API core package dependencies
function fixApiCorePackage() {
  const apiPackageJsonPath = path.join(process.cwd(), 'packages', 'api', 'package.json');
  
  if (!fs.existsSync(apiPackageJsonPath)) {
    console.log('API package.json not found at expected path');
    return;
  }
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(apiPackageJsonPath, 'utf8'));
    
    // Add direct dependencies to ensure they're installed correctly
    packageJson.dependencies = packageJson.dependencies || {};
    packageJson.dependencies["@angular-devkit/core"] = "15.2.9";
    packageJson.dependencies["@angular-devkit/schematics"] = "15.2.9";
    
    // Update NestJS schematics to a compatible version
    if (packageJson.devDependencies && packageJson.devDependencies["@nestjs/schematics"]) {
      packageJson.devDependencies["@nestjs/schematics"] = "9.2.0";
    }
    
    // Make sure rxjs version is compatible
    if (packageJson.dependencies && packageJson.dependencies["rxjs"]) {
      packageJson.dependencies["rxjs"] = "7.8.1";
    }
    
    // Remove resolutions section if it exists (it's not supported in workspaces)
    delete packageJson.resolutions;
    
    // Write updated package.json
    fs.writeFileSync(apiPackageJsonPath, JSON.stringify(packageJson, null, 2));
    
    console.log('Fixed dependencies in API package.json');
  } catch (err) {
    console.error('Error updating API package.json:', err);
  }
}

updateRootPackageJson();
createNpmrc();
createDirectTscScript();
fixAngularDevkitDependencies();
fixApiCorePackage();

