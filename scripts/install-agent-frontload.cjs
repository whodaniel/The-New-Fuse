#!/usr/bin/env node
/**
 * install-agent-frontload.cjs — wire Turn Zero onboarding into every agent
 * runtime installed on this machine.
 *
 * WHY (2026-08-05 audit):
 *   TNF's agent onboarding was repo-CWD-scoped and reactive. An agent launched
 *   outside the repo received no Turn Zero context, and both delivery channels
 *   were down simultaneously:
 *     - TTY prompt injection sits in `skipped-safe-mode` (~/.tnf/swarm-context.md)
 *     - `claude_with_tnf` (~/.tnf-claude-env) is an *outbound telemetry*
 *       wrapper: it reports that an agent started, then execs `command claude`
 *       without bringing any context in.
 *   Of eight runtime context surfaces on this machine, exactly one (~/GEMINI.md)
 *   mirrored the Turn Zero Mandate. The rest ran blind.
 *
 *   Per the Non-Temporal Proliferation Mandate, that wiring belongs in the
 *   installer rather than being rediscovered by each agent.
 *
 * WHAT IT DOES
 *   Writes a small, delimited frontload block into each runtime's context file.
 *   The block is a *pointer* to canonical authority, never a copy of it —
 *   duplicating the mandate across eight files is how mirrors drift out of sync
 *   (TURN_ZERO_MANDATE.md explicitly demotes such copies to non-authoritative).
 *
 * IDEMPOTENCY
 *   The block is fenced by BEGIN/END markers. Re-running replaces only what is
 *   between them; everything the user wrote outside is preserved byte-for-byte.
 *
 * VERIFIED vs UNVERIFIED TARGETS
 *   A target is "verified" when its context file already exists, which is
 *   evidence the runtime actually reads it. Targets whose directory exists but
 *   which have no context file are reported, not written, unless
 *   --include-unverified is passed. Creating a file a runtime may never read
 *   would look like coverage without being coverage.
 *
 * USAGE
 *   node scripts/install-agent-frontload.cjs --dry-run     # show the plan
 *   node scripts/install-agent-frontload.cjs               # install verified
 *   node scripts/install-agent-frontload.cjs --include-unverified
 *   node scripts/install-agent-frontload.cjs --verify      # audit only, no writes
 *
 * EXIT CODES
 *   0 = every requested action succeeded
 *   1 = at least one failed (never exits 0 on partial success)
 */
'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const HOME = os.homedir();
const REPO_ROOT = path.resolve(__dirname, '..');

const BEGIN = '<!-- TNF-FRONTLOAD:BEGIN — managed by scripts/install-agent-frontload.cjs; edits inside are overwritten -->';
const END = '<!-- TNF-FRONTLOAD:END -->';

/**
 * The injected block. Deliberately short: it is prepended to every agent's
 * context on every session, so it spends the operator's token budget. It points
 * at authority instead of restating it.
 */
function buildBlock(repoRoot) {
  return [
    BEGIN,
    '',
    '## TNF Turn Zero (required at session start)',
    '',
    `Canonical authority: \`${repoRoot}/docs/protocols/TURN_ZERO_MANDATE.md\`.`,
    'This block is a pointer, not a copy — if it disagrees with the mandate, the mandate wins.',
    '',
    'Before any code change, run the onboarder and follow the staged-read plan it prints:',
    '',
    '```bash',
    `cd ${repoRoot} && node scripts/tnf-onboard.cjs --runtime-timeout-ms 1000`,
    '```',
    '',
    'It reports the frontload checklist, your token budget, which files to read now',
    'versus defer, and the canonical session handoff with its pending `next_actions`.',
    '',
    'Operating loop: **Inspect → Act → Verify.** Never assume an action succeeded.',
    '',
    'Skill disclosure: keep startup lean. Use `.agent/SKILL_MANIFEST.md` as the',
    'Tier-0 skill map, then run `node scripts/skills/skill-bank-query.cjs <term>`',
    'for candidates, and read one `SKILL.md` body only when invoking it.',
    '',
    'If Codex reports shortened skill descriptions, audit with:',
    '',
    '```bash',
    `cd ${repoRoot} && node scripts/skills/codex-skill-disclosure-guard.cjs`,
    '```',
    '',
    'Autonomy (directive D1): routine long-running execution needs no confirmation.',
    'Process kills, commits/pushes, hard deletes, and credential handling always do.',
    'Financial actions are forbidden outright (D9).',
    '',
    END,
  ].join('\n');
}

/**
 * Runtime targets, established empirically on 2026-08-05 rather than by
 * assuming every runtime honours AGENTS.md. Guessing the filename produces
 * files a runtime never reads — coverage that looks real and is not.
 *
 *   contextFile  the global surface the runtime loads at session start
 *   native       a runtime-owned mechanism that already enforces Turn Zero;
 *                when present, we recognize it instead of installing a second,
 *                competing source (the mandate demotes copies to
 *                non-authoritative precisely because mirrors drift)
 *   scope        'global'  loaded every session regardless of cwd
 *                'project' rules are per-repository; no global surface exists,
 *                          so there is nothing for this installer to wire
 */
const TARGETS = [
  { id: 'gemini-home', runtime: 'Gemini CLI', scope: 'global', contextFile: path.join(HOME, 'GEMINI.md') },
  { id: 'gemini-conf', runtime: 'Gemini CLI', scope: 'global', contextFile: path.join(HOME, '.gemini', 'GEMINI.md') },
  { id: 'codex', runtime: 'Codex', scope: 'global', contextFile: path.join(HOME, '.codex', 'AGENTS.md') },
  { id: 'opencode', runtime: 'OpenCode', scope: 'global', contextFile: path.join(HOME, '.opencode', 'AGENTS.md') },
  // ~/.hermes/SOUL.md is the "TNF Hermes Operator Identity" — Hermes's global
  // identity file. ~/.hermes/hermes-agent/AGENTS.md is a 1,435-line dev guide
  // scoped to that codebase, not a session surface, so it is not the target.
  { id: 'hermes', runtime: 'Hermes', scope: 'global', contextFile: path.join(HOME, '.hermes', 'SOUL.md') },
  // Kilo ships its own Gate 0 enforcer (291 lines, "every TNF session MUST pass
  // through this gate"). Installing an AGENTS.md alongside it would create a
  // second source of Turn Zero truth.
  {
    id: 'kilo',
    runtime: 'Kilo',
    scope: 'global',
    contextFile: path.join(HOME, '.kilo', 'AGENTS.md'),
    native: path.join(HOME, '.kilo', 'agents', 'tnf-startup-gate.md'),
    dirHint: path.join(HOME, '.kilo'),
  },
  // Cursor rules are per-project (.cursor/rules, .cursorrules). No global
  // context surface exists to wire, so this is reported, never written.
  { id: 'cursor', runtime: 'Cursor', scope: 'project', contextFile: path.join(HOME, '.cursor', 'AGENTS.md'), dirHint: path.join(HOME, '.cursor') },
];

function parseArgs(argv) {
  const o = { dryRun: false, verify: false, includeUnverified: false, repair: false, targets: null };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--dry-run') o.dryRun = true;
    else if (a === '--verify') o.verify = true;
    else if (a === '--repair') o.repair = true;
    else if (a === '--include-unverified') o.includeUnverified = true;
    else if (a === '--target' && argv[i + 1]) {
      o.targets = argv[++i]
        .split(',')
        .map((v) => v.trim().toLowerCase())
        .filter(Boolean);
    }
    else if (a === '-h' || a === '--help') {
      console.log(
        'Usage: node scripts/install-agent-frontload.cjs [--dry-run|--verify|--repair] [--include-unverified] [--target codex,gemini-home]'
      );
      process.exit(0);
    } else throw new Error(`Unknown option: ${a}`);
  }
  return o;
}

function registerClaudeSessionStartHook({ dryRun = false } = {}) {
  const hookScript = path.join(HOME, '.claude', 'hooks', 'tnf-frontload.sh');
  const settingsPath = path.join(HOME, '.claude', 'settings.json');
  if (!fs.existsSync(hookScript)) {
    return { ok: false, detail: 'hook script MISSING — expected ~/.claude/hooks/tnf-frontload.sh' };
  }
  let settings = {};
  if (fs.existsSync(settingsPath)) {
    try {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    } catch (err) {
      return { ok: false, detail: `settings.json parse failed: ${err.message}` };
    }
  }
  const serialized = JSON.stringify(settings.hooks?.SessionStart || []);
  if (serialized.includes('tnf-frontload.sh')) {
    return { ok: true, detail: 'hook already registered' };
  }
  const entry = {
    hooks: [
      {
        type: 'command',
        command: hookScript,
      },
    ],
  };
  settings.hooks = settings.hooks || {};
  settings.hooks.SessionStart = Array.isArray(settings.hooks.SessionStart)
    ? [...settings.hooks.SessionStart, entry]
    : [entry];
  if (dryRun) {
    return { ok: true, detail: 'would register SessionStart hook (dry-run)' };
  }
  fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
  if (fs.existsSync(settingsPath)) {
    fs.copyFileSync(settingsPath, `${settingsPath}.tnf-bak`);
  }
  fs.writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`, 'utf8');
  return { ok: true, detail: 'registered SessionStart → tnf-frontload.sh (backup: .tnf-bak)' };
}

function classify(t) {
  const fileExists = fs.existsSync(t.contextFile);
  const dirExists = fs.existsSync(t.dirHint || path.dirname(t.contextFile));

  // A runtime that already enforces Turn Zero through its own mechanism is
  // covered. Adding ours on top would be a second source, not more safety.
  if (t.native && fs.existsSync(t.native)) {
    const body = fs.readFileSync(t.native, 'utf8');
    if (/TURN_ZERO|Turn Zero/.test(body)) {
      return { state: 'native', fileExists, dirExists, via: t.native.replace(HOME, '~') };
    }
  }

  // No global surface to wire (rules are per-repository).
  if (t.scope === 'project') {
    return { state: 'project-scoped', fileExists, dirExists };
  }

  if (fileExists) {
    const body = fs.readFileSync(t.contextFile, 'utf8');
    const managed = body.includes(BEGIN);
    const hasTurnZero = /TURN_ZERO|Turn Zero/.test(body);
    return { state: managed ? 'managed' : hasTurnZero ? 'unmanaged-covered' : 'uncovered', fileExists, dirExists };
  }
  return { state: dirExists ? 'unverified' : 'absent', fileExists, dirExists };
}

/** Replace the fenced block, or prepend it. Never touches text outside the fence. */
function applyBlock(existing, block) {
  if (existing.includes(BEGIN) && existing.includes(END)) {
    const head = existing.slice(0, existing.indexOf(BEGIN));
    const tail = existing.slice(existing.indexOf(END) + END.length);
    return `${head}${block}${tail}`;
  }
  return existing.trim().length ? `${block}\n\n${existing}` : `${block}\n`;
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function backupContextFile(file) {
  const primary = fs.existsSync(`${file}.tnf-bak`)
    ? `${file}.tnf-bak-${timestamp()}`
    : `${file}.tnf-bak`;
  try {
    fs.copyFileSync(file, primary);
    return primary;
  } catch (primaryError) {
    const fallbackDir = path.join(HOME, '.tnf', 'backups', 'agent-frontload');
    const fallback = path.join(fallbackDir, `${path.basename(file)}.${timestamp()}.bak`);
    try {
      fs.mkdirSync(fallbackDir, { recursive: true });
      fs.copyFileSync(file, fallback);
      return fallback;
    } catch (fallbackError) {
      throw new Error(
        `backup failed (${primaryError.message}); fallback failed (${fallbackError.message})`
      );
    }
  }
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const block = buildBlock(REPO_ROOT);
  const rows = [];
  let failures = 0;
  let changed = 0;
  const requestedTargets = opts.targets ? new Set(opts.targets) : null;
  const targets = requestedTargets
    ? TARGETS.filter(
        (target) =>
          requestedTargets.has(target.id.toLowerCase()) ||
          requestedTargets.has(target.runtime.toLowerCase())
      )
    : TARGETS;

  if (requestedTargets && targets.length === 0) {
    throw new Error(`No matching target(s): ${opts.targets.join(', ')}`);
  }

  for (const t of targets) {
    const c = classify(t);
    const shown = t.contextFile.replace(HOME, '~');
    let action = 'skip';
    let status = '-';

    if (c.state === 'absent') {
      action = 'skip';
      status = 'runtime not installed';
    } else if (c.state === 'native') {
      action = 'covered';
      status = `native Turn Zero gate: ${c.via}`;
    } else if (c.state === 'project-scoped') {
      action = 'n/a';
      status = 'rules are per-project; no global surface to wire';
    } else if (c.state === 'unverified' && !opts.includeUnverified) {
      action = 'skip';
      status = 'dir exists, no context file — pass --include-unverified';
    } else if (opts.verify) {
      action = 'audit';
      status = c.state === 'managed' ? 'frontload present' : c.state === 'unmanaged-covered' ? 'Turn Zero present (hand-written)' : 'NO Turn Zero';
    } else {
      const existing = c.fileExists ? fs.readFileSync(t.contextFile, 'utf8') : '';
      const next = applyBlock(existing, block);
      if (next === existing) {
        action = 'up-to-date';
        status = 'unchanged';
      } else if (opts.dryRun) {
        action = c.state === 'managed' ? 'would update' : 'would install';
        status = 'dry-run';
      } else {
        try {
          fs.mkdirSync(path.dirname(t.contextFile), { recursive: true });
          let backupPath = null;
          if (c.fileExists) {
            backupPath = backupContextFile(t.contextFile);
          }
          fs.writeFileSync(t.contextFile, next, 'utf8');
          action = c.state === 'managed' ? 'updated' : 'installed';
          status = c.fileExists ? `backup: ${backupPath.replace(HOME, '~')}` : 'created';
          changed += 1;
        } catch (err) {
          action = 'FAILED';
          status = err.message;
          failures += 1;
        }
      }
    }
    rows.push({ runtime: t.runtime, file: shown, state: c.state, action, status });
  }

  console.log('\nTNF agent frontload installer');
  console.log(`repo: ${REPO_ROOT}`);
  console.log(
    `mode: ${opts.verify ? 'verify' : opts.dryRun ? 'dry-run' : 'install'}${opts.includeUnverified ? ' +unverified' : ''}${opts.targets ? ` target=${opts.targets.join(',')}` : ''}\n`
  );
  const w = [12, 34, 18, 14];
  console.log(
    'RUNTIME'.padEnd(w[0]) + 'CONTEXT FILE'.padEnd(w[1]) + 'STATE'.padEnd(w[2]) + 'ACTION'.padEnd(w[3]) + 'DETAIL'
  );
  for (const r of rows) {
    console.log(
      r.runtime.padEnd(w[0]) + r.file.padEnd(w[1]) + r.state.padEnd(w[2]) + r.action.padEnd(w[3]) + r.status
    );
  }

  if (!requestedTargets || requestedTargets.has('claude') || requestedTargets.has('claude code')) {
    // Claude Code frontloads via SessionStart hook (not markdown context).
    // --repair registers the existing ~/.claude/hooks/tnf-frontload.sh entry.
    const hookScript = path.join(HOME, '.claude', 'hooks', 'tnf-frontload.sh');
    const settingsPath = path.join(HOME, '.claude', 'settings.json');
    let claudeStatus;
    if (!fs.existsSync(hookScript)) {
      claudeStatus = 'hook script MISSING — expected ~/.claude/hooks/tnf-frontload.sh';
      failures += 1;
    } else if (opts.repair && !opts.verify) {
      const reg = registerClaudeSessionStartHook({ dryRun: opts.dryRun });
      claudeStatus = reg.detail;
      if (!reg.ok) failures += 1;
    } else {
      let registered = false;
      try {
        const s = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        registered = JSON.stringify(s.hooks?.SessionStart || []).includes('tnf-frontload.sh');
      } catch {
        registered = false;
      }
      claudeStatus = registered
        ? 'hook installed and registered'
        : 'hook script present but NOT registered in ~/.claude/settings.json (run with --repair)';
      if (!registered) failures += 1;
    }
    console.log(`\nClaude Code  ${claudeStatus}`);
  }

  const uncovered = rows.filter((r) => r.state === 'uncovered' && r.action === 'audit').length;
  console.log(
    `\n${changed} file(s) changed · ${failures} failure(s)${opts.verify ? ` · ${uncovered} surface(s) without Turn Zero` : ''}`
  );

  if (failures > 0) {
    console.error('\nFAILED: not every surface is wired. See rows above.');
    process.exit(1);
  }
}

try {
  main();
} catch (err) {
  console.error(`install-agent-frontload: ${err.message}`);
  process.exit(1);
}
