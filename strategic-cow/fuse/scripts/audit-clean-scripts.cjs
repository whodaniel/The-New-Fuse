#!/usr/bin/env node
/* eslint-env node */

/**
 * Audit and Update Clean Scripts
 * This script ensures all packages have proper clean scripts that remove tsconfig.tsbuildinfo
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = process.cwd();

// Find all package.json files
const packageJsonFiles = execSync(
  'find packages apps tools -maxdepth 2 -name "package.json" -type f -not -path "*/node_modules/*"',
  { encoding: 'utf-8', cwd: rootDir }
)
  .trim()
  .split('\n')
  .filter(Boolean);

console.log(`Found ${packageJsonFiles.length} packages to audit\n`);

const updates = [];
const alreadyGood = [];
const noCleanScript = [];

packageJsonFiles.forEach((relPath) => {
  const absPath = path.join(rootDir, relPath);
  const packageJson = JSON.parse(fs.readFileSync(absPath, 'utf-8'));
  const packageName = packageJson.name || path.dirname(relPath);

  if (!packageJson.scripts?.clean) {
    noCleanScript.push({ name: packageName, path: relPath });
    return;
  }

  const cleanScript = packageJson.scripts.clean;

  // Check if it already includes tsconfig.tsbuildinfo
  if (cleanScript.includes('tsconfig.tsbuildinfo')) {
    alreadyGood.push({ name: packageName, script: cleanScript });
    return;
  }

  // Update the clean script to include tsconfig.tsbuildinfo
  const updatedScript = cleanScript.includes('rimraf')
    ? `${cleanScript} tsconfig.tsbuildinfo`
    : `${cleanScript} && rm -f tsconfig.tsbuildinfo`;

  packageJson.scripts.clean = updatedScript;

  // Write back
  fs.writeFileSync(absPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf-8');

  updates.push({
    name: packageName,
    path: relPath,
    old: cleanScript,
    new: updatedScript,
  });
});

// Report
console.log('=== AUDIT RESULTS ===\n');

console.log(`✅ Already Good (${alreadyGood.length}):`);
alreadyGood.forEach(({ name }) => console.log(`  - ${name}`));

console.log(`\n📝 Updated (${updates.length}):`);
updates.forEach(({ name, old, new: newScript }) => {
  console.log(`  - ${name}`);
  console.log(`    Old: ${old}`);
  console.log(`    New: ${newScript}`);
});

console.log(`\n⚠️  No Clean Script (${noCleanScript.length}):`);
noCleanScript.forEach(({ name, path: p }) => {
  console.log(`  - ${name} (${p})`);
});

console.log(`\n=== SUMMARY ===`);
console.log(`Total packages: ${packageJsonFiles.length}`);
console.log(`Already good: ${alreadyGood.length}`);
console.log(`Updated: ${updates.length}`);
console.log(`No clean script: ${noCleanScript.length}`);

if (updates.length > 0) {
  console.log(`\n✨ Successfully updated ${updates.length} package(s)!`);
}
