#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

async function addLintScripts() {
  console.log('Adding lint and format scripts to all packages...\n');

  // Find all package.json files in apps and packages
  const packageJsonFiles = await glob('**/package.json', {
    cwd: process.cwd(),
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
  });

  // Filter to only apps and packages
  const targetPackages = packageJsonFiles.filter(
    (file) =>
      file.startsWith('apps/') ||
      file.startsWith('packages/') ||
      file.startsWith('tools/')
  );

  let updated = 0;
  let skipped = 0;

  for (const packageJsonPath of targetPackages) {
    const fullPath = path.join(process.cwd(), packageJsonPath);
    const packageJson = JSON.parse(fs.readFileSync(fullPath, 'utf8'));

    // Skip if no scripts section
    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }

    let modified = false;

    // Add lint script if not present
    if (!packageJson.scripts.lint) {
      packageJson.scripts.lint = 'eslint . --ext .ts,.tsx,.js,.jsx';
      modified = true;
    }

    // Add lint:fix script if not present
    if (!packageJson.scripts['lint:fix']) {
      packageJson.scripts['lint:fix'] = 'eslint . --ext .ts,.tsx,.js,.jsx --fix';
      modified = true;
    }

    // Add format script if not present
    if (!packageJson.scripts.format) {
      packageJson.scripts.format = 'prettier --write "**/*.{ts,tsx,js,jsx,json,md}"';
      modified = true;
    }

    // Add format:check script if not present
    if (!packageJson.scripts['format:check']) {
      packageJson.scripts['format:check'] = 'prettier --check "**/*.{ts,tsx,js,jsx,json,md}"';
      modified = true;
    }

    // Add type-check script if not present and has TypeScript
    const hasTsConfig = fs.existsSync(
      path.join(path.dirname(fullPath), 'tsconfig.json')
    );
    if (hasTsConfig && !packageJson.scripts['type-check']) {
      packageJson.scripts['type-check'] = 'tsc --noEmit';
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(fullPath, JSON.stringify(packageJson, null, 2) + '\n');
      console.log(`✓ Updated: ${packageJsonPath}`);
      updated++;
    } else {
      console.log(`- Skipped: ${packageJsonPath} (already has scripts)`);
      skipped++;
    }
  }

  console.log(`\n✅ Done! Updated ${updated} packages, skipped ${skipped} packages.`);
}

addLintScripts().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
