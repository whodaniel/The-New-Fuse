#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Pre-commit build gate.
 *
 * Why this exists: commit 2b9cad51cd ("handoff …: commit all 87 uncommitted
 * files (operator-confirmed live)") shipped
 * `export * from './auth-client.js'` in packages/shared/src/browser-control/
 * pointing at a module that has never existed in this repository. It broke
 * `tsc --build` for packages/shared from 2026-07-26 onward and nobody noticed
 * for five days, because no automated commit path type-checks anything.
 *
 * Scope discipline — the reason this gate is survivable:
 *
 *   A gate that fails on pre-existing breakage gets bypassed with --no-verify
 *   within a day, and a bypassed gate is worse than no gate because it still
 *   reads as protection. apps/api currently has 9 unrelated `never[]` errors
 *   in available-models.controller.ts. So this blocks on:
 *
 *     1. any type error located in a file you actually staged, and
 *     2. TS2307 (cannot find module) anywhere in an affected package —
 *        unresolvable imports are almost never pre-existing and are exactly
 *        the failure that motivated this gate.
 *
 *   Every other pre-existing error is reported as context and does not block.
 *
 * Honest reporting: if a package cannot be checked (no tsconfig, timeout, tsc
 * missing) it is reported as SKIPPED with a reason. It is never silently
 * treated as passing — that is the same "asserted green" failure this gate
 * exists to prevent.
 *
 * Escape hatch (for genuine emergencies, and it is logged loudly):
 *   TNF_SKIP_BUILD_GATE=1 git commit ...
 */
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const PER_PACKAGE_TIMEOUT_MS = Number(process.env.TNF_BUILD_GATE_PKG_TIMEOUT_MS || 180_000);
const TOTAL_BUDGET_MS = Number(process.env.TNF_BUILD_GATE_TOTAL_BUDGET_MS || 600_000);
const CHECKABLE = /\.(ts|tsx|mts|cts)$/;

function git(args) {
  return execFileSync('git', args, {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 1024 * 1024 * 64,
  }).trim();
}

function stagedFiles() {
  const out = git(['diff', '--cached', '--name-only', '--diff-filter=ACMR']);
  return out ? out.split('\n').map((s) => s.trim()).filter(Boolean) : [];
}

/** Nearest ancestor directory holding both a tsconfig.json and a package.json. */
function owningPackage(relFile) {
  let dir = path.dirname(path.join(REPO_ROOT, relFile));
  while (dir.startsWith(REPO_ROOT) && dir !== REPO_ROOT) {
    if (
      fs.existsSync(path.join(dir, 'tsconfig.json')) &&
      fs.existsSync(path.join(dir, 'package.json'))
    ) {
      return path.relative(REPO_ROOT, dir);
    }
    dir = path.dirname(dir);
  }
  return null;
}

/** Parse `path/to/file.ts(12,5): error TS2307: msg` into structured rows. */
function parseTscOutput(pkgDir, output) {
  const rows = [];
  const re = /^(.+?)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.*)$/;
  for (const line of output.split('\n')) {
    const m = re.exec(line.trim());
    if (!m) continue;
    const [, file, lineNo, , code, message] = m;
    const abs = path.resolve(REPO_ROOT, pkgDir, file);
    rows.push({
      file: path.relative(REPO_ROOT, abs),
      line: Number(lineNo),
      code,
      message,
    });
  }
  return rows;
}

function typecheckPackage(pkgDir) {
  const tsconfig = path.join(REPO_ROOT, pkgDir, 'tsconfig.json');
  if (!fs.existsSync(tsconfig)) {
    return { state: 'skipped', reason: 'no tsconfig.json', rows: [] };
  }
  try {
    execFileSync('npx', ['tsc', '--noEmit', '-p', 'tsconfig.json'], {
      cwd: path.join(REPO_ROOT, pkgDir),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: PER_PACKAGE_TIMEOUT_MS,
      maxBuffer: 1024 * 1024 * 64,
    });
    return { state: 'clean', rows: [] };
  } catch (err) {
    if (err.killed || err.signal === 'SIGTERM') {
      return {
        state: 'skipped',
        reason: `tsc exceeded ${Math.round(PER_PACKAGE_TIMEOUT_MS / 1000)}s`,
        rows: [],
      };
    }
    const output = `${err.stdout || ''}\n${err.stderr || ''}`;
    const rows = parseTscOutput(pkgDir, output);
    if (rows.length === 0) {
      return {
        state: 'skipped',
        reason: `tsc failed without parseable diagnostics: ${(err.stderr || err.message || '')
          .trim()
          .slice(0, 200)}`,
        rows: [],
      };
    }
    return { state: 'errors', rows };
  }
}

function main() {
  if (process.env.TNF_SKIP_BUILD_GATE === '1') {
    console.warn('[build-gate] BYPASSED via TNF_SKIP_BUILD_GATE=1 — no type checking performed.');
    return;
  }

  const staged = stagedFiles();
  const stagedCheckable = staged.filter((f) => CHECKABLE.test(f));
  if (stagedCheckable.length === 0) {
    console.log('[build-gate] OK: no TypeScript files staged');
    return;
  }

  const stagedSet = new Set(stagedCheckable);
  const packages = new Map();
  const orphans = [];
  for (const file of stagedCheckable) {
    const pkg = owningPackage(file);
    if (!pkg) {
      orphans.push(file);
      continue;
    }
    if (!packages.has(pkg)) packages.set(pkg, []);
    packages.get(pkg).push(file);
  }

  console.log(
    `[build-gate] ${stagedCheckable.length} staged TS file(s) across ${packages.size} package(s)`
  );

  const blocking = [];
  const preExisting = [];
  const skipped = [];
  const startedAt = Date.now();

  for (const [pkg, files] of packages) {
    if (Date.now() - startedAt > TOTAL_BUDGET_MS) {
      skipped.push({ pkg, reason: 'total time budget exhausted' });
      continue;
    }
    process.stdout.write(`[build-gate]   ${pkg} ... `);
    const result = typecheckPackage(pkg);

    if (result.state === 'clean') {
      console.log('clean');
      continue;
    }
    if (result.state === 'skipped') {
      console.log(`SKIPPED (${result.reason})`);
      skipped.push({ pkg, reason: result.reason });
      continue;
    }

    for (const row of result.rows) {
      const inStagedFile = stagedSet.has(row.file);
      const unresolvableImport = row.code === 'TS2307';
      if (inStagedFile || unresolvableImport) blocking.push(row);
      else preExisting.push(row);
    }
    console.log(
      `${result.rows.length} error(s) — ${result.rows.filter((r) => stagedSet.has(r.file) || r.code === 'TS2307').length} blocking`
    );
    void files;
  }

  if (orphans.length) {
    skipped.push({
      pkg: '(no owning package)',
      reason: `${orphans.length} staged file(s) outside any tsconfig package: ${orphans.slice(0, 3).join(', ')}`,
    });
  }

  if (preExisting.length) {
    console.log(
      `[build-gate] ${preExisting.length} pre-existing error(s) in unstaged files — not blocking`
    );
  }
  for (const s of skipped) {
    console.warn(`[build-gate] NOT CHECKED: ${s.pkg} — ${s.reason}`);
  }

  if (blocking.length === 0) {
    const suffix = skipped.length ? ` (${skipped.length} package(s) not checked)` : '';
    console.log(`[build-gate] OK: no new type errors${suffix}`);
    return;
  }

  console.error('');
  console.error(`[build-gate] BLOCKED: ${blocking.length} error(s) introduced by this commit`);
  console.error('');
  for (const row of blocking.slice(0, 25)) {
    const why = row.code === 'TS2307' ? 'unresolvable import' : 'in staged file';
    console.error(`  ${row.file}:${row.line}  ${row.code}  (${why})`);
    console.error(`      ${row.message}`);
  }
  if (blocking.length > 25) console.error(`  … and ${blocking.length - 25} more`);
  console.error('');
  console.error('  Fix these, or bypass deliberately with:');
  console.error('    TNF_SKIP_BUILD_GATE=1 git commit ...');
  console.error('');
  process.exit(1);
}

main();
