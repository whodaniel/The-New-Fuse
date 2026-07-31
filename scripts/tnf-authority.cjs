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
 *   node scripts/tnf-authority.cjs workers
 *   node scripts/tnf-authority.cjs relaunch-workers
 *   node scripts/tnf-authority.cjs confirm-isolation
 *
 * Also: `tnf authority <same subcommands>` via packages/tnf-cli.
 * `approve` and `deny` refuse to run from agent context (see
 * tnf-elevation-broker.cjs). Under a `file` trust root those checks are
 * defence-in-depth only — `status` says so plainly, every time.
 */

'use strict';

const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const broker = require('./lib/tnf-elevation-broker.cjs');
const trust = require('./lib/tnf-trust-root.cjs');
const {
  WORKER_AGENT_PATTERNS,
  operatorUid,
  operatorGid,
  workerAgentsRunningAsOperator,
  resolveWorkerScript,
} = require('./lib/tnf-authority-workers.cjs');

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
 * (Canonical list: scripts/lib/tnf-authority-workers.cjs)
 */

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
  const opUid = operatorUid();

  // `sudo tnf authority confirm-isolation` used to false-pass: getuid()===0 so
  // the straggler scan looked for root-owned workers and found none while
  // jules/antigravity still ran as the real operator. Prefer SUDO_UID; still
  // warn so the operator knows to prefer a non-root invocation.
  if (typeof process.getuid === 'function' && process.getuid() === 0) {
    if (opUid === 0 || opUid === null) {
      console.error(
        'Refuse to confirm-isolation as root without SUDO_UID.\n' +
          'Run as your normal user:  tnf authority confirm-isolation\n' +
          '(sudo is only needed for nested `sudo -u tnf-agent` checks.)'
      );
      process.exitCode = 1;
      return;
    }
    console.warn(
      `note: running under sudo — using SUDO_UID=${opUid} for the operator straggler scan`
    );
  }

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
          'Then re-run: tnf authority confirm-isolation --force-after-manual-check'
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
      `\n❌ ${stragglers.length} worker agent(s) are still running as the operator (uid ${opUid} can read the key):\n` +
        stragglers.map((s) => `    ${s.slice(0, 120)}`).join('\n') +
        `\n\nThe file-denial test passed, but these processes make isolation NOT real.\n` +
        'Run: tnf authority relaunch-workers\n' +
        'Then re-run. Marker NOT written.'
    );
    process.exitCode = 1;
    return;
  }

  fs.writeFileSync(
    trust.ISOLATION_MARKER,
    `confirmed ${new Date().toISOString()} by operator uid=${opUid}; file-denial=pass; worker-as-operator=none\n`,
    { mode: 0o600 }
  );
  // If we were invoked via sudo, chown the marker back to the real operator so
  // a root-owned 0600 marker does not block later non-root reads/rewrites.
  const gid = operatorGid();
  if (typeof process.getuid === 'function' && process.getuid() === 0 && opUid !== null) {
    try {
      fs.chownSync(trust.ISOLATION_MARKER, opUid, gid ?? opUid);
    } catch (err) {
      console.warn(`warn: could not chown marker to uid ${opUid}: ${err.message}`);
    }
  }
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

function cmdWorkers() {
  const hits = workerAgentsRunningAsOperator();
  console.log('TNF Authority — worker processes\n');
  if (!hits.length) {
    console.log('  No known worker wrappers are running as the operator.');
    console.log('  (Isolation straggler check is clean.)');
    return;
  }
  console.log(`  ${hits.length} worker(s) still running as the operator (blocks confirm-isolation):\n`);
  for (const h of hits) console.log(`    ${h}`);
  console.log(
    '\nRelaunch via the TNF launcher (drops to tnf-agent when the account exists):\n' +
      '    tnf authority relaunch-workers\n' +
      'Then: tnf authority confirm-isolation'
  );
}

async function cmdDeny(id) {
  const record = await broker.decide(id, { decision: 'denied', reason: arg('--reason') });
  console.log(`🚫 Denied ${id}${record.reason ? ` — ${record.reason}` : ''}`);
}

/**
 * Stop operator-uid worker wrappers and restart them through the TNF launcher,
 * which drops to tnf-agent when that account exists.
 */
async function cmdRelaunchWorkers() {
  const { spawn } = require('node:child_process');
  const path = require('node:path');
  const hits = workerAgentsRunningAsOperator();
  if (!hits.length) {
    console.log('No operator-uid worker wrappers to relaunch.');
    return;
  }

  const launcher = path.join(__dirname, 'runtime', 'launch-agent-wrapper.sh');
  // hits are "pid truncated-command" — match by known pattern, resolve script under scripts/.
  const byScript = new Map();
  for (const line of hits) {
    const pid = String(line).trim().split(/\s+/)[0];
    const pattern = WORKER_AGENT_PATTERNS.find((p) => line.includes(p));
    if (!pattern) continue;
    const scriptPath = path.join(__dirname, `${pattern}.cjs`);
    if (!fs.existsSync(scriptPath)) {
      console.error(`  skip ${pattern}: no ${scriptPath}`);
      continue;
    }
    byScript.set(scriptPath, pid);
  }

  if (!byScript.size) {
    console.error(
      'Found stragglers but could not map them to scripts/*.cjs. Stop them manually, then:\n' +
        '  bash scripts/runtime/launch-agent-wrapper.sh scripts/<wrapper>.cjs'
    );
    process.exitCode = 1;
    return;
  }

  console.log(`Stopping ${byScript.size} operator-uid worker(s)…\n`);
  for (const [scriptPath, pid] of byScript) {
    console.log(`  SIGTERM ${pid} (${path.basename(scriptPath)})`);
    try {
      process.kill(Number(pid), 'SIGTERM');
    } catch (err) {
      console.error(`    warn: ${err.message}`);
    }
  }
  await new Promise((r) => setTimeout(r, 1500));

  console.log('\nStarting via TNF launcher (will sudo -u tnf-agent)…\n');
  for (const scriptPath of byScript.keys()) {
    const logBase = path.basename(scriptPath).replace(/\.cjs$/, '');
    const logPath = `/tmp/tnf-${logBase}.log`;
    const out = fs.openSync(logPath, 'a');
    const child = spawn('bash', [launcher, scriptPath], {
      cwd: path.join(__dirname, '..'),
      detached: true,
      stdio: ['ignore', out, out],
      env: process.env,
    });
    child.unref();
    console.log(`  started ${path.basename(scriptPath)} → log ${logPath} (pid ${child.pid})`);
  }

  await new Promise((r) => setTimeout(r, 2500));
  const still = workerAgentsRunningAsOperator();
  if (still.length) {
    console.error(
      `\n❌ Still running as operator:\n${still.map((s) => `    ${s}`).join('\n')}\n` +
        'sudo needs your password in a real terminal. Run:\n' +
        '  tnf authority relaunch-workers\n' +
        'or per wrapper:\n' +
        '  bash scripts/runtime/launch-agent-wrapper.sh scripts/<wrapper>.cjs'
    );
    process.exitCode = 1;
    return;
  }
  console.log('\n✅ No operator-uid worker stragglers. Next: tnf authority confirm-isolation');
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
      case 'workers': cmdWorkers(); break;
      case 'relaunch-workers': await cmdRelaunchWorkers(); break;
      default:
        console.log(require('node:fs').readFileSync(__filename, 'utf8').split('\n').slice(4, 15).join('\n').replace(/^ \* ?/gm, ''));
        process.exitCode = cmd ? 1 : 0;
    }
  } catch (err) {
    console.error(err.message);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = { main, workerAgentsRunningAsOperator, WORKER_AGENT_PATTERNS };
