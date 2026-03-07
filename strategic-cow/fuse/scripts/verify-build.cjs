#!/usr/bin/env node

/**
 * Build Verification Script
 *
 * Verifies that all expected build outputs exist and are valid.
 * Used in CI/CD pipelines to ensure builds completed successfully.
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
};

function checkPath(relativePath, type = 'directory') {
  const fullPath = path.join(process.cwd(), relativePath);
  const exists = fs.existsSync(fullPath);

  if (exists) {
    if (type === 'directory') {
      const files = fs.readdirSync(fullPath);
      console.log(`${colors.green}✓${colors.reset} ${relativePath} (${files.length} files)`);
      return true;
    } else {
      console.log(`${colors.green}✓${colors.reset} ${relativePath}`);
      return true;
    }
  } else {
    console.log(`${colors.red}✗${colors.reset} ${relativePath} not found`);
    return false;
  }
}

function verifyBuilds() {
  console.log('\nVerifying Build Outputs...\n');

  const checks = [
    // Applications
    { path: 'apps/api-gateway/dist', type: 'directory', critical: true },
    { path: 'apps/frontend/dist', type: 'directory', critical: false }, // Frontend is optional

    // Core packages
    { path: 'packages/core/dist', type: 'directory', critical: false },
    { path: 'packages/types', type: 'directory', critical: false }, // Types builds to src, not dist
  ];

  let allPassed = true;
  let criticalFailed = false;

  checks.forEach(check => {
    const passed = checkPath(check.path, check.type);
    if (!passed) {
      allPassed = false;
      if (check.critical) {
        criticalFailed = true;
      }
    }
  });

  console.log('\n' + '='.repeat(50));

  if (criticalFailed) {
    console.log(`${colors.red}Build verification FAILED - critical outputs missing${colors.reset}`);
    process.exit(1);
  } else if (!allPassed) {
    console.log(`${colors.yellow}Build verification passed with warnings${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`${colors.green}Build verification PASSED${colors.reset}`);
    process.exit(0);
  }
}

verifyBuilds();
