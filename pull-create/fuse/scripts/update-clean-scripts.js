#!/usr/bin/env node

/**
 * Script to ensure all packages have proper clean scripts
 * This script will add missing clean scripts to packages that need them
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Packages that should have clean scripts (those that build to dist/)
const PACKAGES_NEEDING_CLEAN = [
  'database',
  'fairtable-adapters', 
  'security',
  'relay-core',
  'contracts',
  'prompt-templating',
  'eslint-config-custom'
];

// Standard clean script
const CLEAN_SCRIPT = 'rimraf dist';

function updatePackageJson(packagePath) {
  const packageJsonPath = path.join(packagePath, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    console.log(`⚠️  No package.json found at ${packageJsonPath}`);
    return false;
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Check if package builds to dist/ or has TypeScript
    const hasTypeScript = packageJson.devDependencies?.typescript || packageJson.dependencies?.typescript;
    const hasBuildScript = packageJson.scripts?.build;
    const hasDistOutput = packageJson.main?.includes('dist/') || packageJson.types?.includes('dist/');
    
    if ((hasTypeScript || hasBuildScript || hasDistOutput) && !packageJson.scripts?.clean) {
      console.log(`✅ Adding clean script to ${packageJson.name}`);
      
      if (!packageJson.scripts) {
        packageJson.scripts = {};
      }
      
      packageJson.scripts.clean = CLEAN_SCRIPT;
      
      // Ensure rimraf is in devDependencies
      if (!packageJson.devDependencies) {
        packageJson.devDependencies = {};
      }
      
      if (!packageJson.devDependencies.rimraf) {
        packageJson.devDependencies.rimraf = '^5.0.10';
        console.log(`  📦 Added rimraf to devDependencies`);
      }
      
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
      return true;
    } else if (packageJson.scripts?.clean) {
      console.log(`✓ ${packageJson.name} already has clean script`);
      return false;
    } else {
      console.log(`⏭️  ${packageJson.name} doesn't need clean script`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error updating ${packageJsonPath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🧹 Updating clean scripts for all packages...\n');
  
  const packagesDir = path.join(__dirname, '..', 'packages');
  let updatedCount = 0;
  
  if (!fs.existsSync(packagesDir)) {
    console.error('❌ Packages directory not found');
    process.exit(1);
  }
  
  // Get all package directories
  const packageDirs = fs.readdirSync(packagesDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
  
  console.log(`Found ${packageDirs.length} packages to check\n`);
  
  // Update each package
  for (const packageDir of packageDirs) {
    const packagePath = path.join(packagesDir, packageDir);
    if (updatePackageJson(packagePath)) {
      updatedCount++;
    }
  }
  
  console.log(`\n🎉 Updated ${updatedCount} packages with clean scripts`);
  
  if (updatedCount > 0) {
    console.log('\n📋 Next steps:');
    console.log('1. Run "pnpm install" to install any new rimraf dependencies');
    console.log('2. Test the clean scripts with "pnpm run clean"');
    console.log('3. Commit the updated package.json files');
  }
}

main();