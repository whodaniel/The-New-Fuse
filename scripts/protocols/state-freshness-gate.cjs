#!/usr/bin/env node
/**
 * TNF State Freshness Gate
 *
 * Why this exists (2026-08-14):
 *   An agent session reported that the public repo's history had been replaced
 *   with a single commit, its PR queue wiped, and control-plane source
 *   published. All three were false. The root cause was not a bad tool — it was
 *   an unverified inference: `gh api repos/<r>/commits/<sha>` returned 200 for a
 *   DANGLING commit (on no branch), and that 200 was read as "this is main's
 *   tip". Nothing in the harness required the claim to be re-derived from a ref
 *   lookup before it was reported as fact.
 *
 *   Conversation memory is a snapshot. External state is not. Any fact about a
 *   remote, a service, or a work-tree decays the moment it is observed, and an
 *   agent resuming from a summary cannot tell a fresh fact from a stale one.
 *
 * What it does:
 *   Maintains dated receipts for a registry of VOLATILE STATE DOMAINS. Each
 *   domain carries a probe, a TTL, and — most importantly — the specific misread
 *   that produces false claims about it (`trap`). High-consequence domains carry
 *   a second, independent `corroborate` probe; a mismatch is a hard failure,
 *   because disagreement between two views is exactly the signature of the bug
 *   above.
 *
 * Modes:
 *   --refresh [--only <id>]   run probes, write receipts
 *   --check                   exit 1 if any receipt is missing, stale, or split
 *   --frontload               compact block for the session-start packet
 *   --json                    machine-readable
 *
 * Contract: never breaks a session. --frontload always exits 0.
 * Authority: docs/protocols/STATE_FRESHNESS_MANDATE.md
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const REGISTRY_PATH = path.join(ROOT, 'docs', 'protocols', 'state-freshness.registry.json');

function parseArgs(argv) {
  const args = { refresh: false, check: false, frontload: false, json: false, only: '', help: false };
  for (let i = 0; i < argv.length; i += 1) {
    const t = argv[i];
    if (t === '--refresh') args.refresh = true;
    else if (t === '--check') args.check = true;
    else if (t === '--frontload') args.frontload = true;
    else if (t === '--json') args.json = true;
    else if (t === '--only') args.only = argv[++i] || '';
    else if (t === '--help' || t === '-h') args.help = true;
  }
  if (!args.refresh && !args.check && !args.frontload) args.check = true;
  return args;
}

function loadRegistry() {
  const raw = fs.readFileSync(REGISTRY_PATH, 'utf8');
  const reg = JSON.parse(raw);
  if (!Array.isArray(reg.domains) || reg.domains.length === 0) {
    throw new Error('registry has no domains');
  }
  return reg;
}

function receiptsPath(reg) {
  // resolve, not join: an absolute receiptsPath must win outright. path.join
  // would splice it under ROOT and silently write outside the intended target.
  return path.resolve(ROOT, reg.receiptsPath || 'data/protocols/state-freshness.json');
}

function loadReceipts(reg) {
  try {
    return JSON.parse(fs.readFileSync(receiptsPath(reg), 'utf8'));
  } catch {
    return { version: 1, receipts: {} };
  }
}

function saveReceipts(reg, data) {
  const p = receiptsPath(reg);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, `${JSON.stringify(data, null, 2)}\n`);
  return p;
}

function runProbe(cmd) {
  try {
    const out = execSync(cmd, {
      cwd: ROOT,
      encoding: 'utf8',
      timeout: 30_000,
      maxBuffer: 16 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return { ok: true, value: String(out).trim() };
  } catch (error) {
    return { ok: false, value: '', error: error?.message?.slice(0, 200) || 'probe failed' };
  }
}

function refresh(reg, only) {
  const store = loadReceipts(reg);
  store.receipts = store.receipts || {};
  const results = [];

  for (const d of reg.domains) {
    if (only && d.id !== only) continue;
    const primary = runProbe(d.probe);
    const receipt = {
      observedAt: new Date().toISOString(),
      ok: primary.ok,
      value: primary.value,
      ttlSeconds: d.ttlSeconds,
      severity: d.severity || 'medium',
    };
    if (!primary.ok) receipt.error = primary.error;

    // Independent second view. Disagreement is the signature of the
    // dangling-commit class of bug — treat it as a hard split, never pick one.
    if (d.corroborate) {
      const second = runProbe(d.corroborate);
      receipt.corroborated = second.ok && second.value === primary.value;
      receipt.corroborateValue = second.value;
      if (!receipt.corroborated) {
        receipt.split = true;
      }
    }

    store.receipts[d.id] = receipt;
    results.push({ id: d.id, ...receipt });
  }

  store.refreshedAt = new Date().toISOString();
  saveReceipts(reg, store);
  return results;
}

function ageSeconds(iso) {
  const t = Date.parse(iso || '');
  if (Number.isNaN(t)) return Infinity;
  return Math.max(0, Math.floor((Date.now() - t) / 1000));
}

function evaluate(reg) {
  const store = loadReceipts(reg);
  const rows = reg.domains.map((d) => {
    const r = (store.receipts || {})[d.id];
    if (!r) {
      return { id: d.id, title: d.title, state: 'MISSING', age: null, severity: d.severity, trap: d.trap };
    }
    const age = ageSeconds(r.observedAt);
    let state = 'FRESH';
    if (r.split) state = 'SPLIT';
    else if (!r.ok) state = 'PROBE_FAILED';
    else if (age > d.ttlSeconds) state = 'STALE';
    // A probe can exit 0 while reporting a bad world (e.g. REDIS_UNREACHABLE).
    // That observation is fresh and correct — but it must not render as a
    // checkmark, or the frontload would advertise health it never measured.
    else if (d.expect && !new RegExp(d.expect).test(r.value)) state = 'DEGRADED';
    return {
      id: d.id,
      title: d.title,
      state,
      age,
      ttl: d.ttlSeconds,
      severity: d.severity,
      value: r.value,
      trap: d.trap,
    };
  });

  // This gate answers "is this fact current", not "is the system healthy".
  // DEGRADED is a *correctly observed* bad value — surface it, but only
  // freshness violations fail the gate.
  const degraded = rows.filter((r) => r.state === 'DEGRADED');
  const bad = rows.filter((r) => r.state !== 'FRESH' && r.state !== 'DEGRADED');
  return { rows, bad, degraded, ok: bad.length === 0 };
}

function fmtAge(sec) {
  if (sec === null || sec === Infinity) return 'never';
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m`;
  return `${Math.floor(sec / 3600)}h`;
}

function printFrontload(reg) {
  const { rows, bad, degraded } = evaluate(reg);
  console.log('- authority: docs/protocols/STATE_FRESHNESS_MANDATE.md');
  console.log(
    `- volatile domains: ${rows.length} tracked, ${rows.length - bad.length - degraded.length} fresh, ` +
      `${bad.length} needing re-verification, ${degraded.length} degraded`
  );
  for (const r of rows) {
    const mark = r.state === 'FRESH' ? '✓' : r.state === 'DEGRADED' ? '▲' : '!';
    let detail;
    if (r.state === 'FRESH') detail = `fresh ${fmtAge(r.age)} ago`;
    else if (r.state === 'DEGRADED') detail = `observed ${fmtAge(r.age)} ago :: ${String(r.value).replace(/\s+/g, ' ').slice(0, 60)}`;
    else detail = r.state.toLowerCase();
    console.log(`  ${mark} ${r.id}: ${detail}`);
  }
  if (bad.length > 0) {
    console.log('- RULE: do not assert any of the above from memory. Re-probe before you state it:');
    console.log('    node scripts/protocols/state-freshness-gate.cjs --refresh');
    for (const r of bad.filter((x) => x.severity === 'critical' || x.severity === 'high')) {
      console.log(`  · ${r.id} trap: ${r.trap}`);
    }
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log('usage: state-freshness-gate.cjs [--refresh|--check|--frontload] [--only <id>] [--json]');
    process.exit(0);
  }

  let reg;
  try {
    reg = loadRegistry();
  } catch (error) {
    // A missing registry must be loud for --check but silent for --frontload,
    // so a broken control plane can never wedge a session shut.
    if (args.frontload) {
      console.log(`- unavailable (${error.message}) — treat ALL external state as unverified`);
      process.exit(0);
    }
    console.error(`FAIL: cannot load registry: ${error.message}`);
    process.exit(2);
  }

  if (args.refresh) {
    const results = refresh(reg, args.only);
    if (args.json) {
      console.log(JSON.stringify({ ok: true, results }, null, 2));
    } else {
      for (const r of results) {
        const flag = r.split ? 'SPLIT' : r.ok ? 'ok' : 'PROBE_FAILED';
        console.log(`- ${r.id}: ${flag} :: ${String(r.value).slice(0, 100)}`);
        if (r.split) {
          console.log(`    primary=${String(r.value).slice(0, 60)}`);
          console.log(`    second =${String(r.corroborateValue).slice(0, 60)}`);
        }
      }
      console.log(`receipts -> ${receiptsPath(reg)}`);
    }
    const split = results.some((r) => r.split);
    process.exit(split ? 1 : 0);
  }

  if (args.frontload) {
    printFrontload(reg);
    process.exit(0);
  }

  const { rows, bad, ok } = evaluate(reg);
  if (args.json) {
    console.log(JSON.stringify({ ok, rows }, null, 2));
  } else if (ok) {
    console.log(`STATE FRESHNESS PASS — ${rows.length} domains fresh`);
  } else {
    console.log('STATE FRESHNESS FAIL');
    for (const r of bad) {
      console.log(`- ${r.id}: ${r.state} (age ${fmtAge(r.age)}, ttl ${r.ttl ?? '?'}s)`);
      if (r.trap) console.log(`    trap: ${r.trap}`);
    }
    console.log('remedy: node scripts/protocols/state-freshness-gate.cjs --refresh');
  }
  process.exit(ok ? 0 : 1);
}

if (require.main === module) main();

module.exports = { loadRegistry, evaluate, refresh };
