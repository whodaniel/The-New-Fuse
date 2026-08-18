#!/usr/bin/env node
/**
 * verify-declarations.cjs — reconcile what TNF *declares* against what exists.
 *
 * WHY (2026-08-05 audit, docs/protocols/reports/silent-failure-audit-2026-08-05.md)
 *
 *   Every severe failure found that day was declared-vs-actual drift that no
 *   check was looking for:
 *
 *     - the chronological catalog was absent entirely, so every cron job threw
 *       "not registered" and exited 0 — undetected for ~11 weeks
 *     - PROPRIETARY_* entries were bare filenames resolving nowhere, so the
 *       remover removed nothing and the leak checker still reported PASS —
 *       proprietary code shipped to the public repo
 *     - .nvmrc said node 20, production Dockerfiles built on 22, and 37
 *       workflows validated a runtime production does not use
 *     - four separate hardcoded provider lists disagreed with each other
 *
 *   `honest-failure-gate.yml` catches success-masking *patterns in source*.
 *   This catches the complementary class: declarations that point at nothing.
 *   A declaration that resolves nowhere protects nothing, schedules nothing and
 *   validates nothing, while every consumer reports success.
 *
 * DESIGN RULES (learned the hard way, same report)
 *   1. Never pass by finding nothing. If an input file is missing, that is a
 *      FAIL with a reason, never a silent skip — "found no problems" and
 *      "looked in the wrong place" must be distinguishable.
 *   2. Never cry wolf. Conditions that are legitimately absent (build outputs
 *      on an unbuilt tree) report NOTE, not FAIL. A check that fails on every
 *      fresh checkout trains operators to ignore it.
 *   3. Exit code reflects findings, and callers must not pipe it through tail.
 *
 * USAGE
 *   node scripts/protocols/verify-declarations.cjs          # human output
 *   node scripts/protocols/verify-declarations.cjs --json   # machine output
 *
 * EXIT
 *   0 = every declaration resolves
 *   1 = drift found
 *   2 = could not run the check (missing inputs) — never conflated with 0
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const REPO = path.resolve(__dirname, '..', '..');
const JSON_OUT = process.argv.includes('--json');

const findings = [];
const notes = [];
let blocked = false;

function fail(check, detail, fix) {
  findings.push({ check, detail, fix });
}
function note(check, detail) {
  notes.push({ check, detail });
}
function block(check, detail) {
  blocked = true;
  findings.push({ check, detail, fix: 'restore the missing input; this check cannot run without it' });
}

function readJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

const isBuildOutput = (p) => p.includes('/dist/') || p.startsWith('dist/');

/* ------------------------------------------------------------------ *
 * 1. Chronological control plane: registry ⇄ catalog ⇄ commands ⇄ cron
 * ------------------------------------------------------------------ */
function checkControlPlane() {
  const CHECK = 'control-plane';
  const registryPath = path.join(REPO, 'data', 'protocols', 'cron-jobs.registry.json');
  const catalogPath = path.join(REPO, 'data', 'protocols', 'chronological-process-catalog.json');
  const profilesPath = path.join(REPO, 'data', 'protocols', 'chronological-dispatch-profiles.json');

  const registry = readJson(registryPath);
  const catalog = readJson(catalogPath);
  const profiles = readJson(profilesPath) || { entries: {} };

  // Read the scheduler first: it determines whether these artifacts are
  // *required* here. They are gitignored runtime state, so on a CI runner or a
  // fresh clone they are legitimately absent — blocking there would fail every
  // run and train everyone to ignore this gate. They are only load-bearing when
  // something actually schedules against them.
  let crontab = '';
  let hasCrontab = false;
  try {
    crontab = execSync('crontab -l', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    hasCrontab = /--process-id/.test(crontab);
  } catch {
    hasCrontab = false;
  }

  if (!registry || !catalog) {
    const missing = [!registry && 'cron-jobs.registry.json', !catalog && 'chronological-process-catalog.json']
      .filter(Boolean)
      .join(', ');
    if (!hasCrontab) {
      note(CHECK, `${missing} absent, and no cron schedules TNF processes here — runtime state not required on this host`);
      return;
    }
    // Cron schedules jobs that cannot resolve. This is the 11-week outage.
    return block(
      CHECK,
      `${missing} missing while crontab schedules TNF processes — every job will throw "not registered" and exit 0`
    );
  }

  const jobs = Array.isArray(registry.jobs) ? registry.jobs : [];
  const entries = catalog.entries || {};
  const jobIds = new Set(jobs.map((j) => j.schedule_id));
  const catalogIds = new Set(Object.keys(entries));

  for (const id of jobIds) {
    if (!catalogIds.has(id)) fail(CHECK, `registered job "${id}" has no catalog entry`, 'add the entry or unregister the job');
  }
  for (const id of catalogIds) {
    if (!jobIds.has(id)) fail(CHECK, `catalog entry "${id}" is not registered`, 'register it or remove the entry');
  }

  // A runNow pointing at a nonexistent script fails only when it fires.
  for (const [id, e] of Object.entries(entries)) {
    const run = e.runNow;
    if (!run) continue;
    const target = (run.args || []).find((a) => typeof a === 'string' && a.includes('/'));
    if (!target) continue;
    if (!fs.existsSync(path.join(REPO, target))) {
      fail(CHECK, `"${id}" runNow targets missing script: ${target}`, 'fix the path or disable the process');
    }
    // Self-reference: the runner invoking itself for the same id recurses until
    // the single-instance guard turns it into a silent "already-running" skip.
    if (target.endsWith('run-chronological-process.cjs') && (run.args || []).includes(id)) {
      fail(CHECK, `"${id}" runNow re-invokes the runner for itself (infinite self-dispatch)`, 'point runNow at the real implementing script');
    }
  }

  // Dispatch-routed jobs throw "No dispatch profile registered" at fire time.
  const profileIds = new Set(Object.keys(profiles.entries || {}));
  for (const [id, e] of Object.entries(entries)) {
    const args = e.runNow?.args || [];
    if (args.some((a) => typeof a === 'string' && a.endsWith('chronological-dispatch.cjs')) && !profileIds.has(id)) {
      fail(CHECK, `"${id}" dispatches but has no profile in chronological-dispatch-profiles.json`, 'add a dispatch profile');
    }
  }

  // Anything cron actually invokes must be registered.
  if (!hasCrontab) note(CHECK, 'no cron schedules TNF processes here — skipping cron/registry cross-check');
  if (crontab) {
    const ids = [...crontab.matchAll(/--process-id\s+"?([a-z0-9-]+)"?/g)].map((m) => m[1]);
    for (const id of new Set(ids)) {
      if (!jobIds.has(id)) fail(CHECK, `crontab schedules unregistered process "${id}"`, 'register it or remove the cron line');
    }
    // A truncated crontab write spliced two jobs mid-id on 2026-08-05.
    for (const line of crontab.split('\n')) {
      if (/--process-id\s+"[a-z0-9-]*\d+\s+[\d*/,-]+\s/.test(line)) {
        fail(CHECK, `crontab line appears truncated/spliced: ${line.slice(0, 80)}…`, 'rewrite the crontab line');
      }
    }
  }
}

/* ------------------------------------------------------------------ *
 * 2. Node runtime agreement: .nvmrc ⇄ workflows ⇄ Dockerfiles
 * ------------------------------------------------------------------ */
function checkNodeVersions() {
  const CHECK = 'node-version';
  const nvmrcPath = path.join(REPO, '.nvmrc');
  if (!fs.existsSync(nvmrcPath)) return block(CHECK, '.nvmrc missing — no single source of truth for the node runtime');
  const nvmrc = fs.readFileSync(nvmrcPath, 'utf8').trim().replace(/^v/, '');
  const major = nvmrc.split('.')[0];

  const wfDir = path.join(REPO, '.github', 'workflows');
  if (fs.existsSync(wfDir)) {
    for (const f of fs.readdirSync(wfDir).filter((n) => /\.ya?ml$/.test(n))) {
      const body = fs.readFileSync(path.join(wfDir, f), 'utf8');
      for (const m of body.matchAll(/^\s*node-version:\s*["']?([\w.]+)["']?\s*$/gm)) {
        const declared = m[1].replace(/^v/, '').split('.')[0];
        if (declared !== major) {
          fail(CHECK, `${f} pins node ${m[1]} but .nvmrc says ${nvmrc}`, 'use node-version-file: ".nvmrc"');
        } else {
          fail(CHECK, `${f} hardcodes node ${m[1]} instead of reading .nvmrc`, 'use node-version-file: ".nvmrc"');
        }
      }
    }
  }

  for (const f of fs.readdirSync(REPO).filter((n) => /^Dockerfile/.test(n))) {
    const body = fs.readFileSync(path.join(REPO, f), 'utf8');
    for (const m of body.matchAll(/^FROM\s+node:(\d+)/gm)) {
      if (m[1] !== major) {
        fail(CHECK, `${f} builds on node ${m[1]} but .nvmrc says ${nvmrc}`, 'align the base image with .nvmrc');
      }
    }
  }
}

/* ------------------------------------------------------------------ *
 * 3. Proprietary boundary declarations resolve
 * ------------------------------------------------------------------ */
function checkProprietaryDeclarations() {
  const CHECK = 'proprietary-boundary';
  const syncPath = path.join(REPO, 'scripts', 'sync-repos.sh');
  if (!fs.existsSync(syncPath)) return note(CHECK, 'scripts/sync-repos.sh not present — skipping');
  const body = fs.readFileSync(syncPath, 'utf8');

  for (const arr of ['PROPRIETARY_FILES', 'PROPRIETARY_DIRS', 'PROPRIETARY_SCRIPTS']) {
    const block = body.match(new RegExp(`^${arr}=\\(([\\s\\S]*?)^\\)`, 'm'));
    if (!block) {
      fail(CHECK, `${arr} not found in sync-repos.sh`, 'restore the array; the boundary is unenforceable without it');
      continue;
    }
    const paths = [...block[1].matchAll(/^\s*"([^"]+)"/gm)].map((m) => m[1]);
    if (!paths.length) fail(CHECK, `${arr} is empty`, 'declare the proprietary paths');
    for (const p of paths) {
      // Resolution is the only thing that matters. A slash-free entry is fine
      // when it is a real top-level path (cloudflare-sharedstate); flagging it
      // on shape alone would cry wolf, which is the defect this file exists to
      // prevent. What is dangerous is an entry that resolves NOWHERE.
      if (fs.existsSync(path.join(REPO, p))) continue;

      if (isBuildOutput(p)) {
        note(CHECK, `${p} absent (build output, package unbuilt)`);
        continue;
      }

      // The 2026-07-25 leak signature: declared by basename, so every consumer
      // resolved it against the repo root, matched nothing, removed nothing —
      // while the real file sat in a subdirectory and published.
      if (!p.includes('/')) {
        let elsewhere = null;
        try {
          const hit = execSync(
            `git ls-files -- '*/${p}' | head -1`,
            { cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
          ).trim();
          elsewhere = hit || null;
        } catch {
          elsewhere = null;
        }
        if (elsewhere) {
          fail(
            CHECK,
            `${arr} declares bare filename "${p}" which resolves nowhere, but ${elsewhere} exists — the 2026-07-25 leak pattern`,
            `change the entry to "${elsewhere}"`
          );
          continue;
        }
      }

      fail(CHECK, `${arr} declares "${p}" which does not exist`, 'fix the path or drop the entry');
    }
  }
}

/* ------------------------------------------------------------------ */
function main() {
  checkControlPlane();
  checkNodeVersions();
  checkProprietaryDeclarations();

  if (JSON_OUT) {
    console.log(JSON.stringify({ ok: findings.length === 0, blocked, findings, notes }, null, 2));
  } else {
    console.log('\n[verify-declarations] declared vs actual\n');
    for (const n of notes) console.log(`  NOTE  [${n.check}] ${n.detail}`);
    if (notes.length) console.log('');
    for (const f of findings) {
      console.log(`  DRIFT [${f.check}] ${f.detail}`);
      console.log(`        fix: ${f.fix}`);
    }
    console.log(
      findings.length === 0
        ? `  OK: all declarations resolve (${notes.length} note(s))\n`
        : `\n  ${findings.length} drift finding(s)\n`
    );
  }

  if (blocked) process.exit(2);
  process.exit(findings.length === 0 ? 0 : 1);
}

main();
