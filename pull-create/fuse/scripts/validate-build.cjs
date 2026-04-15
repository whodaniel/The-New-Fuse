#!/usr/bin/env node
/* eslint-env node */

/**
 * Build Validation Script
 * Ensures all TypeScript packages have proper declaration files after build
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = process.cwd();
const errors = [];
const warnings = [];

console.log('🔍 Validating build outputs...\n');

// Find all TypeScript packages (those with tsconfig.json)
const tsPackages = execSync(
  'find packages apps tools -maxdepth 2 -name "tsconfig.json" -type f -not -path "*/node_modules/*"',
  { encoding: 'utf-8', cwd: rootDir }
)
  .trim()
  .split('\n')
  .filter(Boolean)
  .map((p) => path.dirname(p));

console.log(`Found ${tsPackages.length} TypeScript packages\n`);

tsPackages.forEach((pkgDir) => {
  const absPath = path.join(rootDir, pkgDir);
  const packageJsonPath = path.join(absPath, 'package.json');
  const tsconfigPath = path.join(absPath, 'tsconfig.json');

  if (!fs.existsSync(packageJsonPath)) {
    return;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const packageName = packageJson.name || pkgDir;

  // Skip if no build script
  if (!packageJson.scripts?.build) {
    return;
  }

  // Read tsconfig
  let tsconfig;
  try {
    const tsconfigContent = fs.readFileSync(tsconfigPath, 'utf-8');
    // Simple JSON parse (ignoring comments for simplicity)
    tsconfig = JSON.parse(tsconfigContent.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, ''));
  } catch (e) {
    warnings.push(`⚠️  ${packageName}: Could not parse tsconfig.json`);
    return;
  }

  // Check if declaration files should be generated
  const shouldGenerateDeclarations = tsconfig?.compilerOptions?.declaration !== false;

  if (!shouldGenerateDeclarations) {
    return; // Skip packages that don't generate declarations
  }

  // Get output directory
  const outDir = tsconfig?.compilerOptions?.outDir || 'dist';
  const distPath = path.join(absPath, outDir);

  // Check if dist exists
  if (!fs.existsSync(distPath)) {
    warnings.push(
      `⚠️  ${packageName}: Output directory '${outDir}' does not exist (may not have been built yet)`
    );
    return;
  }

  // Check for .d.ts files
  const hasDeclarationFiles =
    execSync(`find "${distPath}" -name "*.d.ts" 2>/dev/null | head -1`, {
      encoding: 'utf-8',
      cwd: rootDir,
    }).trim().length > 0;

  if (!hasDeclarationFiles) {
    errors.push(
      `❌ ${packageName}: No .d.ts files found in '${outDir}' but declaration=true in tsconfig`
    );
  }

  // Check for stale tsconfig.tsbuildinfo
  const tsbuildInfoPath = path.join(absPath, 'tsconfig.tsbuildinfo');
  if (fs.existsSync(tsbuildInfoPath) && !fs.existsSync(path.join(distPath, 'index.js'))) {
    warnings.push(
      `⚠️  ${packageName}: Has tsconfig.tsbuildinfo but no build outputs - possible stale cache`
    );
  }
});

// Report
console.log('=== VALIDATION RESULTS ===\n');

if (errors.length > 0) {
  console.log('❌ ERRORS:\n');
  errors.forEach((err) => console.log(`  ${err}`));
  console.log('');
}

if (warnings.length > 0) {
  console.log('⚠️  WARNINGS:\n');
  warnings.forEach((warn) => console.log(`  ${warn}`));
  console.log('');
}

if (errors.length === 0 && warnings.length === 0) {
  console.log('✅ All validations passed!\n');
  process.exit(0);
} else {
  console.log('=== SUMMARY ===');
  console.log(`Errors: ${errors.length}`);
  console.log(`Warnings: ${warnings.length}`);
  console.log('');

  if (errors.length > 0) {
    console.log('💡 TIP: Run `pnpm clean && pnpm build` to regenerate missing declaration files');
    process.exit(1);
  } else {
    process.exit(0);
  }
}
