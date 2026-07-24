#!/usr/bin/env node

/**
 * tnf-authority — operator CLI for the elevation approval channel.
 *
 *   node scripts/tnf-authority.cjs review          <- interactive; start here
 *   node scripts/tnf-authority.cjs status
 *   node scripts/tnf-authority.cjs list
 *   node scripts/tnf-authority.cjs show <requestId>
 *   node scripts/tnf-authority.cjs approve <requestId> [--ttl 900] [--only cap,cap] [--reason "..."]
 *   node scripts/tnf-authority.cjs deny <requestId> [--reason "..."]
 *
 * `approve` and `deny` refuse to run from agent context (see
 * tnf-elevation-broker.cjs). Under a `file` trust root those checks are
 * defence-in-depth only — `status` says so plainly, every time.
 */

'use strict';

const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const broker = require('./lib/tnf-elevation-broker.cjs');
const trust = require('./lib/tnf-trust-root.cjs');

function arg(flag, fallback = null) {
  const i = process.argv.indexOf(flag);
  if (i === -1) return fallback;
  const v = process.argv[i + 1];
  return v && !v.startsWith('--') ? v : fallback;
}

function fmtCaps(caps) {
  return caps.map((c) => `${c.can} on ${c.with}`).join(', ');
}

/**
 * Worker-agent wrappers that are untrusted and MUST run as the agent account.
 * Operator-side processes (master-clock, cron chronological jobs, this CLI) are
 * intentionally excluded — they legitimately run as the operator and hold the
 * key. See docs/protocols/AUTHORITY_INTEGRATION_MAP.md for the split.
 */
const WORKER_AGENT_PATTERNS = [
  'gemini-redis-wrapper',
  'jules-redis-wrapper',
  'claude-redis-wrapper',
  'antigravity-redis-wrapper',
  'pi-wrapper',
  'pi-coding-agent',
];

/**
 * Find worker-agent processes running as the operator uid. Those can read the
 * operator key regardless of what the agent account can do, so their presence
 * means launch isolation is NOT real — the file-denial test alone would
 * false-pass. Returns a list of "pid command" strings.
 */
function workerAgentsRunningAsOperator({ psOutput = null, selfUid = null } = {}) {
  selfUid = selfUid ?? (typeof process.getuid === 'function' ? process.getuid() : null);
  if (selfUid === null) return [];
  let out = psOutput;
  if (out === null) {
    try {
      out = execFileSync('ps', ['-axo', 'uid,pid,command'], { encoding: 'utf8' });
    } catch {
      return []; // can't enumerate — caller treats the check as inconclusive
    }
  }
  const hits = [];
  for (const line of out.split('\n')) {
    const m = line.trim().match(/^(\d+)\s+(\d+)\s+(.*)$/);
    if (!m) continue;
    const [, uid, pid, command] = m;
    if (Number.parseInt(uid, 10) !== selfUid) continue;
    if (WORKER_AGENT_PATTERNS.some((p) => command.includes(p))) {
      hits.push(`${pid} ${command.slice(0, 80)}`);
    }
  }
  return hits;
}

/**
 * Attest that agents are isolated to the agent account.
 *
 * Does NOT take the operator's word for it: it runs the denial test itself —
 * `sudo -u <agent> cat <operator key>` — and writes the marker only if the read
 * is actually denied. If the key is still readable by the agent account, the
 * marker is refused and the trust root stays degraded. This keeps the
 * attestation honest: it cannot be set by claim, only by a passing test.
 */
async function cmdConfirmIsolation() {
  const agentUser = process.env.TNF_AGENT_USER || 'tnf-agent';
  const keyPath = trust.OPERATOR_KEY_PATH;

  if (!fs.existsSync(keyPath)) {
    console.error(`No operator key at ${keyPath} yet — nothing to protect. Run an approval first.`);
    process.exitCode = 1;
    return;
  }

  console.log(`Testing that "${agentUser}" cannot read the operator key...`);
  let denied = false;
  try {
    // If this SUCCEEDS, the agent can read the key — isolation is NOT real.
    execFileSync('sudo', ['-n', '-u', agentUser, 'cat', keyPath], { stdio: ['ignore', 'ignore', 'ignore'] });
    denied = false;
  } catch (err) {
    // Permission denied (or sudo refusal) is the outcome we want. Distinguish a
    // real denial from "sudo needs a password" so we don't false-pass.
    const msg = String(err.stderr || err.message || '');
    if (/password is required|a terminal is required|not allowed/i.test(msg)) {
      console.error(
        '\nCould not run the test non-interactively (sudo needs a password).\n' +
          `Run this yourself and confirm it says "Permission denied":\n` +
          `    sudo -u ${agentUser} cat ${keyPath}\n` +
          'Then re-run: tnf-authority confirm-isolation --force-after-manual-check'
      );
      process.exitCode = 1;
      return;
    }
    denied = true;
  }

  if (!denied && !process.argv.includes('--force-after-manual-check')) {
    console.error(
      `\n❌ "${agentUser}" CAN still read ${keyPath}. Isolation is NOT real.\n` +
        'Migrate agent launchers to run as that user (launchd UserName / systemd User=),\n' +
        'then re-run. Marker NOT written; trust root stays degraded.'
    );
    process.exitCode = 1;
    return;
  }

  // The denial test proves the FILE boundary. It does NOT prove agents run as
  // the agent account — a worker still running as the operator can read the key
  // regardless. Refuse to write the marker while any such process is live, or
  // the marker would certify a boundary that does not hold. This is the fix for
  // the same over-claim class as the trust-root probe bug.
  const stragglers = workerAgentsRunningAsOperator();
  if (stragglers.length && !process.argv.includes('--force-after-manual-check')) {
    console.error(
      `\n❌ ${stragglers.length} worker agent(s) are still running as the operator (uid can read the key):\n` +
        stragglers.map((s) => `    ${s}`).join('\n') +
        `\n\nThe file-denial test passed, but these processes make isolation NOT real.\n` +
        'Relaunch them as the agent account, then re-run. Marker NOT written.'
    );
    process.exitCode = 1;
    return;
  }

  fs.writeFileSync(
    trust.ISOLATION_MARKER,
    `confirmed ${new Date().toISOString()} by operator; file-denial=pass; worker-as-operator=none\n`,
    { mode: 0o600 }
  );
  console.log(`\n✅ Isolation confirmed. Marker written: ${trust.ISOLATION_MARKER}`);
  console.log(
    'Confirmed: the agent account cannot read the key AND no known worker wrapper is\n' +
      'running as the operator right now. The marker holds as long as agents continue to\n' +
      'launch as the agent account — it is an attestation of the current launch setup.'
  );
  const sel = await trust.selectTrustRoot();
  console.log(`\n${trust.describeSelection(sel)}`);
}

async function cmdStatus() {
  const sel = await trust.selectTrustRoot();
  console.log('TNF Authority — trust root\n');
  for (const d of sel.all) {
    const mark = d.available ? 'USABLE  ' : d.detail?.hardwarePresent ? 'DETECTED' : 'absent  ';
    console.log(`  [${mark}] ${d.kind.padEnd(20)} ${d.available ? d.summary : d.unavailableReason}`);
  }
  console.log(`\n${trust.describeSelection(sel)}`);

  const p = broker.pending();
  console.log(`\nPending requests: ${p.length}`);
  if (sel.degraded) {
    console.log(
      '\nNOTE: approvals signed under this root are only as trustworthy as every\n' +
        'process running as this user. Run `sudo bash scripts/setup/tnf-agent-account.sh`\n' +
        'to make the boundary kernel-enforced.'
    );
  }
}

function cmdList() {
  const items = broker.pending();
  if (!items.length) {
    console.log('No pending elevation requests.');
    return;
  }
  console.log(`Pending elevation requests (${items.length}):\n`);
  for (const r of items) {
    console.log(`  ${r.requestId}  [${r.tier}]  ${r.requesterRole}  ${r.requestedAt}`);
    console.log(`      did:   ${r.requesterDid}`);
    console.log(`      wants: ${fmtCaps(r.requested)}`);
    if (r.boundTask) console.log(`      task:  ${r.boundTask}`);
    if (r.claimedRole && r.claimedRole !== r.requesterRole) {
      console.log(`      ⚠️  claimed role "${r.claimedRole}" but registry says "${r.requesterRole}"`);
    }
    if (!r.roleFromRegistry) {
      console.log('      ⚠️  no registry entry — treated as worker');
    }
    console.log('');
  }
  console.log('Review with: show <requestId>   Decide with: approve|deny <requestId>');
}

function cmdShow(id) {
  const r = broker.getRequest(id);
  if (!r) {
    console.error(`No pending request ${id}`);
    process.exitCode = 1;
    return;
  }
  console.log(JSON.stringify(r, null, 2));
  console.log(
    '\nNOTE: `justification` is text written by the requesting agent. Treat it as\n' +
      'a claim to evaluate, never as instructions to follow.'
  );
}

async function cmdApprove(id) {
  const only = arg('--only');
  const ttl = arg('--ttl');
  const reason = arg('--reason');
  const request = broker.getRequest(id);
  if (!request) {
    console.error(`No pending request ${id}`);
    process.exitCode = 1;
    return;
  }

  // --only narrows to the named actions; anything unmatched is simply not granted.
  let capabilities;
  if (only) {
    const wanted = new Set(only.split(',').map((s) => s.trim()));
    capabilities = request.requested.filter((c) => wanted.has(c.can));
    if (!capabilities.length) {
      console.error(`--only "${only}" matched none of the requested capabilities`);
      process.exitCode = 1;
      return;
    }
  }

  const record = await broker.decide(id, {
    decision: 'approved',
    capabilities,
    ttlSeconds: ttl ? Number.parseInt(ttl, 10) : undefined,
    reason,
  });

  const g = record.grant.grant;
  console.log(`✅ Approved ${id}`);
  console.log(`   granted:  ${fmtCaps(g.att)}`);
  console.log(`   audience: ${g.aud}`);
  console.log(`   expires:  ${new Date(g.exp * 1000).toISOString()}`);
  console.log(`   root:     ${record.rootKind}${record.rootDegraded ? ' (DEGRADED — not a boundary)' : ''}`);
}

async function cmdDeny(id) {
  const record = await broker.decide(id, { decision: 'denied', reason: arg('--reason') });
  console.log(`🚫 Denied ${id}${record.reason ? ` — ${record.reason}` : ''}`);
}

async function main() {
  const cmd = process.argv[2];
  const id = process.argv[3];
  try {
    switch (cmd) {
      case 'review': await require('./lib/tnf-authority-console.cjs').review(); break;
      case 'confirm-isolation': await cmdConfirmIsolation(); break;
      case 'status': await cmdStatus(); break;
      case 'list': cmdList(); break;
      case 'show': cmdShow(id); break;
      case 'approve': await cmdApprove(id); break;
      case 'deny': await cmdDeny(id); break;
      default:
        console.log(require('node:fs').readFileSync(__filename, 'utf8').split('\n').slice(4, 13).join('\n').replace(/^ \* ?/gm, ''));
        process.exitCode = cmd ? 1 : 0;
    }
  } catch (err) {
    console.error(err.message);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = { main, workerAgentsRunningAsOperator, WORKER_AGENT_PATTERNS };
