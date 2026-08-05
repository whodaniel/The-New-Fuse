#!/usr/bin/env node
/**
 * scripts/protocols/verify-honest-failure.cjs
 *
 * Fails when code in this repo can report success it did not achieve.
 *
 * WHY THIS EXISTS
 * ---------------
 * On 2026-08-03 the same defect was found four times in one day:
 *
 *   - cli.ts installed an `uncaughtException` handler that logged the crash
 *     and returned. Node exited 0. `tnf full-auto` recorded five days of
 *     crashed cycles as `ok: true`.
 *   - packages/relay-core's build ran `tsc || echo '✅ Skipping TS errors'`,
 *     printing a green checkmark on compile failure and exiting 0.
 *   - Three other packages masked build failure the same way.
 *   - `tsc -b` read a stale .tsbuildinfo, emitted nothing, and exited 0 --
 *     leaving 40 of 57 packages silently unbuildable.
 *
 * Each one hid the next. A supervisor that cannot distinguish success from
 * failure is worse than no supervisor, because it manufactures false
 * confidence. This check is enforced in CI precisely because local hooks can
 * be bypassed with --no-verify or HUSKY=0.
 *
 * Usage:
 *   node scripts/protocols/verify-honest-failure.cjs [--json]
 *
 * Exit codes: 0 clean, 1 violations found, 2 internal error.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const EMIT_JSON = process.argv.includes('--json');

/** Scripts whose exit code is load-bearing. A masked failure here lies to CI. */
const CRITICAL_SCRIPTS = new Set([
  'build',
  'test',
  'lint',
  'type-check',
  'typecheck',
  'verify',
  'validate',
]);

/**
 * Patterns that convert a non-zero exit into a zero exit.
 * `|| exit 0` and `|| true` are unambiguous. `|| echo` is the form that bit
 * us, because it looks like helpful logging and reads as success.
 */
const MASKING_PATTERNS = [
  { re: /\|\|\s*echo\b/, label: '|| echo' },
  { re: /\|\|\s*true\b/, label: '|| true' },
  { re: /\|\|\s*exit\s+0\b/, label: '|| exit 0' },
  { re: /\|\|\s*:\s*$/, label: '|| :' },
];

const violations = [];

function record(kind, file, detail, evidence) {
  violations.push({ kind, file: path.relative(ROOT, file), detail, evidence });
}

/** Directories that are not our source of truth (deps and build output). */
function isSkippable(p) {
  return /(^|\/)(node_modules|dist|build|coverage|\.turbo|\.git|external|venv|target|\.next|out|vendor|__snapshots__)(\/|$)/.test(
    p
  );
}

function walk(dir, onFile, depth = 0) {
  if (depth > 6) return;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (isSkippable(path.relative(ROOT, full))) continue;
    if (e.isDirectory()) walk(full, onFile, depth + 1);
    else if (e.isFile()) onFile(full);
  }
}

/** Check 1: package.json scripts that swallow a non-zero exit. */
function checkPackageScripts() {
  const manifests = [];
  for (const base of ['packages', 'apps']) {
    const dir = path.join(ROOT, base);
    if (!fs.existsSync(dir)) continue;
    for (const entry of fs.readdirSync(dir)) {
      const pj = path.join(dir, entry, 'package.json');
      if (fs.existsSync(pj)) manifests.push(pj);
    }
  }

  for (const pj of manifests) {
    let parsed;
    try {
      parsed = JSON.parse(fs.readFileSync(pj, 'utf8'));
    } catch {
      continue;
    }
    const scripts = parsed.scripts || {};
    for (const [name, cmd] of Object.entries(scripts)) {
      if (typeof cmd !== 'string') continue;
      if (!CRITICAL_SCRIPTS.has(name)) continue;
      for (const { re, label } of MASKING_PATTERNS) {
        if (re.test(cmd)) {
          record(
            'masked-exit-code',
            pj,
            `script "${name}" masks failure with \`${label}\``,
            cmd.length > 120 ? `${cmd.slice(0, 120)}…` : cmd
          );
          break;
        }
      }
    }
  }
}

/**
 * Check 2: uncaughtException / unhandledRejection handlers that do not exit.
 *
 * Node's default on an uncaught exception is to terminate non-zero. Installing
 * a handler overrides that: without an explicit exit the process continues and
 * ends up exiting 0, which is exactly how the full-auto loop reported crashes
 * as successes.
 */
function checkExceptionHandlers() {
  const targets = [];
  for (const base of ['packages', 'apps', 'scripts']) {
    const dir = path.join(ROOT, base);
    if (fs.existsSync(dir)) {
      walk(dir, (f) => {
        if (/\.(ts|js|cjs|mjs)$/.test(f) && !/\.d\.ts$/.test(f)) targets.push(f);
      });
    }
  }

  const handlerRe = /process\s*\.\s*on\s*\(\s*['"](uncaughtException|unhandledRejection)['"]/g;

  for (const file of targets) {
    let src;
    try {
      src = fs.readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    if (!src.includes('uncaughtException') && !src.includes('unhandledRejection')) continue;

    let m;
    handlerRe.lastIndex = 0;
    while ((m = handlerRe.exec(src)) !== null) {
      // Inspect the handler body: from the match to the balanced close paren,
      // capped so a malformed file cannot run away with us.
      const start = m.index;
      const slice = src.slice(start, start + 2500);
      const body = extractCallBody(slice);
      if (body === null) continue;

      if (!terminates(body, src)) {
        const line = src.slice(0, start).split('\n').length;
        record(
          'non-exiting-crash-handler',
          file,
          `${m[1]} handler at line ${line} never exits non-zero — the process will report success after a crash`,
          body.split('\n').slice(0, 3).join(' ').trim().slice(0, 120)
        );
      }
    }
  }
}

const EXITS_DIRECTLY = /process\s*\.\s*exit\s*\(|process\s*\.\s*exitCode\s*=|\bthrow\b|\bprocess\.abort\s*\(/;

/**
 * Does this handler body actually terminate the process?
 *
 * Handlers commonly delegate to a local `shutdown()` / `cleanup(1)` rather
 * than exiting inline. Flagging those would be a false positive, and a check
 * that reports false positives gets disabled — which is the same failure mode
 * this script exists to prevent. So resolve one level: find the delegate's
 * definition in the same file and look for an exit there.
 */
function terminates(body, src) {
  if (EXITS_DIRECTLY.test(body)) return true;

  // Collect plausible delegate calls made by the handler.
  const called = new Set();
  const callRe = /\b([A-Za-z_$][\w$]*)\s*\(/g;
  let c;
  while ((c = callRe.exec(body)) !== null) called.add(c[1]);

  for (const name of called) {
    if (['console', 'if', 'for', 'while', 'switch', 'catch', 'return', 'require'].includes(name)) {
      continue;
    }
    // `function name(`, `const name = (`, `name(args) {` (class method), `name: (`
    const defRe = new RegExp(
      `(?:function\\s+${name}\\s*\\(|` +
        `(?:const|let|var)\\s+${name}\\s*=\\s*(?:async\\s*)?\\(|` +
        `\\b${name}\\s*\\([^)]*\\)\\s*\\{|` +
        `\\b${name}\\s*:\\s*(?:async\\s*)?\\()`,
      'm'
    );
    const at = src.search(defRe);
    if (at === -1) continue;
    // Scan a bounded window of the definition for a real exit.
    if (EXITS_DIRECTLY.test(src.slice(at, at + 3000))) return true;
  }
  return false;
}

/** Return the text inside the outermost parens of a `foo(...)` starting at 0. */
function extractCallBody(text) {
  const open = text.indexOf('(');
  if (open === -1) return null;
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    const ch = text[i];
    if (ch === '(') depth++;
    else if (ch === ')') {
      depth--;
      if (depth === 0) return text.slice(open + 1, i);
    }
  }
  return null;
}

function main() {
  try {
    checkPackageScripts();
    checkExceptionHandlers();
  } catch (err) {
    console.error(`[honest-failure] internal error: ${err && err.message}`);
    process.exit(2);
  }

  if (EMIT_JSON) {
    console.log(JSON.stringify({ ok: violations.length === 0, violations }, null, 2));
  } else if (violations.length === 0) {
    console.log('[honest-failure] OK: no success-masking patterns found');
  } else {
    console.error(`\n[honest-failure] ${violations.length} violation(s):\n`);
    for (const v of violations) {
      console.error(`  ${v.file}`);
      console.error(`    ${v.detail}`);
      console.error(`    > ${v.evidence}\n`);
    }
    console.error('  A component that exits 0 after failing makes every supervisor above it lie.');
    console.error('  Let it fail loudly, or handle the failure — do not report success.\n');
  }

  process.exit(violations.length === 0 ? 0 : 1);
}

main();
