#!/usr/bin/env node

/**
 * Script to automatically add missing export configurations to packages
 *
 * Usage: node scripts/fix-package-exports.js [--dry-run] [--package=name]
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const specificPackage = args.find(arg => arg.startsWith('--package='))?.split('=')[1];

const packagesDir = path.join(__dirname, '..', 'packages');

// Packages that need fixing based on audit
const PACKAGES_TO_FIX = [
  'backend',
  'client',
  'common',
  'contracts',
  'features',
  'integrations',
  'layout',
  'monitoring'
];

function fixPackageExports(packageDir, packageName) {
  const packageJsonPath = path.join(packageDir, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    console.log(`⚠️  Skipping ${packageName}: No package.json found`);
    return false;
  }

  let pkg;
  try {
    pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  } catch (e) {
    console.log(`❌ Error reading ${packageName}/package.json:`, e.message);
    return false;
  }

  let modified = false;
  const updates = [];

  // Add main field if missing
  if (!pkg.main && !pkg.exports) {
    pkg.main = 'dist/index.js';
    updates.push('Added "main" field');
    modified = true;
  }

  // Add types field if missing
  if (!pkg.types) {
    pkg.types = 'dist/index.d.ts';
    updates.push('Added "types" field');
    modified = true;
  }

  // Add exports field if missing (modern approach)
  if (!pkg.exports) {
    // Determine module type
    const isESM = pkg.type === 'module';

    pkg.exports = {
      '.': {
        types: './dist/index.d.ts',
        import: './dist/index.js',
        require: './dist/index.js'
      }
    };
    updates.push('Added "exports" field');
    modified = true;
  }

  // Add build script if missing
  if (!pkg.scripts) {
    pkg.scripts = {};
  }

  if (!pkg.scripts.build) {
    // Check if this is a TypeScript package
    const hasTsConfig = fs.existsSync(path.join(packageDir, 'tsconfig.json'));

    if (hasTsConfig) {
      pkg.scripts.build = 'tsc';
      pkg.scripts.clean = 'rimraf dist';
      updates.push('Added TypeScript build script');
      modified = true;
    } else {
      pkg.scripts.build = "echo 'No build needed'";
      updates.push('Added placeholder build script');
      modified = true;
    }
  }

  // Add test script if missing
  if (!pkg.scripts.test) {
    pkg.scripts.test = "echo 'No tests specified'";
    updates.push('Added placeholder test script');
    modified = true;
  }

  if (modified) {
    if (dryRun) {
      console.log(`\n📝 Would update ${packageName}:`);
      updates.forEach(u => console.log(`   - ${u}`));
      console.log('   New package.json:');
      console.log(JSON.stringify(pkg, null, 2).split('\n').map(l => `   ${l}`).join('\n'));
    } else {
      fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n');
      console.log(`\n✅ Updated ${packageName}:`);
      updates.forEach(u => console.log(`   - ${u}`));
    }
    return true;
  } else {
    console.log(`\n✓  ${packageName} is already correctly configured`);
    return false;
  }
}

function ensureIndexFile(packageDir, packageName) {
  const srcDir = path.join(packageDir, 'src');
  const indexPath = path.join(srcDir, 'index.ts');

  if (!fs.existsSync(srcDir)) {
    if (dryRun) {
      console.log(`   📝 Would create src/ directory`);
    } else {
      fs.mkdirSync(srcDir, { recursive: true });
      console.log(`   ✅ Created src/ directory`);
    }
  }

  if (!fs.existsSync(indexPath)) {
    const content = `/**
 * ${packageName}
 *
 * TODO: Add package description
 */

// Export your package's public API here
export {};
`;

    if (dryRun) {
      console.log(`   📝 Would create src/index.ts`);
    } else {
      fs.writeFileSync(indexPath, content);
      console.log(`   ✅ Created src/index.ts`);
    }
  }
}

function ensureTsConfig(packageDir, packageName, pkg) {
  const tsConfigPath = path.join(packageDir, 'tsconfig.json');

  if (!fs.existsSync(tsConfigPath)) {
    const isESM = pkg.type === 'module';

    const tsConfig = {
      extends: '../../tsconfig.base.json',
      compilerOptions: {
        outDir: './dist',
        rootDir: './src',
        composite: true,
        declaration: true,
        declarationMap: true,
        module: isESM ? 'ES2020' : 'CommonJS',
        moduleResolution: 'node',
        target: 'ES2020'
      },
      include: ['src/**/*'],
      exclude: ['dist', 'node_modules', '**/*.test.ts', '**/*.spec.ts']
    };

    if (dryRun) {
      console.log(`   📝 Would create tsconfig.json`);
    } else {
      fs.writeFileSync(tsConfigPath, JSON.stringify(tsConfig, null, 2) + '\n');
      console.log(`   ✅ Created tsconfig.json`);
    }
  }
}

// Main execution
console.log('🔧 Package Export Fixer\n');
console.log(`Mode: ${dryRun ? 'DRY RUN (no changes will be made)' : 'LIVE (files will be modified)'}\n`);

if (specificPackage) {
  console.log(`Targeting specific package: ${specificPackage}\n`);
}

const packagesToProcess = specificPackage
  ? [specificPackage]
  : PACKAGES_TO_FIX;

let fixedCount = 0;
let totalCount = 0;

for (const packageName of packagesToProcess) {
  const packageDir = path.join(packagesDir, packageName);

  if (!fs.existsSync(packageDir)) {
    console.log(`⚠️  Package directory not found: ${packageName}`);
    continue;
  }

  totalCount++;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Processing: ${packageName}`);
  console.log('='.repeat(60));

  const packageJsonPath = path.join(packageDir, 'package.json');
  let pkg = null;

  if (fs.existsSync(packageJsonPath)) {
    pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  }

  const wasFixed = fixPackageExports(packageDir, packageName);

  if (wasFixed) {
    // Re-read package.json to get updated version
    if (fs.existsSync(packageJsonPath)) {
      pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    }

    ensureIndexFile(packageDir, packageName);
    ensureTsConfig(packageDir, packageName, pkg || {});
    fixedCount++;
  }
}

console.log('\n' + '='.repeat(60));
console.log('Summary');
console.log('='.repeat(60));
console.log(`Total packages processed: ${totalCount}`);
console.log(`Packages ${dryRun ? 'that would be' : ''} fixed: ${fixedCount}`);
console.log(`Packages already correct: ${totalCount - fixedCount}`);

if (dryRun) {
  console.log('\n💡 Run without --dry-run to apply changes');
} else {
  console.log('\n✅ All fixes applied!');
  console.log('\nNext steps:');
  console.log('1. Review the changes: git diff');
  console.log('2. Install dependencies: pnpm install');
  console.log('3. Build packages: pnpm build');
  console.log('4. Commit changes: git add -A && git commit -m "fix: add missing package exports"');
}
