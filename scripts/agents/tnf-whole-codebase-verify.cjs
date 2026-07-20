#!/usr/bin/env node
/**
 * TNF Whole-Codebase Logic Verification
 * Fresh end-to-end verification across protocols, packages, apps, and runtime.
 * Evidence lands in .verifier/whole-codebase/<runId>/
 */
const { spawnSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = process.env.TNF_ROOT || process.cwd();
const RUN_ID = `whole-${new Date().toISOString().replace(/[:.]/g, '-')}`;
const OUT = path.join(ROOT, '.verifier', 'whole-codebase', RUN_ID);
const LATEST = path.join(ROOT, '.verifier', 'whole-codebase', 'latest');

fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(path.join(OUT, 'logs'), { recursive: true });

const env = {
  ...process.env,
  TNF_SKIP_TURN_ZERO_ONBOARD: '1',
  CI: process.env.CI || '1',
  FORCE_COLOR: '0',
};

function writeJson(rel, obj) {
  const abs = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, JSON.stringify(obj, null, 2));
}

function run(name, cmd, args, opts = {}) {
  const started = Date.now();
  const logPath = path.join(OUT, 'logs', `${name.replace(/[^\w.-]+/g, '_')}.log`);
  const result = spawnSync(cmd, args, {
    cwd: ROOT,
    env,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    timeout: opts.timeoutMs || 45 * 60 * 1000,
    shell: opts.shell || false,
  });
  const stdout = result.stdout || '';
  const stderr = result.stderr || '';
  fs.writeFileSync(logPath, `CMD: ${cmd} ${args.join(' ')}\nEXIT: ${result.status}\n\n=== STDOUT ===\n${stdout}\n\n=== STDERR ===\n${stderr}\n`);
  const entry = {
    name,
    cmd: [cmd, ...args].join(' '),
    ok: result.status === 0,
    exitCode: result.status,
    signal: result.signal || null,
    durationMs: Date.now() - started,
    log: path.relative(ROOT, logPath),
    stdoutTail: stdout.slice(-4000),
    stderrTail: stderr.slice(-4000),
  };
  writeJson(`surfaces/${name}.json`, entry);
  const line = `${new Date().toISOString()} ${entry.ok ? 'PASS' : 'FAIL'} ${name} exit=${entry.exitCode} ${entry.durationMs}ms\n`;
  fs.appendFileSync(path.join(OUT, 'progress.log'), line);
  console.log(line.trim());
  return entry;
}

function inventory() {
  const pkgFiles = [];
  function walk(dir, depth) {
    if (depth > 3) return;
    let ents;
    try {
      ents = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of ents) {
      if (e.name === 'node_modules' || e.name === 'dist' || e.name === '.git') continue;
      const abs = path.join(dir, e.name);
      if (e.isDirectory()) walk(abs, depth + 1);
      else if (e.name === 'package.json') pkgFiles.push(path.relative(ROOT, abs));
    }
  }
  walk(path.join(ROOT, 'apps'), 0);
  walk(path.join(ROOT, 'packages'), 0);
  walk(path.join(ROOT, 'tools'), 0);

  const packages = pkgFiles.map((rel) => {
    try {
      const pj = JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
      return {
        path: path.dirname(rel),
        name: pj.name || path.basename(path.dirname(rel)),
        scripts: Object.keys(pj.scripts || {}),
        hasTest: Boolean(pj.scripts && (pj.scripts.test || pj.scripts['test:unit'])),
        hasLint: Boolean(pj.scripts && pj.scripts.lint),
        hasBuild: Boolean(pj.scripts && pj.scripts.build),
        hasTypecheck: Boolean(
          pj.scripts && (pj.scripts['type-check'] || pj.scripts.typecheck || pj.scripts['typecheck'])
        ),
      };
    } catch (e) {
      return { path: path.dirname(rel), error: e.message };
    }
  });

  const inv = {
    runId: RUN_ID,
    timestamp: new Date().toISOString(),
    root: ROOT,
    packageCount: packages.length,
    packages,
  };
  writeJson('inventory.json', inv);
  return inv;
}

const surfaces = [];
const inv = inventory();

// ---- Layer A: Protocol / harness / directives ----
surfaces.push(run('A01-protocol-validate', 'tnf', ['protocol', 'validate']));
surfaces.push(run('A02-protocol-gate', 'tnf', ['protocol', 'gate']));
surfaces.push(run('A03-protocol-schemas', 'tnf', ['protocol', 'schemas']));
surfaces.push(run('A04-local-runtime', 'tnf', ['protocol', 'local-runtime']));
surfaces.push(run('A05-protocol-health', 'tnf', ['protocol', 'health', '--json']));
surfaces.push(
  run('A06-directive-verify-cycle', 'node', [
    'scripts/agents/tnf-directive-verify-cycle.cjs',
  ])
);
surfaces.push(
  run('A07-turn-zero-authority', 'node', [
    'scripts/protocols/validate-turn-zero-authority.cjs',
    '--mode=ci',
  ])
);
surfaces.push(
  run('A08-handoff-source-drift', 'node', [
    'scripts/protocols/validate-handoff-source-drift.cjs',
    '--mode=ci',
  ])
);
surfaces.push(
  run('A09-sgp-schemas', 'node', ['scripts/protocols/validate-sgp-schemas.cjs'])
);
surfaces.push(
  run('A10-doc-tagging', 'node', ['scripts/protocols/validate-doc-tagging.cjs'])
);
surfaces.push(
  run('A11-cleanroom-boundary', 'node', [
    'scripts/protocols/validate-cleanroom-boundary.cjs',
  ])
);
surfaces.push(
  run('A12-agent-defs', 'node', ['scripts/validate-agent-defs.cjs'])
);
surfaces.push(
  run('A13-orchestration-health', 'node', [
    'scripts/protocols/validate-orchestration-health.cjs',
  ])
);

// ---- Layer B: Architecture / structure / security ----
surfaces.push(
  run('B01-architecture', 'node', ['scripts/validation/validate-architecture.js'])
);
surfaces.push(run('B02-validate-build', 'node', ['scripts/validate-build.cjs']));
surfaces.push(
  run('B03-check-agent-registration', 'node', ['scripts/check-agent-registration.cjs'])
);
surfaces.push(run('B04-check-structure', 'bash', ['scripts/check-structure.sh']));
surfaces.push(run('B05-audit-circular', 'pnpm', ['run', 'audit:circular']));

// ---- Layer C: Whole monorepo turbo surfaces ----
surfaces.push(
  run('C01-turbo-type-check', 'pnpm', ['exec', 'turbo', 'run', 'type-check', '--concurrency=4'], {
    timeoutMs: 90 * 60 * 1000,
  })
);
surfaces.push(
  run('C02-turbo-lint', 'pnpm', ['run', 'lint'], { timeoutMs: 90 * 60 * 1000 })
);
surfaces.push(
  run('C03-turbo-test', 'pnpm', ['run', 'test:all'], { timeoutMs: 120 * 60 * 1000 })
);
surfaces.push(
  run('C04-turbo-build-packages', 'pnpm', ['run', 'build:packages'], {
    timeoutMs: 120 * 60 * 1000,
  })
);

// ---- Layer D: Runtime / doctor ----
surfaces.push(run('D01-tnf-doctor-local', 'tnf', ['doctor', '--mode', 'local', '--allow-local-db']));
surfaces.push(run('D02-alive-status', 'tnf', ['alive', 'status']));
surfaces.push(run('D03-agents-live-status', 'tnf', ['agents', 'live', 'status']));

const passed = surfaces.filter((s) => s.ok).length;
const failed = surfaces.filter((s) => !s.ok).length;
const summary = {
  runId: RUN_ID,
  timestamp: new Date().toISOString(),
  scope: 'ENTIRE_CODEBASE',
  packageCount: inv.packageCount,
  surfacesTotal: surfaces.length,
  passed,
  failed,
  ok: failed === 0,
  score: `${passed}/${surfaces.length}`,
  failedSurfaces: surfaces.filter((s) => !s.ok).map((s) => ({
    name: s.name,
    exitCode: s.exitCode,
    durationMs: s.durationMs,
    log: s.log,
    stderrTail: s.stderrTail?.slice(-1500),
  })),
  passedSurfaces: surfaces.filter((s) => s.ok).map((s) => s.name),
  outDir: path.relative(ROOT, OUT),
};

writeJson('summary.json', summary);
fs.writeFileSync(path.join(OUT, 'SUMMARY.md'), `# TNF Whole-Codebase Verification

**Run:** \`${RUN_ID}\`  
**Score:** ${summary.score}  
**OK:** ${summary.ok}  
**Packages inventoried:** ${inv.packageCount}

## Failed (${failed})
${
  summary.failedSurfaces.length
    ? summary.failedSurfaces.map((f) => `- **${f.name}** exit=${f.exitCode} log=\`${f.log}\``).join('\n')
    : '_none_'
}

## Passed (${passed})
${summary.passedSurfaces.map((n) => `- ${n}`).join('\n')}
`);

// publish latest pointer
try {
  fs.rmSync(LATEST, { recursive: true, force: true });
} catch {}
fs.cpSync(OUT, LATEST, { recursive: true });

console.log(JSON.stringify({ ok: summary.ok, score: summary.score, outDir: summary.outDir, failed }, null, 2));
process.exit(summary.ok ? 0 : 1);
