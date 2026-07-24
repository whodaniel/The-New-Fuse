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

module.exports = { main };
