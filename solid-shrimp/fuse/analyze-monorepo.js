const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();
const appsDir = path.join(rootDir, 'apps');
const packagesDir = path.join(rootDir, 'packages');

// Read all package.json files
function readPackageJson(dir) {
  const pkgPath = path.join(dir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      return JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    } catch (e) {
      console.error(`Error reading ${pkgPath}:`, e.message);
      return null;
    }
  }
  return null;
}

// Get all subdirectories
function getSubdirectories(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((file) => fs.statSync(path.join(dir, file)).isDirectory())
    .filter((file) => !file.startsWith('.'));
}

// Analyze packages
const apps = {};
const packages = {};
const issues = [];

console.log('=== ANALYZING APPS ===\n');
getSubdirectories(appsDir).forEach((appName) => {
  const appPath = path.join(appsDir, appName);
  const pkg = readPackageJson(appPath);
  if (pkg) {
    apps[pkg.name] = {
      path: appPath,
      pkg,
      internalDeps: [],
    };
    console.log(`✓ ${pkg.name}`);
  } else {
    issues.push(`Missing or invalid package.json in apps/${appName}`);
    console.log(`✗ apps/${appName} - Missing package.json`);
  }
});

console.log('\n=== ANALYZING PACKAGES ===\n');
getSubdirectories(packagesDir).forEach((pkgName) => {
  const pkgPath = path.join(packagesDir, pkgName);
  const pkg = readPackageJson(pkgPath);
  if (pkg) {
    packages[pkg.name] = {
      path: pkgPath,
      pkg,
      internalDeps: [],
    };
    console.log(`✓ ${pkg.name}`);
  } else {
    console.log(`⚠ packages/${pkgName} - Missing package.json`);
  }
});

// Extract internal dependencies
function extractInternalDeps(dependencies) {
  const internalPrefixes = ['@the-new-fuse/', '@tnf/'];
  const deps = [];

  if (dependencies) {
    Object.keys(dependencies).forEach((dep) => {
      if (internalPrefixes.some((prefix) => dep.startsWith(prefix))) {
        deps.push(dep);
      }
    });
  }

  return deps;
}

// Analyze dependencies
console.log('\n=== ANALYZING DEPENDENCIES ===\n');

Object.entries(apps).forEach(([name, info]) => {
  const allDeps = {
    ...info.pkg.dependencies,
    ...info.pkg.devDependencies,
  };
  info.internalDeps = extractInternalDeps(allDeps);
});

Object.entries(packages).forEach(([name, info]) => {
  const allDeps = {
    ...info.pkg.dependencies,
    ...info.pkg.devDependencies,
  };
  info.internalDeps = extractInternalDeps(allDeps);
});

// Verify all internal dependencies exist
console.log('=== CHECKING FOR BROKEN REFERENCES ===\n');

const allPackageNames = new Set([...Object.keys(apps), ...Object.keys(packages)]);

function checkDependencies(name, info, type) {
  info.internalDeps.forEach((dep) => {
    if (!allPackageNames.has(dep)) {
      const issue = `${type} "${name}" references non-existent package: ${dep}`;
      issues.push(issue);
      console.log(`✗ ${issue}`);
    }
  });
}

Object.entries(apps).forEach(([name, info]) => checkDependencies(name, info, 'App'));
Object.entries(packages).forEach(([name, info]) => checkDependencies(name, info, 'Package'));

// Check package configuration
console.log('\n=== CHECKING PACKAGE CONFIGURATIONS ===\n');

Object.entries(packages).forEach(([name, info]) => {
  const pkg = info.pkg;
  const issues_local = [];

  // Check for required fields
  if (!pkg.name) issues_local.push('Missing "name"');
  if (!pkg.main && !pkg.exports) issues_local.push('Missing "main" or "exports"');
  if (!pkg.types) issues_local.push('Missing "types"');

  // Check for build script
  if (!pkg.scripts || !pkg.scripts.build) {
    issues_local.push('Missing "build" script');
  }

  if (issues_local.length > 0) {
    console.log(`⚠ ${name}:`);
    issues_local.forEach((i) => console.log(`  - ${i}`));
    issues.push(`${name}: ${issues_local.join(', ')}`);
  } else {
    console.log(`✓ ${name}`);
  }
});

// Check workspace configuration
console.log('\n=== CHECKING WORKSPACE CONFIGURATION ===\n');

const workspaceConfig = readPackageJson(rootDir);
if (workspaceConfig) {
  console.log('✓ Root package.json exists');
  console.log('  Workspaces:', workspaceConfig.workspaces);
} else {
  console.log('✗ Root package.json missing or invalid');
  issues.push('Root package.json missing or invalid');
}

// Check pnpm-workspace.yaml
const workspaceYamlPath = path.join(rootDir, 'pnpm-workspace.yaml');
if (fs.existsSync(workspaceYamlPath)) {
  console.log('✓ pnpm-workspace.yaml exists');
} else {
  console.log('✗ pnpm-workspace.yaml missing');
  issues.push('pnpm-workspace.yaml missing');
}

// Generate dependency graph
console.log('\n=== DEPENDENCY GRAPH ===\n');

console.log('Apps and their dependencies:');
Object.entries(apps).forEach(([name, info]) => {
  console.log(`\n${name}:`);
  if (info.internalDeps.length === 0) {
    console.log('  (no internal dependencies)');
  } else {
    info.internalDeps.forEach((dep) => console.log(`  → ${dep}`));
  }
});

console.log('\n\nPackages and their dependencies:');
Object.entries(packages).forEach(([name, info]) => {
  if (info.internalDeps.length > 0) {
    console.log(`\n${name}:`);
    info.internalDeps.forEach((dep) => console.log(`  → ${dep}`));
  }
});

// Detect circular dependencies
console.log('\n\n=== CHECKING FOR CIRCULAR DEPENDENCIES ===\n');

function hasCircularDep(name, visited = new Set(), path = []) {
  if (visited.has(name)) {
    return [...path, name];
  }

  visited.add(name);
  path.push(name);

  const info = packages[name] || apps[name];
  if (!info) return null;

  for (const dep of info.internalDeps) {
    const circular = hasCircularDep(dep, new Set(visited), [...path]);
    if (circular) return circular;
  }

  return null;
}

let circularFound = false;
[...Object.keys(packages), ...Object.keys(apps)].forEach((name) => {
  const circular = hasCircularDep(name);
  if (circular) {
    circularFound = true;
    console.log(`✗ Circular dependency: ${circular.join(' → ')}`);
    issues.push(`Circular dependency: ${circular.join(' → ')}`);
  }
});

if (!circularFound) {
  console.log('✓ No circular dependencies found');
}

// Summary
console.log('\n\n=== SUMMARY ===\n');
console.log(`Total apps: ${Object.keys(apps).length}`);
console.log(`Total packages: ${Object.keys(packages).length}`);
console.log(`Total issues: ${issues.length}`);

if (issues.length > 0) {
  console.log('\n=== ISSUES FOUND ===\n');
  issues.forEach((issue, i) => console.log(`${i + 1}. ${issue}`));
}

// Generate statistics
console.log('\n=== STATISTICS ===\n');

const depCounts = {};
[...Object.entries(apps), ...Object.entries(packages)].forEach(([name, info]) => {
  info.internalDeps.forEach((dep) => {
    depCounts[dep] = (depCounts[dep] || 0) + 1;
  });
});

console.log('Most depended-on packages:');
Object.entries(depCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .forEach(([name, count]) => console.log(`  ${name}: ${count} dependents`));
