#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const HOME = os.homedir();
const REPO_ROOT = path.resolve(__dirname, '..');
const BEGIN = '<!-- TNF-FRONTLOAD:BEGIN — managed by scripts/install-agent-frontload.cjs; edits inside are overwritten -->';
const END = '<!-- TNF-FRONTLOAD:END -->';
const VERSION = 'TNF-FRONTLOAD:v2';

function buildBlock(repoRoot) {
  return [
    BEGIN,
    `<!-- ${VERSION} -->`,
    '',
    '## TNF Harness Entry (required)',
    '',
    `Canonical repository root: \`${repoRoot}\`.`,
    'This is a pointer, not a copy of TNF authority.',
    '',
    'At session start, after context compaction/provider substitution/repository movement, or when authority is uncertain:',
    '',
    '```bash',
    `cd ${JSON.stringify(repoRoot)} && pnpm run tnf:onboard`,
    '```',
    '',
    'If the task is known, rerun with `-- --task "<task>"` before consequential work.',
    '',
    '- Stage A inventory authority: `docs/core/FRONTLOAD_MANIFEST.md`',
    '- lifecycle/write readiness: `docs/protocols/TURN_ZERO_MANDATE.md`',
    '- engineering meta-skill: `.agent/skills/tnf-engineering-context/SKILL.md`',
    '',
    'Do not maintain a copied Stage A checklist here. Do not trust dated provider/port/model facts without current probes.',
    'Before creating a new TNF abstraction, search current code and active workstreams for the same responsibility.',
    'Operating discipline: **Inspect → Act → Verify**.',
    '',
    END,
  ].join('\n');
}

const TARGETS = [
  { id: 'agy', runtime: 'Antigravity CLI', scope: 'global', contextFile: path.join(HOME, '.agy', 'AGENTS.md'), dirHint: path.join(HOME, '.gemini', 'antigravity-cli') },
  { id: 'gemini-home', runtime: 'Gemini CLI', scope: 'global', contextFile: path.join(HOME, 'GEMINI.md') },
  { id: 'gemini-conf', runtime: 'Gemini CLI', scope: 'global', contextFile: path.join(HOME, '.gemini', 'GEMINI.md') },
  { id: 'codex', runtime: 'Codex', scope: 'global', contextFile: path.join(HOME, '.codex', 'AGENTS.md') },
  { id: 'opencode', runtime: 'OpenCode', scope: 'global', contextFile: path.join(HOME, '.opencode', 'AGENTS.md') },
  { id: 'hermes', runtime: 'Hermes', scope: 'global', contextFile: path.join(HOME, '.hermes', 'SOUL.md') },
  {
    id: 'kilo', runtime: 'Kilo', scope: 'global', contextFile: path.join(HOME, '.kilo', 'AGENTS.md'),
    native: path.join(HOME, '.kilo', 'agents', 'tnf-startup-gate.md'), dirHint: path.join(HOME, '.kilo'),
  },
  // ZCode desktop runtime (dev.zcode.app): ~/.zcode/AGENTS.md is the user-scope
  // instruction file, injected first in every session per its bundled
  // configuration guide; workspace AGENTS.md loads later and may override.
  // Fresh-session injection verified at the wire level (issue #165 receipts).
  { id: 'zcode', runtime: 'ZCode', scope: 'global', contextFile: path.join(HOME, '.zcode', 'AGENTS.md'), dirHint: path.join(HOME, '.zcode') },
  { id: 'cursor', runtime: 'Cursor', scope: 'project', contextFile: path.join(HOME, '.cursor', 'AGENTS.md'), dirHint: path.join(HOME, '.cursor') },
];

function parseArgs(argv) {
  const out = { dryRun: false, verify: false, repair: false, includeUnverified: false, targets: null, json: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry-run') out.dryRun = true;
    else if (arg === '--verify') out.verify = true;
    else if (arg === '--repair') out.repair = true;
    else if (arg === '--include-unverified') out.includeUnverified = true;
    else if (arg === '--json') out.json = true;
    else if (arg === '--target' && argv[i + 1]) out.targets = argv[++i].split(',').map((x) => x.trim().toLowerCase()).filter(Boolean);
    else if (arg === '-h' || arg === '--help') {
      console.log('Usage: node scripts/install-agent-frontload.cjs [--verify|--repair|--dry-run] [--include-unverified] [--target ids] [--json]');
      process.exit(0);
    } else throw new Error(`Unknown option: ${arg}`);
  }
  return out;
}

function classify(target) {
  const fileExists = fs.existsSync(target.contextFile);
  const dirExists = fs.existsSync(target.dirHint || path.dirname(target.contextFile));
  if (target.native && fs.existsSync(target.native)) {
    const body = fs.readFileSync(target.native, 'utf8');
    if (/TURN_ZERO|Turn Zero|tnf:onboard/.test(body)) return { state: 'native', fileExists, dirExists, via: target.native };
  }
  if (target.scope === 'project') return { state: 'project-scoped', fileExists, dirExists };
  if (!fileExists) return { state: dirExists ? 'unverified' : 'absent', fileExists, dirExists };
  const body = fs.readFileSync(target.contextFile, 'utf8');
  if (body.includes(BEGIN) && body.includes(VERSION) && /tnf:onboard/.test(body)) return { state: 'managed-current', fileExists, dirExists };
  if (body.includes(BEGIN)) return { state: 'managed-stale', fileExists, dirExists };
  if (/pnpm run tnf:onboard|TURN_ZERO|Turn Zero/.test(body)) return { state: 'unmanaged-covered', fileExists, dirExists };
  return { state: 'uncovered', fileExists, dirExists };
}

function applyBlock(existing, block) {
  if (existing.includes(BEGIN) && existing.includes(END)) {
    const head = existing.slice(0, existing.indexOf(BEGIN));
    const tail = existing.slice(existing.indexOf(END) + END.length);
    return `${head}${block}${tail}`;
  }
  return existing.trim() ? `${block}\n\n${existing}` : `${block}\n`;
}
function backup(file) {
  const dir = path.join(HOME, '.tnf', 'backups', 'agent-frontload');
  fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dest = path.join(dir, `${path.basename(file)}.${stamp}.bak`);
  fs.copyFileSync(file, dest);
  return dest;
}

function ensureClaudeHook({ verify = false, dryRun = false } = {}) {
  const claudeDir = path.join(HOME, '.claude');
  if (!fs.existsSync(claudeDir)) return { id: 'claude.sessionStart', runtime: 'Claude Code', state: 'absent', action: 'runtime-not-installed', ok: true };
  const hook = path.join(claudeDir, 'hooks', 'tnf-frontload.sh');
  const settingsPath = path.join(claudeDir, 'settings.json');
  const hookBody = `#!/usr/bin/env bash\nset -euo pipefail\ncd ${JSON.stringify(REPO_ROOT)}\npnpm run tnf:onboard\n`;
  let settings = {};
  if (fs.existsSync(settingsPath)) {
    try { settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8')); }
    catch (error) { return { id: 'claude.sessionStart', runtime: 'Claude Code', state: 'invalid-settings', action: error.message, ok: false }; }
  }
  const serialized = JSON.stringify(settings.hooks?.SessionStart || []);
  const hookCurrent = fs.existsSync(hook) && fs.readFileSync(hook, 'utf8') === hookBody;
  const registered = serialized.includes('tnf-frontload.sh');
  if (verify) return { id: 'claude.sessionStart', runtime: 'Claude Code', state: hookCurrent && registered ? 'managed-current' : 'stale-or-missing', action: hookCurrent && registered ? 'verified' : 'run --repair', ok: hookCurrent && registered };
  if (dryRun) return { id: 'claude.sessionStart', runtime: 'Claude Code', state: hookCurrent && registered ? 'managed-current' : 'needs-update', action: 'dry-run', ok: true };
  fs.mkdirSync(path.dirname(hook), { recursive: true });
  fs.writeFileSync(hook, hookBody, { mode: 0o755 });
  fs.chmodSync(hook, 0o755);
  settings.hooks = settings.hooks || {};
  if (!registered) {
    const entry = { hooks: [{ type: 'command', command: hook }] };
    settings.hooks.SessionStart = Array.isArray(settings.hooks.SessionStart) ? [...settings.hooks.SessionStart, entry] : [entry];
    if (fs.existsSync(settingsPath)) backup(settingsPath);
    fs.writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`, 'utf8');
  }
  return { id: 'claude.sessionStart', runtime: 'Claude Code', state: 'managed-current', action: 'installed/updated', ok: true };
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const block = buildBlock(REPO_ROOT);
  const requested = opts.targets ? new Set(opts.targets) : null;
  const targets = requested ? TARGETS.filter((t) => requested.has(t.id) || requested.has(t.runtime.toLowerCase())) : TARGETS;
  if (requested && !targets.length) throw new Error(`No matching targets: ${opts.targets.join(', ')}`);
  const rows = [];
  for (const target of targets) {
    const c = classify(target);
    const shown = target.contextFile.replace(HOME, '~');
    if (['absent','native','project-scoped'].includes(c.state)) {
      rows.push({ id: target.id, runtime: target.runtime, file: shown, state: c.state, action: c.state === 'native' ? 'covered-native' : 'skip', ok: true });
      continue;
    }
    if (opts.verify) {
      const ok = ['managed-current','unmanaged-covered'].includes(c.state);
      rows.push({ id: target.id, runtime: target.runtime, file: shown, state: c.state, action: ok ? 'verified' : 'run --repair', ok });
      continue;
    }
    if (c.state === 'unverified' && !opts.includeUnverified) {
      rows.push({ id: target.id, runtime: target.runtime, file: shown, state: c.state, action: 'skip-unverified', ok: true });
      continue;
    }
    const existing = c.fileExists ? fs.readFileSync(target.contextFile, 'utf8') : '';
    const next = applyBlock(existing, block);
    if (next === existing) {
      rows.push({ id: target.id, runtime: target.runtime, file: shown, state: 'managed-current', action: 'unchanged', ok: true });
      continue;
    }
    if (opts.dryRun) {
      rows.push({ id: target.id, runtime: target.runtime, file: shown, state: c.state, action: 'would-update', ok: true });
      continue;
    }
    fs.mkdirSync(path.dirname(target.contextFile), { recursive: true });
    if (c.fileExists) backup(target.contextFile);
    fs.writeFileSync(target.contextFile, next, 'utf8');
    rows.push({ id: target.id, runtime: target.runtime, file: shown, state: 'managed-current', action: 'updated', ok: true });
  }
  if (!requested || requested.has('claude') || requested.has('claude code')) rows.push(ensureClaudeHook({ verify: opts.verify, dryRun: opts.dryRun }));
  const failed = rows.filter((row) => !row.ok);
  const payload = { ok: failed.length === 0, version: VERSION, repoRoot: REPO_ROOT, mode: opts.verify ? 'verify' : opts.dryRun ? 'dry-run' : opts.repair ? 'repair' : 'install', rows, failed: failed.map((x) => x.id) };
  if (opts.json) console.log(JSON.stringify(payload, null, 2));
  else {
    console.log(`TNF agent frontload ${payload.mode} (${VERSION})`);
    rows.forEach((row) => console.log(`${row.ok ? 'OK' : 'FAIL'}: ${row.runtime} — ${row.state} [${row.action}]`));
  }
  process.exit(payload.ok ? 0 : 1);
}

if (require.main === module) {
  try { main(); } catch (error) { console.error(`install-agent-frontload: ${error.message}`); process.exit(1); }
}
module.exports = { buildBlock, applyBlock, classify, TARGETS, VERSION };
