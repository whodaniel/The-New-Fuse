#!/usr/bin/env node
/* eslint-env node */

/**
 * Add Clean Scripts to Packages Without Them
 */

const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();

const packagesNeedingClean = [
  'packages/contracts/package.json',
  'packages/shared/package.json',
  'packages/build-optimization/package.json',
  'packages/core-error-handling/package.json',
  'packages/websocket-infrastructure/package.json',
  'tools/port-manager/package.json',
  'tools/vscode-lm-bridge/package.json',
  'tools/codebase-analysis/package.json',
];

console.log('Adding clean scripts to packages without them...\n');

packagesNeedingClean.forEach((relPath) => {
  const absPath = path.join(rootDir, relPath);

  if (!fs.existsSync(absPath)) {
    console.log(`⚠️  Skipping ${relPath} (file not found)`);
    return;
  }

  const packageJson = JSON.parse(fs.readFileSync(absPath, 'utf-8'));
  const packageName = packageJson.name || path.dirname(relPath);

  if (!packageJson.scripts) {
    packageJson.scripts = {};
  }

  if (packageJson.scripts.clean) {
    console.log(`ℹ️  ${packageName} already has a clean script`);
    return;
  }

  // Add clean script
  packageJson.scripts.clean = 'rimraf dist tsconfig.tsbuildinfo';

  // Write back
  fs.writeFileSync(absPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf-8');

  console.log(`✅ Added clean script to ${packageName}`);
});

console.log('\n✨ Done!');
