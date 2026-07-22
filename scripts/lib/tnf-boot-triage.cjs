#!/usr/bin/env node

// TNF boot-output triage (operator directive 2026-07-22).
//
// Principle: TNF should have KNOWLEDGE of the whole agentic ecosystem —
// past agents, legacy paths, retired integrations — but must not EXPECT
// them at boot. An expectation that only ever held for a past edge case
// must not surface as a WARN/error; it is demoted to knowledge-only.
//
// Three classes for every non-info boot line:
//   stale-expectation → matches the stale-expectations registry: demoted,
//                       printed once as knowledge-only, never a warning.
//   transient-infra   → known flaky infra (DB timeouts, redis races):
//                       reported, not escalated.
//   real-error        → everything else that looks like an error: kept,
//                       reported, and handed to the agentic remediation
//                       hook (printed command by default; auto-dispatched
//                       when TNF_BOOT_TRIAGE_AGENT=1).
//
// The registry is data, not code: repo defaults live in
// data/boot-stale-expectations.json and the operator can extend them in
// ~/.tnf/boot-triage/stale-expectations.json without touching this file.

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const REPO_ROOT = process.env.TNF_ROOT_DIR || process.cwd();
const REPO_REGISTRY = path.join(REPO_ROOT, 'data', 'boot-stale-expectations.json');
const HOME_REGISTRY = path.join(os.homedir(), '.tnf', 'boot-triage', 'stale-expectations.json');
const REPORT_PATH = path.join(os.homedir(), '.tnf', 'boot-triage-latest.json');

const ERROR_LINE_RE = /\b(WARN|ERROR|FAIL(?:ED)?|missing|broken|unavailable|timed? ?out|ENOENT|EADDRINUSE)\b/i;
const TRANSIENT_RE = /\b(DB unavailable|timed? ?out|ECONNREFUSED|ECONNRESET|redis.*(?:unavailable|refused)|lock.*(?:exists|held)|already-running)\b/i;

function loadJsonIfPresent(p) {
  try {
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    // Malformed registry entries must never break boot.
  }
  return null;
}

/** Merge repo + operator registries. Entries: {pattern, flags?, reason, class?} */
function loadStaleExpectations() {
  const entries = [];
  for (const source of [REPO_REGISTRY, HOME_REGISTRY]) {
    const data = loadJsonIfPresent(source);
    if (Array.isArray(data?.expectations)) {
      for (const e of data.expectations) {
        if (!e?.pattern) continue;
        try {
          entries.push({
            re: new RegExp(e.pattern, e.flags || 'i'),
            reason: e.reason || 'registered stale expectation',
            source,
          });
        } catch {
          // Bad regex in registry — skip, never break boot.
        }
      }
    }
  }
  return entries;
}

function classifyLines(lines, staleEntries) {
  const demoted = [];
  const transient = [];
  const realErrors = [];
  for (const raw of lines) {
    const line = String(raw || '').trim();
    if (!line || !ERROR_LINE_RE.test(line)) continue;
    const stale = staleEntries.find((e) => e.re.test(line));
    if (stale) {
      demoted.push({ line, reason: stale.reason });
    } else if (TRANSIENT_RE.test(line)) {
      transient.push({ line });
    } else {
      realErrors.push({ line });
    }
  }
  return { demoted, transient, realErrors };
}

/**
 * Split ledger content into sections keyed by their `## ` headings, tracking
 * which identities appear inside each. Federated/multitenant rule: an
 * identity's SCOPE is the section it lives in. Identities inside a
 * federation section (heading matches /federation/i) are federation
 * components — their liveness is the federation layer's concern, so the
 * definition-based staleness rule does not apply to them. Identities in a
 * Historical section are already archived knowledge.
 */
function parseLedgerIdentityScopes(ledgerContent) {
  const scopes = new Map(); // identity -> { section, federated, historical }
  let section = '(preamble)';
  for (const line of String(ledgerContent).split(/\r?\n/)) {
    const heading = line.match(/^##\s+(.+)$/);
    if (heading) section = heading[1].trim();
    for (const m of line.matchAll(/`(TNF:[^`]+)`/g)) {
      const id = m[1];
      if (!scopes.has(id)) {
        scopes.set(id, {
          section,
          federated: /federation/i.test(section),
          historical: /historical/i.test(section),
        });
      }
    }
  }
  return scopes;
}

/**
 * Reverse ledger check: identities registered in AGENT_STATUS_LEDGER.md that
 * have no current definition under .agent/agents/ are stale expectations —
 * past agents from previous edge cases. Knowledge of them is fine; expecting
 * them (counting them as registered actives) is not.
 *
 * Federated/multitenant scoping: identities inside federation sections are
 * live components of that federation layer (exempt), and identities already
 * in a Historical section are archived knowledge (exempt). The check only
 * binds expectations for the definition layer of THIS workspace/tenant
 * (TNF_ROOT_DIR) — other tenants' ledgers are theirs to govern.
 */
function reverseLedgerCheck() {
  try {
    const agentsDir = path.join(REPO_ROOT, '.agent', 'agents');
    const ledgerPath = path.join(REPO_ROOT, 'docs', 'protocols', 'AGENT_STATUS_LEDGER.md');
    if (!fs.existsSync(agentsDir) || !fs.existsSync(ledgerPath)) return { stale: [], defined: 0 };

    const definedNames = new Set();
    for (const f of fs.readdirSync(agentsDir).filter((f) => f.endsWith('.md'))) {
      definedNames.add(path.basename(f, '.md').toUpperCase().replace(/[^A-Z0-9]+/g, '-'));
      try {
        const fm = fs
          .readFileSync(path.join(agentsDir, f), 'utf8')
          .match(/^name:\s*([^\n]+)/m);
        if (fm) definedNames.add(fm[1].trim().toUpperCase().replace(/[^A-Z0-9]+/g, '-'));
      } catch {
        // Unreadable definition file — skip; never break boot.
      }
    }
    const ledger = fs.readFileSync(ledgerPath, 'utf8');
    const scopes = parseLedgerIdentityScopes(ledger);
    const stale = [];
    for (const [id, scope] of scopes) {
      if (scope.federated || scope.historical) continue; // federation/tenant-scoped or already archived
      // TNF:LOCAL:AGENT:<NAME>:NNN → <NAME>
      const name = (id.split(':')[3] || '').toUpperCase().replace(/[^A-Z0-9]+/g, '-');
      if (name && !definedNames.has(name)) stale.push({ identity: id, name, section: scope.section });
    }
    return { stale, defined: definedNames.size };
  } catch {
    return { stale: [], defined: 0 };
  }
}

function buildRemediationTask(realErrors) {
  const list = realErrors
    .slice(0, 10)
    .map((e, i) => `${i + 1}. ${e.line}`)
    .join('\n');
  return (
    `Triage these TNF boot errors. For each: identify root cause, fix what is safely fixable, ` +
    `and if it is a stale expectation from a past edge case, add it to ` +
    `data/boot-stale-expectations.json instead of fixing. Errors:\n${list}`
  );
}

/**
 * Run triage over collected boot output lines. Prints a Boot Triage section,
 * persists ~/.tnf/boot-triage-latest.json, and (optionally) dispatches the
 * agentic remediation loop for real errors.
 */
function runBootTriage(lines, { log = console.log } = {}) {
  const staleEntries = loadStaleExpectations();
  const { demoted, transient, realErrors } = classifyLines(lines, staleEntries);
  const ledger = reverseLedgerCheck();

  log('');
  log('=== Boot Triage ===');
  log(
    `- scanned ${lines.length} line(s): ${demoted.length} stale expectation(s) demoted, ` +
      `${transient.length} transient, ${realErrors.length} real error(s)`
  );
  for (const d of demoted) {
    log(`- knowledge-only (not expected): ${d.line}  [${d.reason}]`);
  }
  for (const t of transient) {
    log(`- transient infra (not escalated): ${t.line}`);
  }
  if (ledger.stale.length > 0) {
    log(
      `- ledger carries ${ledger.stale.length} identity/ies with no current definition ` +
        `(${ledger.defined} defined) — knowledge-only, from past edge cases:`
    );
    for (const s of ledger.stale) log(`    · ${s.identity}`);
  }
  for (const e of realErrors) {
    log(`- REAL ERROR: ${e.line}`);
  }

  const report = {
    generatedAt: new Date().toISOString(),
    demoted,
    transient,
    realErrors,
    staleLedgerIdentities: ledger.stale,
  };
  try {
    fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
    fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
    log(`- report: ${REPORT_PATH}`);
  } catch {
    // Reporting must never break boot.
  }

  if (realErrors.length > 0) {
    const task = buildRemediationTask(realErrors);
    if (process.env.TNF_BOOT_TRIAGE_AGENT === '1') {
      log('- dispatching agentic remediation (TNF_BOOT_TRIAGE_AGENT=1)...');
      try {
        const { spawn } = require('node:child_process');
        const child = spawn('bash', ['-lc', `cd '${REPO_ROOT}' && ./tnf agents run --task ${JSON.stringify(task)} --quiet`], {
          detached: true,
          stdio: 'ignore',
        });
        child.unref();
      } catch (err) {
        log(`- remediation dispatch failed: ${err?.message || err}`);
      }
    } else {
      log('- agentic remediation available: TNF_BOOT_TRIAGE_AGENT=1, or run:');
      log(`    ./tnf agents run --task "triage boot errors in ~/.tnf/boot-triage-latest.json"`);
    }
  }

  return report;
}

/** Tee console.log/error so boot phases don't need per-line plumbing. */
function createBootOutputCollector() {
  const lines = [];
  const origLog = console.log;
  const origErr = console.error;
  console.log = (...args) => {
    lines.push(args.map(String).join(' '));
    origLog(...args);
  };
  console.error = (...args) => {
    lines.push(args.map(String).join(' '));
    origErr(...args);
  };
  return {
    lines,
    restore() {
      console.log = origLog;
      console.error = origErr;
    },
  };
}

module.exports = {
  runBootTriage,
  createBootOutputCollector,
  classifyLines,
  loadStaleExpectations,
  reverseLedgerCheck,
  parseLedgerIdentityScopes,
};
