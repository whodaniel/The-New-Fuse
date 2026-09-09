#!/usr/bin/env node
/**
 * Delegation records — the join between the two primitives TNF already had.
 *
 * TNF carried two complementary lineage systems that never met:
 *
 *   • `tnf-capability-grant.cjs` gives HIERARCHY. A grant's `prf[]` is a
 *     parent-pointer chain, attenuation guarantees child ⊆ parent, and
 *     MAX_CHAIN_DEPTH bounds it. It knew the shape of the tree but nothing
 *     about tenants or sessions.
 *   • `session-handoff-mcid.cjs` gives IDENTITY — tenant, session key,
 *     correlation and causation. It knew who and when, but only along the
 *     TEMPORAL axis (session N caused session N+1), never parent-to-child.
 *
 * A delegation record is `(grant, mcid)`. Joining them is what makes the whole
 * network state trackable: every row names its parent, its depth, and the root
 * task all its siblings share, so N agents delegating to M sub-agents
 * reconstruct as one tree instead of N unrelated sessions colliding on one
 * global handoff slot.
 *
 * Deliberately NOT a new authority. The grant remains the only thing that
 * decides what an agent may do; this is the observability layer that grant
 * chain already implies. Records are evidence, never permission — nothing here
 * should ever be consulted to authorize an action.
 */
'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

/**
 * Machine-local, beside the authority state it describes.
 *
 * `~/.tnf/` rather than the repo: the ledger names agents, tasks and tenants,
 * and `.tnf/` inside this repository is a TRACKED directory, so a repo-relative
 * ledger would publish the operator's delegation history on every push.
 */
const LEDGER_PATH =
  process.env.TNF_DELEGATION_LEDGER ||
  path.join(process.env.TNF_AUTHORITY_HOME || os.homedir(), '.tnf', 'delegation-ledger.jsonl');

/**
 * Build a delegation record from a VERIFIED grant result.
 *
 * @param {object} verified  the result of `verifyGrant` — must be authorized
 * @param {object} [opts]
 * @param {string} [opts.tenantId]   defaults to 'tnf-local', matching the MCID default
 * @param {string} [opts.sessionKey] the delegate's session, when known
 * @param {string} [opts.status]     'issued' | 'accepted' | 'reported' | 'failed'
 * @param {string} [opts.note]
 */
function buildDelegationRecord(verified, opts = {}) {
  if (!verified || verified.authorized !== true) {
    // Fail closed and loudly. A record built from an unverified grant would be
    // a lie in an audit trail, which is worse than no record at all.
    throw new Error('[tnf-delegation] refusing to record a delegation from an unverified grant');
  }

  const chain = Array.isArray(verified.chain) ? verified.chain : [];
  return {
    spec: 'tnf/delegation-record/0.1',
    recordedAt: new Date().toISOString(),
    tenantId: opts.tenantId || 'tnf-local',
    // Constant for every descendant of one delegation. Null only for a grant
    // whose root never named a task.
    rootTaskId: verified.rootTaskId || null,
    boundTask: verified.boundTask || null,
    // The edge: who delegated, to whom, how far down.
    parent: chain.length ? chain[chain.length - 1] : null,
    child: verified.audience || null,
    depth: Number.isInteger(verified.depth) ? verified.depth : chain.length - 1,
    ancestry: chain,
    // The contract: what it may do, where it reports, and when it must.
    capabilities: verified.effective || [],
    returnTo: verified.returnTo || null,
    reportOn: verified.reportOn || [],
    sessionKey: opts.sessionKey || null,
    status: opts.status || 'issued',
    ...(opts.note ? { note: opts.note } : {}),
  };
}

/** Append one record. Append-only: a delegation that happened cannot un-happen. */
function appendDelegationRecord(record, ledgerPath = LEDGER_PATH) {
  fs.mkdirSync(path.dirname(ledgerPath), { recursive: true });
  fs.appendFileSync(ledgerPath, `${JSON.stringify(record)}\n`, { mode: 0o600 });
  return ledgerPath;
}

/** Read every record, skipping unparseable lines rather than failing the read. */
function readDelegationLedger(ledgerPath = LEDGER_PATH) {
  if (!fs.existsSync(ledgerPath)) return [];
  const out = [];
  for (const line of fs.readFileSync(ledgerPath, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try {
      out.push(JSON.parse(line));
    } catch {
      // A truncated final line (crash mid-append) must not blind the whole
      // ledger. Skip it; the records before it are still evidence.
    }
  }
  return out;
}

/**
 * Reconstruct one delegation tree.
 *
 * This is the question the system could not previously answer at all: given a
 * root task, who is working on it, under whom, with what authority. Parity
 * reports count agent REACHABILITY; none of them could count delegated work.
 *
 * @returns {{rootTaskId: string, tenantId: string|null, nodes: Map, roots: Array, maxDepth: number, count: number}}
 */
function buildDelegationTree(rootTaskId, ledgerPath = LEDGER_PATH) {
  const rows = readDelegationLedger(ledgerPath).filter((r) => r.rootTaskId === rootTaskId);
  const nodes = new Map();

  for (const row of rows) {
    if (!row.child) continue;
    // Last write wins per edge: a delegation that is later reported on should
    // read as 'reported', not duplicate as a second node.
    const existing = nodes.get(row.child);
    if (!existing || existing.depth >= row.depth) {
      nodes.set(row.child, {
        agent: row.child,
        parent: row.parent,
        depth: row.depth,
        capabilities: row.capabilities,
        returnTo: row.returnTo,
        reportOn: row.reportOn,
        status: row.status,
        children: [],
      });
    }
  }

  const roots = [];
  for (const node of nodes.values()) {
    const parent = node.parent ? nodes.get(node.parent) : null;
    if (parent) parent.children.push(node.agent);
    else roots.push(node.agent);
  }

  return {
    rootTaskId,
    tenantId: rows.length ? rows[0].tenantId : null,
    nodes,
    roots,
    maxDepth: rows.reduce((m, r) => Math.max(m, r.depth ?? 0), 0),
    count: nodes.size,
  };
}

module.exports = {
  LEDGER_PATH,
  buildDelegationRecord,
  appendDelegationRecord,
  readDelegationLedger,
  buildDelegationTree,
};
