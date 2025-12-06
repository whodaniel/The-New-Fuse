#!/usr/bin/env node
/* eslint-env node */

/**
 * Pre-commit Hook for Clean Script Validation
 * Ensures all packages have proper clean scripts that remove tsconfig.tsbuildinfo
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = process.cwd();
const errors = [];

console.log('🔍 Validating clean scripts in modified package.json files...\n');

// Get staged package.json files
let stagedFiles;
try {
  stagedFiles = execSync('git diff --cached --name-only --diff-filter=ACM', {
    encoding: 'utf-8',
    cwd: rootDir,
  })
    .trim()
    .split('\n')
    .filter((f) => f.endsWith('package.json') && !f.includes('node_modules'));
} catch (e) {
  // No staged files or git error
  console.log('ℹ️  No staged package.json files to check');
  process.exit(0);
}

if (stagedFiles.length === 0) {
  console.log('ℹ️  No staged package.json files to check');
  process.exit(0);
}

console.log(`Checking ${stagedFiles.length} staged package.json file(s)\n`);

stagedFiles.forEach((relPath) => {
  const absPath = path.join(rootDir, relPath);

  if (!fs.existsSync(absPath)) {
    return; // File was deleted
  }

  let packageJson;
  try {
    packageJson = JSON.parse(fs.readFileSync(absPath, 'utf-8'));
  } catch (e) {
    errors.push(`❌ ${relPath}: Invalid JSON`);
    return;
  }

  const packageName = packageJson.name || relPath;

  // Skip root package.json
  if (relPath === 'package.json') {
    return;
  }

  // If package has a build script, it should have a clean script
  if (packageJson.scripts?.build && !packageJson.scripts?.clean) {
    errors.push(
      `❌ ${packageName}: Has 'build' script but no 'clean' script. Add: "clean": "rimraf dist tsconfig.tsbuildinfo"`
    );
    return;
  }

  // If package has a clean script, it should include tsconfig.tsbuildinfo
  if (packageJson.scripts?.clean && !packageJson.scripts.clean.includes('tsconfig.tsbuildinfo')) {
    errors.push(
      `❌ ${packageName}: 'clean' script should include 'tsconfig.tsbuildinfo'. Current: "${packageJson.scripts.clean}"`
    );
  }
});

// Report
if (errors.length > 0) {
  console.log('❌ VALIDATION FAILED:\n');
  errors.forEach((err) => console.log(`  ${err}`));
  console.log('\n💡 TIP: Run `node scripts/audit-clean-scripts.cjs` to auto-fix these issues\n');
  process.exit(1);
} else {
  console.log('✅ All clean scripts are properly configured!\n');
  process.exit(0);
}
