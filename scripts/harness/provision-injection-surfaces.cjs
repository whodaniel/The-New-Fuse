#!/usr/bin/env node
/**
 * Provision / verify per-runtime injection surfaces (not mere docs/core presence).
 * Pointers only — never fork Turn Zero mandate copies.
 */
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

function spawnRepairFrontload() {
  const r = spawnSync(
    process.execPath,
    [path.join(ROOT, 'scripts/install-agent-frontload.cjs'), '--repair'],
    { cwd: ROOT, encoding: 'utf8' }
  );
  const out = `${r.stdout || ''}\n${r.stderr || ''}`;
  const ok = r.status === 0 && /hook installed and registered|already registered|registered SessionStart/.test(out);
  return {
    ok: r.status === 0,
    detail: ok
      ? 'claude SessionStart repaired via install-agent-frontload --repair'
      : (out.trim().split('\n').filter(Boolean).slice(-2).join(' | ') || `exit=${r.status}`),
  };
}

function parseArgs(argv) {
  const o = { repair: false, verify: false, json: false };
  for (const a of argv) {
    if (a === '--repair') o.repair = true;
    else if (a === '--verify') o.verify = true;
    else if (a === '--json') o.json = true;
    else if (a === '-h' || a === '--help') {
      console.log('Usage: node scripts/harness/provision-injection-surfaces.cjs [--repair|--verify] [--json]');
      process.exit(0);
    }
  }
  if (!o.repair && !o.verify) o.verify = true;
  return o;
}

function cursorRuleBody() {
  return `---
description: TNF harness control-plane pointers (Turn Zero, berm, memory layer)
alwaysApply: true
---

# TNF Harness (required)

TNF is the control plane. This rule injects **pointers**, not copies.

## Eager (Stage A)

1. \`docs/protocols/TURN_ZERO_MANDATE.md\`
2. \`docs/protocols/LIVING_STATE.md\`
3. \`docs/protocols/reports/SESSION_HANDOFF_LATEST.json\`
4. \`docs/protocols/HARNESS_CONFIG.md\` + \`data/harness/harness-config.json\`

## Operating loop

Inspect → Act → Verify. Before high-impact tools run:

\`\`\`bash
node scripts/harness/permission-berm.cjs evaluate --action-class <class> --json
\`\`\`

## Dynamic memory (≠ docs/core/MEMORY.md)

\`\`\`bash
node scripts/harness/memory-layer.cjs recall --query "<task keywords>" --limit 5
\`\`\`

## Completeness

\`\`\`bash
node scripts/harness/verify-harness-completeness.cjs
\`\`\`
`;
}

function claudeMdBody() {
  return `# TNF / Claude project harness pointer

Canonical authority lives in-repo. Do not treat this file as a fork of Turn Zero.

## Required at session start

1. Read \`docs/protocols/TURN_ZERO_MANDATE.md\`
2. Read \`docs/protocols/HARNESS_CONFIG.md\`
3. Run when orientation needed:

\`\`\`bash
node scripts/tnf-onboard.cjs --runtime-timeout-ms 1000
node scripts/harness/verify-harness-completeness.cjs
\`\`\`

## Layers

| Need | Use |
| --- | --- |
| Static curated facts | \`docs/core/MEMORY.md\` |
| Dynamic retain/recall | \`node scripts/harness/memory-layer.cjs\` |
| Permissions outside model | \`node scripts/harness/permission-berm.cjs evaluate\` |
| Trajectories / compaction records | \`scripts/harness/trajectory.cjs\`, \`compaction-record.cjs\` |
| Persona workspace pack | \`docs/core/{SOUL,IDENTITY,USER,TOOLS,HEARTBEAT,BOOTSTRAP}.md\` |

Operating loop: **Inspect → Act → Verify.**

See also \`docs/claude.md\` for broader project conventions.
`;
}

function openclawPointer(name, relTarget) {
  return `${BEGIN}
# ${name} — TNF pointer (OpenClaw injects this workspace file)

Canonical: \`${relTarget}\` in The-New-Fuse repo.

If this text disagrees with the repo file, the repo file wins.
Do not accumulate a divergent fork here — edit the canonical path.

Repo root (operator machine): update via:
\`node scripts/harness/provision-injection-surfaces.cjs --repair\`
${END}
`;
}

function applyFence(existing, block) {
  if (existing.includes(BEGIN) && existing.includes(END)) {
    const head = existing.slice(0, existing.indexOf(BEGIN));
    const tail = existing.slice(existing.indexOf(END) + END.length);
    return `${head}${block}${tail}`;
  }
  return existing.trim() ? `${block}\n\n${existing}` : `${block}\n`;
}

function ensureFile(abs, contents, { repair, forceReplace = false }) {
  const exists = fs.existsSync(abs);
  if (!repair) {
    return { path: abs, exists, action: exists ? 'present' : 'missing' };
  }
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  if (exists && !forceReplace) {
    const current = fs.readFileSync(abs, 'utf8');
    if (current === contents || (contents.includes(BEGIN) && current.includes(BEGIN))) {
      if (contents.includes(BEGIN)) {
        const next = applyFence(current, contents.includes(BEGIN) ? contents : contents);
        // For fenced pointers on OpenClaw, rewrite fence only
        if (current.includes(BEGIN)) {
          const block = contents;
          const merged = applyFence(current, block);
          if (merged !== current) {
            fs.copyFileSync(abs, `${abs}.tnf-bak`);
            fs.writeFileSync(abs, merged, 'utf8');
            return { path: abs, exists: true, action: 'updated' };
          }
          return { path: abs, exists: true, action: 'up-to-date' };
        }
      }
      return { path: abs, exists: true, action: 'up-to-date' };
    }
  }
  if (exists) fs.copyFileSync(abs, `${abs}.tnf-bak`);
  fs.writeFileSync(abs, contents, 'utf8');
  return { path: abs, exists: true, action: exists ? 'updated' : 'created' };
}

function provisionOpenClaw(repair) {
  const workspace = path.join(HOME, '.openclaw', 'workspace');
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
  const results = [];
  if (!fs.existsSync(path.dirname(workspace))) {
    return [{ path: workspace, exists: false, action: 'openclaw-not-installed' }];
  }
  if (repair) fs.mkdirSync(workspace, { recursive: true });
  if (!fs.existsSync(workspace)) {
    return [{ path: workspace, exists: false, action: 'workspace-missing' }];
  }

  for (const [name, rel] of Object.entries(map)) {
    const abs = path.join(workspace, name);
    const pointer = openclawPointer(name, rel);
    const exists = fs.existsSync(abs);
    if (!repair) {
      let ok = exists;
      if (exists) {
        const body = fs.readFileSync(abs, 'utf8');
        ok = body.includes('TNF-HARNESS-INJECTION') || body.includes(rel) || body.includes('docs/core');
      }
      results.push({
        path: abs.replace(HOME, '~'),
        exists,
        action: ok ? 'wired' : exists ? 'unwired-operator-file' : 'missing',
        ok,
      });
      continue;
    }
    if (exists) {
      const body = fs.readFileSync(abs, 'utf8');
      // Never clobber a large operator SOUL — wrap with fence pointer at top
      if (name === 'SOUL.md' && body.length > 400 && !body.includes('TNF-HARNESS-INJECTION')) {
        const merged = applyFence(body, pointer);
        fs.copyFileSync(abs, `${abs}.tnf-bak`);
        fs.writeFileSync(abs, merged, 'utf8');
        results.push({ path: abs.replace(HOME, '~'), exists: true, action: 'pointer-prepended', ok: true });
        continue;
      }
      if (body.includes('TNF-HARNESS-INJECTION')) {
        const merged = applyFence(body, pointer);
        if (merged !== body) {
          fs.copyFileSync(abs, `${abs}.tnf-bak`);
          fs.writeFileSync(abs, merged, 'utf8');
          results.push({ path: abs.replace(HOME, '~'), exists: true, action: 'updated', ok: true });
        } else {
          results.push({ path: abs.replace(HOME, '~'), exists: true, action: 'up-to-date', ok: true });
        }
        continue;
      }
    }
    fs.writeFileSync(abs, `${pointer}\n`, 'utf8');
    results.push({
      path: abs.replace(HOME, '~'),
      exists: true,
      action: exists ? 'replaced-with-pointer' : 'created-pointer',
      ok: true,
    });
  }
  return results;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const checks = [];

  const cursorPath = path.join(ROOT, '.cursor/rules/tnf-harness.mdc');
  const cursor = ensureFile(cursorPath, cursorRuleBody(), {
    repair: opts.repair,
    forceReplace: true,
  });
  checks.push({
    id: 'cursor.rule',
    ...cursor,
    path: path.relative(ROOT, cursor.path),
    ok: cursor.action !== 'missing',
  });

  const claudePath = path.join(ROOT, 'CLAUDE.md');
  const claude = ensureFile(claudePath, claudeMdBody(), {
    repair: opts.repair,
    forceReplace: true,
  });
  checks.push({
    id: 'claude.md',
    ...claude,
    path: path.relative(ROOT, claude.path),
    ok: claude.action !== 'missing',
  });

  const agentsOk = fs.existsSync(path.join(ROOT, 'AGENTS.md'));
  checks.push({
    id: 'agents.md',
    path: 'AGENTS.md',
    exists: agentsOk,
    action: agentsOk ? 'present' : 'missing',
    ok: agentsOk,
  });

  const harnessConfigOk = fs.existsSync(path.join(ROOT, 'data/harness/harness-config.json'));
  checks.push({
    id: 'harness.config',
    path: 'data/harness/harness-config.json',
    exists: harnessConfigOk,
    action: harnessConfigOk ? 'present' : 'missing',
    ok: harnessConfigOk,
  });

  for (const row of provisionOpenClaw(opts.repair)) {
    checks.push({
      id: `openclaw.${path.basename(String(row.path))}`,
      ...row,
      ok: row.ok !== false && row.action !== 'missing' && row.action !== 'workspace-missing',
    });
  }

  // Claude SessionStart hook (global) — required when ~/.claude exists
  const claudeDir = path.join(HOME, '.claude');
  if (fs.existsSync(claudeDir)) {
    if (opts.repair) {
      const reg = spawnRepairFrontload();
      checks.push({
        id: 'claude.sessionStart',
        path: '~/.claude/settings.json',
        exists: true,
        action: reg.detail,
        ok: reg.ok,
      });
    } else {
      const hookScript = path.join(HOME, '.claude', 'hooks', 'tnf-frontload.sh');
      const settingsPath = path.join(HOME, '.claude', 'settings.json');
      let ok = fs.existsSync(hookScript);
      let action = ok ? 'hook-present' : 'hook-missing';
      if (ok && fs.existsSync(settingsPath)) {
        try {
          const s = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
          const wired = JSON.stringify(s.hooks?.SessionStart || []).includes('tnf-frontload.sh');
          ok = wired;
          action = wired ? 'registered' : 'not-registered';
        } catch {
          ok = false;
          action = 'settings-parse-failed';
        }
      } else if (ok) {
        ok = false;
        action = 'settings-missing';
      }
      checks.push({
        id: 'claude.sessionStart',
        path: '~/.claude/settings.json',
        exists: fs.existsSync(settingsPath),
        action,
        ok,
      });
    }
  }

  // Optional Hermes — report only (global installer owns writes)
  const hermes = path.join(HOME, '.hermes', 'SOUL.md');
  const hermesExists = fs.existsSync(hermes);
  let hermesWired = false;
  if (hermesExists) {
    hermesWired = /TNF-FRONTLOAD|TURN_ZERO|Turn Zero/.test(fs.readFileSync(hermes, 'utf8'));
  }
  checks.push({
    id: 'hermes.soul',
    path: '~/.hermes/SOUL.md',
    exists: hermesExists,
    action: !hermesExists ? 'runtime-absent' : hermesWired ? 'wired' : 'unwired',
    ok: !hermesExists || hermesWired,
  });

  const requiredFail = checks.filter(
    (c) =>
      !c.ok &&
      ['cursor.rule', 'claude.md', 'agents.md', 'harness.config', 'claude.sessionStart'].includes(c.id)
  );
  // OpenClaw optional unless installed
  const openclawInstalled = fs.existsSync(path.join(HOME, '.openclaw'));
  const openclawFail = openclawInstalled
    ? checks.filter((c) => String(c.id).startsWith('openclaw.') && !c.ok && c.action === 'missing')
    : [];

  const ok = requiredFail.length === 0 && openclawFail.length === 0;
  const payload = {
    ok,
    mode: opts.repair ? 'repair' : 'verify',
    at: new Date().toISOString(),
    checks,
    failed: [...requiredFail, ...openclawFail].map((c) => c.id),
  };

  fs.mkdirSync(path.dirname(RECEIPT), { recursive: true });
  fs.writeFileSync(RECEIPT, `${JSON.stringify(payload, null, 2)}\n`);

  if (opts.json) {
    console.log(JSON.stringify(payload, null, 2));
  } else {
    console.log(`TNF harness injection surfaces (${payload.mode})`);
    for (const c of checks) {
      console.log(`${c.ok ? 'OK' : 'FAIL'}: ${c.id} — ${c.path} [${c.action}]`);
    }
    console.log(ok ? '\nALL REQUIRED INJECTION SURFACES OK' : `\nFAILED: ${payload.failed.join(', ')}`);
    console.log(`receipt: ${path.relative(ROOT, RECEIPT)}`);
  }
  process.exit(ok ? 0 : 1);
}

try {
  main();
} catch (err) {
  console.error(`provision-injection-surfaces: ${err.message}`);
  process.exit(1);
}
