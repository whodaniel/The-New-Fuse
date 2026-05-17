#!/usr/bin/env node
/* eslint-env node */

/**
 * Package Lifecycle Audit
 *
 * Produces evidence-based lifecycle signals for monorepo packages:
 * - External runtime integration (import/require usage outside package)
 * - External reference volume (literal mentions outside package)
 * - Cross-package dependency intent (workspace/internal dependents)
 * - Build/test script readiness
 *
 * Usage:
 *   node scripts/package-lifecycle-audit.cjs
 *   node scripts/package-lifecycle-audit.cjs --json
 *   node scripts/package-lifecycle-audit.cjs --json --out docs/status-reports/package-lifecycle-baseline-2026-05-17.json
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const DEFAULT_PACKAGE_PREFIXES = ['@the-new-fuse/', '@tnf/'];
const SOURCE_EXT_GLOB = '*.{ts,tsx,js,jsx,mjs,cjs,cts,mts,json}';
const INCLUDE_DIRS = ['apps', 'packages', 'src', 'tests'];
const EXCLUDE_GLOBS = [
  '!**/node_modules/**',
  '!.git/**',
  '!docs/**',
  '!**/*.md',
  '!**/dist/**',
  '!**/build/**',
  '!**/.turbo/**',
  '!**/coverage/**',
];

function parseArgs(argv) {
  const args = {
    json: false,
    out: '',
    root: process.cwd(),
    top: 64,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--json') {
      args.json = true;
      continue;
    }
    if (token === '--out') {
      args.out = argv[i + 1] || '';
      i += 1;
      continue;
    }
    if (token === '--root') {
      args.root = argv[i + 1] || process.cwd();
      i += 1;
      continue;
    }
    if (token === '--top') {
      const parsed = Number(argv[i + 1]);
      if (Number.isFinite(parsed) && parsed > 0) {
        args.top = parsed;
      }
      i += 1;
    }
  }

  args.root = path.resolve(args.root);
  return args;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function listPackageDirs(rootDir) {
  const packagesRoot = path.join(rootDir, 'packages');
  if (!fs.existsSync(packagesRoot)) return [];

  return fs
    .readdirSync(packagesRoot)
    .map((entry) => path.join(packagesRoot, entry))
    .filter((entryPath) => fs.statSync(entryPath).isDirectory())
    .filter((entryPath) => fs.existsSync(path.join(entryPath, 'package.json')));
}

function isScopedInternalPackage(name) {
  return DEFAULT_PACKAGE_PREFIXES.some((prefix) => name.startsWith(prefix));
}

function normalizeDependencyMap(pkgJson) {
  return {
    ...(pkgJson.dependencies || {}),
    ...(pkgJson.devDependencies || {}),
    ...(pkgJson.peerDependencies || {}),
    ...(pkgJson.optionalDependencies || {}),
  };
}

function escapeRegexLiteral(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function runRgCount({ rootDir, pattern, fixedString, scanDirs, extraExcludeGlobs }) {
  const targets = scanDirs.filter((dir) => fs.existsSync(path.join(rootDir, dir)));
  if (targets.length === 0) return 0;

  const rgArgs = ['-n', '--hidden'];
  for (const glob of EXCLUDE_GLOBS) {
    rgArgs.push('--glob', glob);
  }
  for (const glob of extraExcludeGlobs) {
    rgArgs.push('--glob', glob);
  }
  rgArgs.push('-g', SOURCE_EXT_GLOB);
  if (fixedString) {
    rgArgs.push('-F', pattern);
  } else {
    rgArgs.push(pattern);
  }
  rgArgs.push(...targets);

  const result = spawnSync('rg', rgArgs, {
    cwd: rootDir,
    encoding: 'utf8',
  });

  // rg exits 1 for "no matches" (not an error for this audit).
  if (result.status === 1) return 0;
  if (result.status !== 0) {
    const err = result.stderr?.trim() || result.stdout?.trim() || 'rg failed';
    throw new Error(err);
  }

  const output = result.stdout.trim();
  if (!output) return 0;
  return output.split('\n').filter(Boolean).length;
}

function classifyLifecycle(record) {
  if (record.externalRuntimeImports > 0) return 'active';
  if (record.incomingInternalDependents > 0 || record.externalLiteralRefs > 0) return 'latent';
  if (record.hasBuildScript || record.hasTestScript) return 'incubating';
  return 'archived_candidate';
}

function recommendationReason(record) {
  if (record.lifecycleState === 'active') {
    return 'External runtime imports detected.';
  }
  if (record.lifecycleState === 'latent') {
    if (record.incomingInternalDependents > 0) {
      return 'No runtime imports, but internal dependents indicate intended use.';
    }
    return 'Referenced externally, but not wired through runtime imports.';
  }
  if (record.lifecycleState === 'incubating') {
    return 'Build/test scaffolding exists without external integration.';
  }
  return 'No external integration signal and minimal package readiness signals.';
}

function formatTable(records, topN) {
  const headers = [
    'Package',
    'State',
    'Runtime',
    'Refs',
    'Dependents',
    'Build',
    'Test',
  ];
  const rows = records.slice(0, topN).map((r) => [
    r.name,
    r.lifecycleState,
    String(r.externalRuntimeImports),
    String(r.externalLiteralRefs),
    String(r.incomingInternalDependents),
    r.hasBuildScript ? 'Y' : 'N',
    r.hasTestScript ? 'Y' : 'N',
  ]);

  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((row) => row[i].length))
  );

  const line = (cols) =>
    cols
      .map((col, i) => col.padEnd(widths[i], ' '))
      .join('  ')
      .trimEnd();

  const out = [];
  out.push(line(headers));
  out.push(
    widths
      .map((w) => ''.padEnd(w, '-'))
      .join('  ')
      .trimEnd()
  );
  for (const row of rows) out.push(line(row));
  return out.join('\n');
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const packageDirs = listPackageDirs(args.root);

  const packages = packageDirs
    .map((dirPath) => {
      const pkg = readJson(path.join(dirPath, 'package.json'));
      return {
        dirPath,
        relDir: path.relative(args.root, dirPath),
        name: pkg.name || path.basename(dirPath),
        packageJson: pkg,
      };
    })
    .filter((pkg) => isScopedInternalPackage(pkg.name));

  const names = new Set(packages.map((pkg) => pkg.name));
  const dependentsMap = new Map();
  for (const pkg of packages) dependentsMap.set(pkg.name, new Set());

  for (const pkg of packages) {
    const deps = normalizeDependencyMap(pkg.packageJson);
    for (const depName of Object.keys(deps)) {
      if (names.has(depName) && depName !== pkg.name) {
        dependentsMap.get(depName).add(pkg.name);
      }
    }
  }

  const records = [];
  for (const pkg of packages) {
    const escapedName = escapeRegexLiteral(pkg.name);
    const runtimePattern = `(from\\s+['"]${escapedName}['"]|require\\(\\s*['"]${escapedName}['"]\\s*\\)|import\\(\\s*['"]${escapedName}['"]\\s*\\))`;
    const extraExcludes = [`!${pkg.relDir}/**`];

    const externalRuntimeImports = runRgCount({
      rootDir: args.root,
      pattern: runtimePattern,
      fixedString: false,
      scanDirs: INCLUDE_DIRS,
      extraExcludeGlobs: extraExcludes,
    });

    const externalLiteralRefs = runRgCount({
      rootDir: args.root,
      pattern: pkg.name,
      fixedString: true,
      scanDirs: INCLUDE_DIRS,
      extraExcludeGlobs: extraExcludes,
    });

    const scripts = pkg.packageJson.scripts || {};
    const record = {
      name: pkg.name,
      path: pkg.relDir,
      externalRuntimeImports,
      externalLiteralRefs,
      incomingInternalDependents: dependentsMap.get(pkg.name).size,
      incomingDependentPackages: Array.from(dependentsMap.get(pkg.name)).sort(),
      hasBuildScript: typeof scripts.build === 'string' && scripts.build.trim().length > 0,
      hasTestScript: typeof scripts.test === 'string' && scripts.test.trim().length > 0,
    };
    record.lifecycleState = classifyLifecycle(record);
    record.reason = recommendationReason(record);
    records.push(record);
  }

  records.sort((a, b) => {
    if (b.externalRuntimeImports !== a.externalRuntimeImports) {
      return b.externalRuntimeImports - a.externalRuntimeImports;
    }
    if (b.incomingInternalDependents !== a.incomingInternalDependents) {
      return b.incomingInternalDependents - a.incomingInternalDependents;
    }
    return a.name.localeCompare(b.name);
  });

  const summary = {
    generatedAt: new Date().toISOString(),
    root: args.root,
    packageCount: records.length,
    byLifecycleState: {
      active: records.filter((r) => r.lifecycleState === 'active').length,
      latent: records.filter((r) => r.lifecycleState === 'latent').length,
      incubating: records.filter((r) => r.lifecycleState === 'incubating').length,
      archived_candidate: records.filter((r) => r.lifecycleState === 'archived_candidate').length,
    },
  };

  const payload = { summary, records };

  if (args.out) {
    const outPath = path.resolve(args.root, args.out);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  }

  if (args.json) {
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    return;
  }

  console.log('TNF Package Lifecycle Audit');
  console.log(`Root: ${summary.root}`);
  console.log(`Generated: ${summary.generatedAt}`);
  console.log(
    `Packages: ${summary.packageCount} | active=${summary.byLifecycleState.active} latent=${summary.byLifecycleState.latent} incubating=${summary.byLifecycleState.incubating} archived_candidate=${summary.byLifecycleState.archived_candidate}`
  );
  console.log('');
  console.log(formatTable(records, args.top));
  if (args.out) {
    console.log('');
    console.log(`Wrote report: ${args.out}`);
  }
}

main();
