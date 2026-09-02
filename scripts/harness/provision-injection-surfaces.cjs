#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const HOME = os.homedir();
const RECEIPT = path.join(ROOT, '.agent/runtime-logs/harness-injection.latest.json');
const BEGIN = '<!-- TNF-HARNESS-INJECTION:BEGIN -->';
const END = '<!-- TNF-HARNESS-INJECTION:END -->';

function parseArgs(argv) {
  return { repair: argv.includes('--repair'), verify: argv.includes('--verify') || !argv.includes('--repair'), json: argv.includes('--json') };
}
function runInstaller(mode) {
  const args = [path.join(ROOT, 'scripts/install-agent-frontload.cjs'), mode, '--json'];
  const r = spawnSync(process.execPath, args, { cwd: ROOT, encoding: 'utf8' });
  let parsed = null;
  try { parsed = JSON.parse(r.stdout || '{}'); } catch { parsed = null; }
  return { ok: r.status === 0 && parsed?.ok === true, code: r.status ?? 1, payload: parsed, stderr: String(r.stderr || '').trim() };
}
function runSkillDisclosure(repair) {
  const args = [
    path.join(ROOT, 'scripts/skills/universal-skill-disclosure-guard.cjs'),
    repair ? '--apply' : '--check',
    '--json',
  ];
  const result = spawnSync(process.execPath, args, { cwd: ROOT, encoding: 'utf8' });
  let payload = null;
  try { payload = JSON.parse(result.stdout || '{}'); } catch { payload = null; }
  const rows = Array.isArray(payload?.results) ? payload.results : [];
  const ok = result.status === 0 && rows.every((row) => row.withinBudget || (repair && row.actionsTaken?.length > 0));
  return { ok, code: result.status ?? 1, payload, stderr: String(result.stderr || '').trim() };
}
function applyFence(existing, block) {
  if (existing.includes(BEGIN) && existing.includes(END)) {
    return `${existing.slice(0, existing.indexOf(BEGIN))}${block}${existing.slice(existing.indexOf(END) + END.length)}`;
  }
  return existing.trim() ? `${block}\n\n${existing}` : `${block}\n`;
}
function openClawPointer(name, relTarget) {
  return `${BEGIN}\n# ${name} — TNF canonical pointer\n\nAt session start run from the TNF repository root:\n\n\`pnpm run tnf:onboard\`\n\nStage A inventory: \`docs/core/FRONTLOAD_MANIFEST.md\`\nCanonical mapped content: \`${relTarget}\`\nIf this workspace pointer conflicts with repository authority, the repository wins.\n${END}`;
}
function provisionOpenClaw(repair) {
  const root = path.join(HOME, '.openclaw');
  if (!fs.existsSync(root)) return [{ id: 'openclaw.runtime', path: '~/.openclaw', action: 'runtime-absent', ok: true }];
  const workspace = path.join(root, 'workspace');
  if (repair) fs.mkdirSync(workspace, { recursive: true });
  if (!fs.existsSync(workspace)) return [{ id: 'openclaw.workspace', path: '~/.openclaw/workspace', action: 'missing', ok: false }];
  const map = {
    'AGENTS.md': 'docs/core/AGENTS.md',
    'SOUL.md': 'docs/core/SOUL.md',
    'IDENTITY.md': 'docs/core/IDENTITY.md',
    'USER.md': 'docs/core/USER.md',
    'TOOLS.md': 'docs/core/TOOLS.md',
    'HEARTBEAT.md': 'docs/core/HEARTBEAT.md',
    'MEMORY.md': 'docs/core/MEMORY.md',
    'BOOTSTRAP.md': 'docs/core/BOOTSTRAP.md',
  };
  const rows = [];
  for (const [name, rel] of Object.entries(map)) {
    const file = path.join(workspace, name);
    const pointer = openClawPointer(name, rel);
    const exists = fs.existsSync(file);
    if (!repair) {
      const body = exists ? fs.readFileSync(file, 'utf8') : '';
      const ok = exists && body.includes(BEGIN) && /pnpm run tnf:onboard/.test(body) && body.includes(rel);
      rows.push({ id: `openclaw.${name}`, path: `~/.openclaw/workspace/${name}`, action: ok ? 'verified' : 'stale-or-missing', ok });
      continue;
    }
    const existing = exists ? fs.readFileSync(file, 'utf8') : '';
    const next = applyFence(existing, pointer);
    if (exists && existing !== next) fs.copyFileSync(file, `${file}.tnf-bak`);
    fs.writeFileSync(file, next, 'utf8');
    rows.push({ id: `openclaw.${name}`, path: `~/.openclaw/workspace/${name}`, action: exists ? 'updated' : 'created', ok: true });
  }
  return rows;
}
function main() {
  const opts = parseArgs(process.argv.slice(2));
  const checks = [];
  const requiredRepo = [
    '.cursor/rules/tnf-harness.mdc',
    'CLAUDE.md',
    'AGENTS.md',
    '.agent/SYSTEM_PROMPT.md',
    'docs/core/FRONTLOAD_MANIFEST.md',
    'data/harness/onboarding-contract.json',
    'data/harness/harness-config.json',
    'scripts/tnf-onboard-twip.cjs',
    'scripts/protocols/frontload-manifest.cjs',
    'scripts/protocols/turn-zero-v2-gate.cjs',
  ];
  for (const rel of requiredRepo) {
    const ok = fs.existsSync(path.join(ROOT, rel));
    checks.push({ id: `repo.${rel}`, path: rel, action: ok ? 'present' : 'missing-from-repo', ok });
  }

  const installer = runInstaller(opts.repair ? '--repair' : '--verify');
  checks.push({ id: 'global.frontload-installer', path: 'scripts/install-agent-frontload.cjs', action: installer.ok ? (opts.repair ? 'repaired' : 'verified') : installer.stderr || `exit=${installer.code}`, ok: installer.ok, details: installer.payload?.rows || [] });

  const disclosure = runSkillDisclosure(opts.repair);
  checks.push({
    id: 'global.skill-progressive-disclosure',
    path: 'scripts/skills/universal-skill-disclosure-guard.cjs',
    action: disclosure.ok ? (opts.repair ? 'contained-imported-packs' : 'within-budget') : disclosure.stderr || `exit=${disclosure.code}`,
    ok: disclosure.ok,
    details: disclosure.payload?.results || [],
  });

  checks.push(...provisionOpenClaw(opts.repair));

  const failed = checks.filter((c) => !c.ok);
  const payload = { ok: failed.length === 0, mode: opts.repair ? 'repair' : 'verify', at: new Date().toISOString(), authority: 'docs/core/FRONTLOAD_MANIFEST.md', checks, failed: failed.map((c) => c.id) };
  fs.mkdirSync(path.dirname(RECEIPT), { recursive: true });
  fs.writeFileSync(RECEIPT, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  if (opts.json) console.log(JSON.stringify(payload, null, 2));
  else {
    console.log(`TNF harness injection surfaces (${payload.mode})`);
    checks.forEach((c) => console.log(`${c.ok ? 'OK' : 'FAIL'}: ${c.id} — ${c.path} [${c.action}]`));
    console.log(payload.ok ? '\nALL REQUIRED INJECTION SURFACES OK' : `\n${failed.length} injection check(s) failed`);
  }
  process.exit(payload.ok ? 0 : 1);
}

try { main(); } catch (error) { console.error(`provision-injection-surfaces: ${error.message}`); process.exit(1); }
