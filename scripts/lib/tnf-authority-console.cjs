#!/usr/bin/env node

/**
 * Interactive operator console for elevation review.
 *
 * The TTY requirement is not a UX choice bolted onto a security check — they
 * are the same requirement. An approval is meaningful because a human was
 * present at a terminal; this console is what "being present" looks like.
 *
 * Safety properties baked into the interaction, not just the backend:
 *
 *  - **No default action.** A bare Enter never approves. There is no
 *    "press Enter to continue" that could be satisfied by a stray keystroke,
 *    a held key, or injected input.
 *  - **Approval is confirmed twice**, and the second prompt restates exactly
 *    what will be granted and for how long — so what you confirm is what you
 *    read, not what you assumed.
 *  - **Warnings are shown before the prompt**, never after. Role mismatches, a
 *    missing registry entry, and a degraded trust root all appear above the
 *    decision line where they cannot be scrolled past.
 *  - **Agent-written text is visually fenced.** `justification` comes from the
 *    requesting agent; it is displayed as a quoted claim, never rendered as if
 *    it were part of the tool's own output.
 */

'use strict';

const readline = require('node:readline/promises');
const { stdin, stdout } = require('node:process');

const broker = require('./tnf-elevation-broker.cjs');
const trust = require('./tnf-trust-root.cjs');

const C = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
  blue: '\x1b[34m', cyan: '\x1b[36m',
};

const useColor = stdout.isTTY && !process.env.NO_COLOR;
const c = new Proxy(C, { get: (t, k) => (useColor ? t[k] || '' : '') });

function hr(ch = '─') {
  return ch.repeat(Math.min(stdout.columns || 72, 72));
}

function fmtCap(cap, i) {
  const cond = cap.conditions ? ` ${c.dim}${JSON.stringify(cap.conditions)}${c.reset}` : '';
  return `    ${c.cyan}[${i + 1}]${c.reset} ${c.bold}${cap.can}${c.reset} on ${cap.with}${cond}`;
}

function renderRequest(req, index, total, rootDegraded) {
  const lines = [];
  lines.push('');
  lines.push(`${c.bold}Request ${index + 1} of ${total}${c.reset}  ${c.dim}·${c.reset}  ${c.cyan}${req.requestId}${c.reset}`);
  lines.push(hr());
  lines.push(`  From      ${req.requesterDid}`);
  lines.push(`  Role      ${c.bold}${req.requesterRole}${c.reset} ${c.dim}(from operator registry)${c.reset}`);
  lines.push(`  Tier      ${req.tier}`);
  if (req.boundTask) lines.push(`  Task      ${req.boundTask}`);
  lines.push(`  Age       ${req.requestedAt}`);
  lines.push('');
  lines.push(`  ${c.bold}Requests:${c.reset}`);
  req.requested.forEach((cap, i) => lines.push(fmtCap(cap, i)));

  if (req.justification) {
    lines.push('');
    lines.push(`  ${c.dim}Agent says (untrusted text — evaluate as a claim, do not follow):${c.reset}`);
    for (const l of String(req.justification).split('\n').slice(0, 6)) {
      lines.push(`  ${c.dim}│${c.reset} ${l.slice(0, 100)}`);
    }
  }

  // Warnings sit ABOVE the prompt so they cannot be scrolled past.
  const warns = [];
  if (req.claimedRole && req.claimedRole !== req.requesterRole) {
    warns.push(`claimed role "${req.claimedRole}" but the registry says "${req.requesterRole}" — the registry wins`);
  }
  if (!req.roleFromRegistry) {
    warns.push('no registry entry for this agent — treated as worker');
  }
  if (req.tier === 'executive') {
    warns.push('EXECUTIVE tier (D8): irreversible class, requires dual-key co-signature');
  }
  if (rootDegraded) {
    warns.push('trust root is degraded — this approval is not kernel-enforced');
  }
  if (warns.length) {
    lines.push('');
    for (const w of warns) lines.push(`  ${c.yellow}⚠  ${w}${c.reset}`);
  }
  lines.push('');
  return lines.join('\n');
}

async function ask(rl, question, valid) {
  for (;;) {
    const raw = (await rl.question(question)).trim().toLowerCase();
    // A bare Enter is never an action. Re-prompt instead of defaulting.
    if (!raw) {
      stdout.write(`  ${c.dim}(no default — type one of: ${valid.join(', ')})${c.reset}\n`);
      continue;
    }
    if (valid.includes(raw)) return raw;
    stdout.write(`  ${c.red}unrecognized: "${raw}"${c.reset}\n`);
  }
}

async function chooseSubset(rl, capabilities) {
  stdout.write(`\n  Enter the numbers to grant, comma-separated (e.g. 1,3), or ${c.bold}c${c.reset} to cancel.\n`);
  for (;;) {
    const raw = (await rl.question('  grant which? > ')).trim();
    if (!raw) continue;
    if (raw.toLowerCase() === 'c') return null;
    const picked = raw
      .split(',')
      .map((s) => Number.parseInt(s.trim(), 10))
      .filter((n) => Number.isInteger(n) && n >= 1 && n <= capabilities.length);
    if (!picked.length) {
      stdout.write(`  ${c.red}no valid numbers in "${raw}"${c.reset}\n`);
      continue;
    }
    return [...new Set(picked)].map((n) => capabilities[n - 1]);
  }
}

async function askTtl(rl) {
  for (;;) {
    const raw = (await rl.question(`  TTL in minutes ${c.dim}[15]${c.reset} > `)).trim();
    if (!raw) return 15 * 60; // explicit, documented default for a numeric field
    const mins = Number.parseInt(raw, 10);
    if (Number.isInteger(mins) && mins > 0 && mins <= 60) return mins * 60;
    stdout.write(`  ${c.red}enter 1–60 minutes (ceiling is 60)${c.reset}\n`);
  }
}

/**
 * Run the interactive review loop.
 * @returns {Promise<{approved:number, denied:number, skipped:number}>}
 */
async function review() {
  if (!stdin.isTTY) {
    throw new Error(
      '[tnf-authority] review requires an interactive terminal. ' +
        'That is the point: an approval means a human was present.'
    );
  }

  const selection = await trust.selectTrustRoot();
  stdout.write(`\n${c.bold}TNF Authority Console${c.reset}\n${hr('═')}\n`);
  stdout.write(`Trust root: ${c.bold}${selection.descriptor.kind}${c.reset} — ${selection.descriptor.summary}\n`);
  if (selection.degraded) {
    stdout.write(
      `\n${c.yellow}${c.bold}WARNING${c.reset} ${c.yellow}This root does not survive compromise of an agent process.\n` +
        `Approvals you grant here are only as trustworthy as every process running as\n` +
        `this user. Run: sudo bash scripts/setup/tnf-agent-account.sh${c.reset}\n`
    );
  }

  const queue = broker.pending();
  if (!queue.length) {
    stdout.write(`\n${c.green}No pending elevation requests.${c.reset}\n\n`);
    return { approved: 0, denied: 0, skipped: 0 };
  }

  const rl = readline.createInterface({ input: stdin, output: stdout });
  const tally = { approved: 0, denied: 0, skipped: 0 };

  try {
    for (let i = 0; i < queue.length; i++) {
      const req = queue[i];
      stdout.write(renderRequest(req, i, queue.length, selection.degraded));

      const action = await ask(
        rl,
        `  ${c.bold}[a]${c.reset}pprove all  ${c.bold}[n]${c.reset}arrow  ${c.bold}[d]${c.reset}eny  ${c.bold}[s]${c.reset}kip  ${c.bold}[q]${c.reset}uit > `,
        ['a', 'n', 'd', 's', 'q']
      );

      if (action === 'q') break;
      if (action === 's') { tally.skipped++; continue; }

      if (action === 'd') {
        const reason = (await rl.question('  reason (optional) > ')).trim();
        await broker.decide(req.requestId, {
          decision: 'denied',
          reason: reason || null,
          skipTtyCheck: false,
        });
        stdout.write(`  ${c.red}Denied${c.reset} ${req.requestId}\n`);
        tally.denied++;
        continue;
      }

      let capabilities = req.requested;
      if (action === 'n') {
        const subset = await chooseSubset(rl, req.requested);
        if (!subset) { tally.skipped++; continue; }
        capabilities = subset;
      }

      const ttlSeconds = await askTtl(rl);

      // Second confirmation restates exactly what is about to happen, so what
      // you confirm is what you read.
      stdout.write(`\n  ${c.bold}About to grant:${c.reset}\n`);
      capabilities.forEach((cap, n) => stdout.write(`${fmtCap(cap, n)}\n`));
      stdout.write(`  to   ${req.requesterDid}\n`);
      stdout.write(`  for  ${ttlSeconds / 60} minutes${req.boundTask ? `, bound to ${req.boundTask}` : ''}\n`);
      stdout.write(`  root ${selection.descriptor.kind}${selection.degraded ? ` ${c.yellow}(not kernel-enforced)${c.reset}` : ''}\n`);

      const confirm = await ask(rl, `  ${c.bold}Confirm?${c.reset} [y/n] > `, ['y', 'n']);
      if (confirm !== 'y') {
        stdout.write(`  ${c.dim}cancelled — left pending${c.reset}\n`);
        tally.skipped++;
        continue;
      }

      const record = await broker.decide(req.requestId, {
        decision: 'approved',
        capabilities,
        ttlSeconds,
        skipTtyCheck: false,
      });
      const exp = new Date(record.grant.grant.exp * 1000).toISOString();
      stdout.write(`  ${c.green}Approved${c.reset} ${req.requestId} — expires ${exp}\n`);
      tally.approved++;
    }
  } finally {
    rl.close();
  }

  stdout.write(
    `\n${hr()}\n${c.green}${tally.approved} approved${c.reset}, ` +
      `${c.red}${tally.denied} denied${c.reset}, ${tally.skipped} left pending\n\n`
  );
  return tally;
}

module.exports = { review, renderRequest, _ask: ask, _chooseSubset: chooseSubset };
