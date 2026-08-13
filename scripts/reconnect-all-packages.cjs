#!/usr/bin/env node
/* eslint-env node */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PACKAGES_DIR = path.join(ROOT, 'packages');
const DRY_RUN = process.argv.includes('--dry-run');

const NAME_OVERRIDES = new Map();

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

function toDotPath(value) {
  if (!value) return value;
  return value.startsWith('./') ? value : `./${value}`;
}

function hasCandidateEntry(packageDir) {
  const candidates = [
    'src/index.ts',
    'src/index.tsx',
    'src/index.js',
    'src/index.mjs',
    'index.ts',
    'index.tsx',
    'index.js',
    'index.mjs',
  ];
  return candidates.some((candidate) => fileExists(path.join(packageDir, candidate)));
}

function hasTypeScriptEntry(packageDir) {
  const candidates = ['src/index.ts', 'src/index.tsx', 'index.ts', 'index.tsx'];
  return candidates.some((candidate) => fileExists(path.join(packageDir, candidate)));
}

function inferMain(packageDir) {
  if (fileExists(path.join(packageDir, 'index.js'))) return 'index.js';
  if (fileExists(path.join(packageDir, 'index.mjs'))) return 'index.mjs';
  if (hasCandidateEntry(packageDir)) return 'dist/index.js';
  return 'dist/index.js';
}

function inferTypes(mainField) {
  if (!mainField) return 'dist/index.d.ts';
  if (mainField.endsWith('.js')) return `${mainField.slice(0, -3)}.d.ts`;
  if (mainField.endsWith('.cjs')) return `${mainField.slice(0, -4)}.d.cts`;
  if (mainField.endsWith('.mjs')) return `${mainField.slice(0, -4)}.d.mts`;
  return 'dist/index.d.ts';
}

function inferBuildScript(pkgName, packageDir, scripts) {
  if (scripts.build) return scripts.build;
  if (pkgName === '@the-new-fuse/contracts' && scripts.compile) return 'pnpm run compile';
  if (fileExists(path.join(packageDir, 'tsconfig.json')) || hasTypeScriptEntry(packageDir)) {
    return 'tsc -b';
  }
  return 'echo "No build step configured" && exit 0';
}

function inferTestScript(existing) {
  if (existing) return existing;
  return 'echo "No tests for this package" && exit 0';
}

function inferWildcardExport(mainField) {
  const normalized = toDotPath(mainField);
  if (!normalized) return '';
  if (normalized.startsWith('./dist/')) return './dist/*';
  if (normalized.startsWith('./src/')) return './src/*';
  if (normalized.startsWith('./index.')) return './*';
  return '';
}

function ensureFilesAllowSourcePublish(pkg, changed) {
  if (!Array.isArray(pkg.files)) return;
  if (typeof pkg.main !== 'string') return;

  const main = pkg.main.replace(/^\.\//, '');
  const types = typeof pkg.types === 'string' ? pkg.types.replace(/^\.\//, '') : '';

  const needsSrc = main.startsWith('src/') || types.startsWith('src/');
  if (needsSrc && !pkg.files.includes('src')) {
    pkg.files.push('src');
    changed.push('files:+src');
  }

  if ((main === 'index.js' || main === 'index.mjs') && !pkg.files.includes(main)) {
    pkg.files.push(main);
    changed.push(`files:+${main}`);
  }
}

function main() {
  if (!fileExists(PACKAGES_DIR)) {
    console.error(`Packages directory not found: ${PACKAGES_DIR}`);
    process.exit(1);
  }

  const packageDirs = fs
    .readdirSync(PACKAGES_DIR)
    .map((entry) => path.join(PACKAGES_DIR, entry))
    .filter((entryPath) => fs.statSync(entryPath).isDirectory())
    .filter((entryPath) => fileExists(path.join(entryPath, 'package.json')))
    .sort((a, b) => a.localeCompare(b));

  const touched = [];

  for (const packageDir of packageDirs) {
    const packageJsonPath = path.join(packageDir, 'package.json');
    const dirName = path.basename(packageDir);
    const pkg = readJson(packageJsonPath);
    const changed = [];

    if (NAME_OVERRIDES.has(pkg.name)) {
      pkg.name = NAME_OVERRIDES.get(pkg.name);
      changed.push('name');
    }

    if (!pkg.main) {
      pkg.main = inferMain(packageDir);
      changed.push('main');
    }

    if (!pkg.types) {
      pkg.types = inferTypes(pkg.main);
      changed.push('types');
    }

    if (!pkg.scripts || typeof pkg.scripts !== 'object') {
      pkg.scripts = {};
      changed.push('scripts');
    }

    if (!pkg.scripts.build) {
      pkg.scripts.build = inferBuildScript(pkg.name || dirName, packageDir, pkg.scripts);
      changed.push('scripts.build');
    }

    if (!pkg.scripts.test) {
      pkg.scripts.test = inferTestScript(pkg.scripts.test);
      changed.push('scripts.test');
    }

    if (!pkg.exports && pkg.main) {
      const mainPath = toDotPath(pkg.main);
      const typesPath = pkg.types ? toDotPath(pkg.types) : '';

      const entry = {
        import: mainPath,
        require: mainPath,
        default: mainPath,
      };
      if (typesPath) entry.types = typesPath;

      pkg.exports = {
        '.': entry,
        './package.json': './package.json',
      };

      const wildcard = inferWildcardExport(pkg.main);
      if (wildcard) {
        pkg.exports['./*'] = wildcard;
      }

      changed.push('exports');
    }

    ensureFilesAllowSourcePublish(pkg, changed);

    if (changed.length > 0) {
      touched.push({
        dir: dirName,
        name: pkg.name,
        changed,
      });
      if (!DRY_RUN) writeJson(packageJsonPath, pkg);
    }
  }

  if (touched.length === 0) {
    console.log('No package manifest reconnect changes were required.');
    return;
  }

  console.log(`Updated ${touched.length} package manifests${DRY_RUN ? ' (dry run)' : ''}:`);
  for (const item of touched) {
    console.log(`- ${item.dir} (${item.name}): ${item.changed.join(', ')}`);
  }
}

main();
