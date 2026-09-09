#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Shared observe/block harness for TNF enforcement gates.
 *
 * Why this exists
 * ---------------
 * TNF's enforcement layer had the same defect it catalogues elsewhere:
 * advertised tool, no executor. `tnf_require_operator()` always returned 0,
 * `state-freshness-gate.cjs --check` had zero call sites, and
 * `agent-self-edit-gate.cjs::evaluate()` — a complete actor-scoped ownership
 * model, with tests — was never called. Turning all of that on at once, against
 * a fleet of live agents and cron loops mid-cycle, would jam the fleet rather
 * than fix it.
 *
 * So every gate routes its decision through here. In `observe` mode a gate
 * records what it WOULD have blocked and lets the operation through. Once
 * `enforcement-report.cjs` shows a gate is silent on legitimate fleet activity,
 * that gate is flipped to `block`.
 *
 * Mode resolution, most specific first:
 *   TNF_ENFORCE_MODE_<GATE>   per-gate, GATE upper-cased with - and . as _
 *   TNF_ENFORCE_MODE          global
 *   'observe'                 default — new gates never block until promoted
 *
 * The ledger is append-only JSONL. That is deliberate: CHANGE_OWNERSHIP.jsonl
 * and COLLISION_LOG.jsonl are the only two state surfaces in this repo that
 * have never produced a merge conflict, because appending distinct records
 * cannot collide the way a wholesale file rewrite does.
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const MODES = new Set(['observe', 'block']);
const DEFAULT_MODE = 'observe';
const LEDGER_REL = 'data/protocols/ENFORCEMENT_OBSERVATIONS.jsonl';

function repoRoot() {
  try {
    // Reuse the canonical resolver. DURABLE_LOCAL_RUNTIME_MANDATE section 2
    // records this exact resolver being reimplemented six times, each copy
    // carrying the same latent flaw.
    const { resolveTnfRepo } = require('./resolve-tnf-repo.cjs');
    const resolved = resolveTnfRepo();
    if (resolved && resolved.repoRoot) return resolved.repoRoot;
    if (typeof resolved === 'string' && resolved) return resolved;
  } catch {
    /* fall through */
  }
  try {
    return execFileSync('git', ['rev-parse', '--show-toplevel'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return process.cwd();
  }
}

function envKeyFor(gate) {
  return `TNF_ENFORCE_MODE_${String(gate).toUpperCase().replace(/[-.]/g, '_')}`;
}

/** Resolve the effective mode for a gate. Unknown values fall back to the default. */
function modeFor(gate) {
  const candidates = [process.env[envKeyFor(gate)], process.env.TNF_ENFORCE_MODE];
  for (const raw of candidates) {
    if (!raw) continue;
    const value = String(raw).trim().toLowerCase();
    if (MODES.has(value)) return value;
  }
  return DEFAULT_MODE;
}

function gitSafe(args) {
  try {
    return execFileSync('git', args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

function ledgerPath(root) {
  return process.env.TNF_ENFORCEMENT_LEDGER
    ? path.resolve(process.env.TNF_ENFORCEMENT_LEDGER)
    : path.join(root || repoRoot(), LEDGER_REL);
}

/**
 * Append one immutable observation. Never throws: a gate must not fail because
 * its audit trail is unwritable. The DECISION is still returned by decide(),
 * so a block-mode violation still blocks even if the ledger write fails.
 */
function record(entry) {
  const root = repoRoot();
  const target = ledgerPath(root);
  const row = {
    ts: new Date().toISOString(),
    gate: entry.gate,
    mode: entry.mode,
    verdict: entry.verdict,
    enforced: Boolean(entry.enforced),
    subject: entry.subject === undefined ? null : entry.subject,
    detail: entry.detail === undefined ? null : entry.detail,
    agent_id: process.env.TNF_AGENT_ID || null,
    twid: process.env.TNF_TWID || null,
    git_author: gitSafe(['var', 'GIT_AUTHOR_IDENT']).replace(/\s+\d+\s+[+-]\d{4}$/, '') || null,
    branch: gitSafe(['symbolic-ref', '--short', 'HEAD']) || null,
    head_sha: gitSafe(['rev-parse', 'HEAD']) || null,
    host: os.hostname(),
    pid: process.pid,
  };
  try {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.appendFileSync(target, `${JSON.stringify(row)}\n`, 'utf8');
  } catch (error) {
    console.error(`[enforcement-mode] could not write ${target}: ${error.message}`);
  }
  return row;
}

/**
 * Record a gate decision and report whether the caller should fail.
 *
 * @param {object} input
 * @param {string} input.gate     stable gate id, e.g. 'agent-identity'
 * @param {string} input.verdict  'pass' | 'violation'
 * @param {*}      [input.subject] what was judged (path, branch, ref)
 * @param {*}      [input.detail]  structured context for the report
 * @returns {{blocked: boolean, mode: string, gate: string}}
 */
function decide(input) {
  const gate = input && input.gate ? String(input.gate) : 'unknown';
  const verdict = input && input.verdict === 'violation' ? 'violation' : 'pass';
  const mode = modeFor(gate);
  const blocked = verdict === 'violation' && mode === 'block';

  if (verdict === 'violation') {
    record({ ...input, gate, verdict, mode, enforced: blocked });
  }
  return { blocked, mode, gate };
}

/**
 * Print the standard "observed, not enforced" notice so observe-mode output is
 * recognisable in a hook transcript and never mistaken for a pass.
 */
function explain(result, message) {
  if (result.blocked) {
    console.error(`✖ [${result.gate}] ${message}`);
    return;
  }
  console.error(`▲ [${result.gate}] OBSERVED (not enforced): ${message}`);
  console.error(`  promote with ${envKeyFor(result.gate)}=block once the report is clean`);
}

module.exports = { decide, record, modeFor, explain, ledgerPath, envKeyFor, MODES, DEFAULT_MODE };
