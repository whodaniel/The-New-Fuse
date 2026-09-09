#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Materialise the operator profile into the settings the runtime already reads.
 *
 * Run by scripts/postinstall.cjs, so a fresh `pnpm install` on the operator's
 * machine restores their setup with nothing to remember. Safe and idempotent to
 * run by hand: `node scripts/setup/apply-operator-profile.cjs`.
 *
 * WHAT IT WRITES
 *   .tnf.local.env                      — the documented home for machine-specific
 *                                         settings; gitignored, never committed.
 *   ~/.tnf/config/self-edit-policy.json — only when the profile grants
 *                                         agent-authority-edits.
 *
 * Both are derived. The profile at ~/.tnf/authority/operator-profile.json is the
 * single operator-facing source of truth; editing the derived files directly
 * works until the next install overwrites them.
 *
 * Refuses in agent context (TNF_AGENT_ID set): an agent that could apply the
 * operator profile could grant itself the operator's entitlements.
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');
const profileLib = require(path.join(repoRoot, 'scripts/lib/tnf-operator-profile.cjs'));

const LOCAL_ENV = path.join(repoRoot, '.tnf.local.env');
const BEGIN = '# >>> tnf operator-profile (generated — edit the profile, not this block) >>>';
const END = '# <<< tnf operator-profile <<<';

function upsertBlock(existing, body) {
  const block = `${BEGIN}\n${body}${END}\n`;
  if (existing.includes(BEGIN) && existing.includes(END)) {
    const re = new RegExp(`${BEGIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\n?`);
    return existing.replace(re, block);
  }
  const sep = existing && !existing.endsWith('\n') ? '\n' : '';
  return `${existing}${sep}${existing ? '\n' : ''}${block}`;
}

function main() {
  const quiet = process.argv.includes('--quiet');
  const say = (m) => !quiet && console.log(`[operator-profile] ${m}`);

  if (profileLib.inAgentContext()) {
    say(`refused: TNF_AGENT_ID=${process.env.TNF_AGENT_ID} — agents cannot apply the operator profile`);
    return 0;
  }

  const p = profileLib.loadProfile();
  if (!p.ok) {
    say(`not applied — ${p.reason}`);
    if (/no operator profile/.test(p.reason)) {
      say(`create one at ${p.path} to have your setup restored on every install:`);
      say(`  {"operator":"<you>","entitlements":["operator-catalog"],"settings":{}}`);
      say(`  chmod 600 ${p.path}`);
    }
    return 0;
  }

  const env = profileLib.deriveEnv(p);
  const lines = Object.entries(env).map(([k, v]) => `${k}=${v}`);
  const body = lines.length ? `${lines.join('\n')}\n` : '# (profile grants no environment settings)\n';

  let existing = '';
  try {
    existing = fs.readFileSync(LOCAL_ENV, 'utf8');
  } catch {
    /* first run */
  }
  const next = upsertBlock(existing, body);
  if (next !== existing) {
    fs.writeFileSync(LOCAL_ENV, next, { mode: 0o600 });
    say(`wrote ${path.relative(repoRoot, LOCAL_ENV)} (${lines.length} setting(s))`);
  } else {
    say(`${path.relative(repoRoot, LOCAL_ENV)} already current`);
  }

  // Self-edit policy is a separate file because agent-self-edit-gate.cjs reads
  // it directly and must keep working with no profile present.
  const policyPath = path.join(os.homedir(), '.tnf', 'config', 'self-edit-policy.json');
  if (p.entitlements.includes('agent-authority-edits')) {
    fs.mkdirSync(path.dirname(policyPath), { recursive: true, mode: 0o700 });
    const desired = {
      allow_agent_authority_edits: true,
      note: `Derived from ${p.path} by scripts/setup/apply-operator-profile.cjs. Edit the operator profile, not this file.`,
      enabled_at: new Date().toISOString().slice(0, 10),
    };
    let current = null;
    try {
      current = JSON.parse(fs.readFileSync(policyPath, 'utf8'));
    } catch {
      /* absent or unreadable */
    }
    if (!current || current.allow_agent_authority_edits !== true) {
      fs.writeFileSync(policyPath, `${JSON.stringify(desired, null, 2)}\n`, { mode: 0o600 });
      say('enabled agent authority edits (self-edit-policy.json)');
    } else {
      say('agent authority edits already enabled');
    }
  }

  say(`active: ${p.entitlements.join(', ') || '(no entitlements)'}`);
  if (p.unknown?.length) say(`ignored unknown entitlement(s): ${p.unknown.join(', ')}`);
  return 0;
}

try {
  process.exit(main());
} catch (err) {
  // Never fail an install over this.
  console.log(`[operator-profile] skipped: ${err.message}`);
  process.exit(0);
}
