#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Bring up every *already-built* local surface that can be live without a
 * full recount or cloud deploy. Invoked by `tnf boot` and `tnf local-ui`.
 *
 * - Publish semantic artifacts into apps/frontend/public/visualizations/semantic/
 *   (copy only — never `--recount`)
 * - Start frontend-app Vite on :5173 when the port is free (web SPA + public viz)
 * - Start browser-control on :1421 when the port is free
 *
 * The local UI on :1420 is started by tnf-local-ui-boot.cjs; that Vite also
 * mounts /visualizations from the same public tree.
 *
 * Opt out: TNF_SKIP_LIVE_SURFACES=1
 * Partial: TNF_SKIP_SEMANTIC_PUBLISH=1 TNF_SKIP_FRONTEND_DEV=1 TNF_SKIP_BROWSER_CONTROL=1
 */

const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const http = require('node:http');
const net = require('node:net');
const path = require('node:path');

const ROOT = process.cwd();
const RECEIPT_REL = '.agent/runtime-logs/local-live-surfaces.latest.json';
const FRONTEND_DIR = path.join(ROOT, 'apps/frontend');
const FRONTEND_PORT = Number(process.env.TNF_FRONTEND_DEV_PORT || 5173);
const BROWSER_CONTROL_PORT = Number(process.env.TNF_BROWSER_CONTROL_PORT || 1421);
const LOG_DIR = path.join(ROOT, '.agent/runtime-logs');

function parseArgs(argv) {
  return {
    dryRun: argv.includes('--dry-run'),
    help: argv.includes('-h') || argv.includes('--help'),
  };
}

function envFlag(name) {
  const v = String(process.env[name] || '').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

function printUsage() {
  console.log('Usage: node scripts/local-ui/ensure-local-live-surfaces.cjs [--dry-run]');
  console.log('');
  console.log('Publish semantic viz + start frontend :5173 and browser-control :1421 if free.');
}

function writeReceipt(payload) {
  const abs = path.join(ROOT, RECEIPT_REL);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

function portInUse(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host: '127.0.0.1', port }, () => {
      socket.end();
      resolve(true);
    });
    socket.setTimeout(800, () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => resolve(false));
  });
}

function httpGet(url, timeoutMs = 900) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: timeoutMs }, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
        if (body.length > 8000) res.destroy();
      });
      res.on('end', () => resolve({ status: res.statusCode || 0, body }));
      res.on('error', () => resolve({ status: res.statusCode || 0, body }));
    });
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
    req.on('error', () => resolve(null));
  });
}

async function describeOccupant(port, expected) {
  if (!(await portInUse(port))) return { occupied: false, expected: false };
  if (expected === 'frontend') {
    const hit = await httpGet(`http://127.0.0.1:${port}/visualizations/semantic/index.html`);
    const expectedOk = Boolean(
      hit && hit.status === 200 && /TNF Semantic Reports Hub/i.test(hit.body || '')
    );
    return { occupied: true, expected: expectedOk };
  }
  if (expected === 'browser-control') {
    const hit = await httpGet(`http://127.0.0.1:${port}/panel/health`);
    let parsed = null;
    try {
      parsed = hit && hit.body ? JSON.parse(hit.body) : null;
    } catch {
      parsed = null;
    }
    return { occupied: true, expected: Boolean(parsed && parsed.generatedAt) };
  }
  return { occupied: true, expected: false };
}

function spawnLogged(cmd, args, options) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
  const logPath = options.logPath;
  const fd = fs.openSync(logPath, 'a');
  const child = spawn(cmd, args, {
    cwd: options.cwd || ROOT,
    env: { ...process.env, ...(options.env || {}) },
    stdio: ['ignore', fd, fd],
    detached: true,
  });
  child.unref();
  fs.closeSync(fd);
  return child.pid;
}

function publishSemantic(dryRun) {
  const result = { ok: false, skipped: false, reason: null };
  if (envFlag('TNF_SKIP_SEMANTIC_PUBLISH')) {
    result.skipped = true;
    result.reason = 'TNF_SKIP_SEMANTIC_PUBLISH';
    console.log('   semantic publish skipped (TNF_SKIP_SEMANTIC_PUBLISH)');
    return result;
  }
  const builder = path.join(ROOT, 'scripts/semantic-graph/build_all.py');
  const hub = path.join(ROOT, 'concordance_results/index.html');
  const explorer = path.join(ROOT, 'concordance_results/unified_graph_explorer.html');
  if (!fs.existsSync(builder)) {
    result.skipped = true;
    result.reason = 'builder-missing';
    console.log('   semantic publish skipped (build_all.py missing)');
    return result;
  }
  if (!fs.existsSync(hub) && !fs.existsSync(explorer)) {
    result.skipped = true;
    result.reason = 'no-artifacts';
    console.log('   semantic publish skipped (no concordance_results hub/explorer yet)');
    return result;
  }
  if (dryRun) {
    result.ok = true;
    result.skipped = true;
    result.reason = 'dry-run';
    console.log('   semantic publish: python3 scripts/semantic-graph/build_all.py --publish-only');
    return result;
  }
  const run = spawnSync('python3', [builder, '--publish-only'], {
    cwd: ROOT,
    stdio: 'inherit',
    env: process.env,
    timeout: 120000,
  });
  result.ok = (run.status ?? 1) === 0;
  if (!result.ok) {
    result.reason = `exit ${run.status}`;
    console.warn(`   semantic publish warning: exit ${run.status}`);
  } else {
    console.log('   semantic artifacts published to apps/frontend/public/visualizations/semantic/');
  }
  return result;
}

async function ensureFrontend(dryRun) {
  const result = { port: FRONTEND_PORT, status: 'skipped', pid: null, reason: null };
  if (envFlag('TNF_SKIP_FRONTEND_DEV')) {
    result.reason = 'TNF_SKIP_FRONTEND_DEV';
    console.log('   frontend Vite skipped (TNF_SKIP_FRONTEND_DEV)');
    return result;
  }
  if (!fs.existsSync(path.join(FRONTEND_DIR, 'package.json'))) {
    result.reason = 'frontend-missing';
    console.log('   frontend Vite skipped (apps/frontend missing)');
    return result;
  }
  const occupant = await describeOccupant(FRONTEND_PORT, 'frontend');
  if (occupant.occupied) {
    result.status = occupant.expected ? 'already-up' : 'occupied-other';
    result.reason = occupant.expected ? null : 'port-in-use-by-other-service';
    if (occupant.expected) {
      console.log(`   frontend Vite already listening on :${FRONTEND_PORT}`);
    } else {
      console.warn(
        `   frontend Vite not started: :${FRONTEND_PORT} is occupied by another process`
      );
    }
    return result;
  }
  if (dryRun) {
    result.status = 'dry-run';
    console.log(`   frontend Vite: pnpm exec vite --host 127.0.0.1 --port ${FRONTEND_PORT}`);
    return result;
  }
  try {
    const pid = spawnLogged('pnpm', ['exec', 'vite', '--host', '127.0.0.1', '--port', String(FRONTEND_PORT), '--strictPort'], {
      cwd: FRONTEND_DIR,
      logPath: path.join(LOG_DIR, 'frontend-vite.boot.log'),
      env: {
        VITE_DEFAULT_ENV: 'local',
        VITE_PORT: String(FRONTEND_PORT),
        PORT: String(FRONTEND_PORT),
        VITE_API_URL: process.env.VITE_API_URL || 'http://localhost:3001',
        VITE_WS_URL: process.env.VITE_WS_URL || 'ws://127.0.0.1:3000/ws',
      },
    });
    result.status = 'started';
    result.pid = pid;
    console.log(`   frontend Vite starting on :${FRONTEND_PORT} (pid ${pid})`);
  } catch (err) {
    result.status = 'failed';
    result.reason = err instanceof Error ? err.message : String(err);
    console.warn(`   frontend Vite failed to spawn: ${result.reason}`);
  }
  return result;
}

async function ensureBrowserControl(dryRun) {
  const result = { port: BROWSER_CONTROL_PORT, status: 'skipped', pid: null, reason: null };
  if (envFlag('TNF_SKIP_BROWSER_CONTROL')) {
    result.reason = 'TNF_SKIP_BROWSER_CONTROL';
    console.log('   browser-control skipped (TNF_SKIP_BROWSER_CONTROL)');
    return result;
  }
  const script = path.join(ROOT, 'scripts/local-ui/serve-browser-control.cjs');
  if (!fs.existsSync(script)) {
    result.reason = 'script-missing';
    console.log('   browser-control skipped (serve-browser-control.cjs missing)');
    return result;
  }
  const occupant = await describeOccupant(BROWSER_CONTROL_PORT, 'browser-control');
  if (occupant.occupied) {
    result.status = occupant.expected ? 'already-up' : 'occupied-other';
    result.reason = occupant.expected ? null : 'port-in-use-by-other-service';
    if (occupant.expected) {
      console.log(`   browser-control already listening on :${BROWSER_CONTROL_PORT}`);
    } else {
      console.warn(
        `   browser-control not started: :${BROWSER_CONTROL_PORT} is occupied by another process (not the panel)`
      );
    }
    return result;
  }
  if (dryRun) {
    result.status = 'dry-run';
    console.log(`   browser-control: node scripts/local-ui/serve-browser-control.cjs --skip-relay --no-open`);
    return result;
  }
  try {
    const pid = spawnLogged('node', [script, '--skip-relay', '--no-open'], {
      cwd: ROOT,
      logPath: path.join(LOG_DIR, 'browser-control.boot.log'),
      env: {
        TNF_BROWSER_CONTROL_PORT: String(BROWSER_CONTROL_PORT),
      },
    });
    result.status = 'started';
    result.pid = pid;
    console.log(`   browser-control starting on :${BROWSER_CONTROL_PORT} (pid ${pid})`);
  } catch (err) {
    result.status = 'failed';
    result.reason = err instanceof Error ? err.message : String(err);
    console.warn(`   browser-control failed to spawn: ${result.reason}`);
  }
  return result;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printUsage();
    process.exit(0);
  }

  if (!fs.existsSync(path.join(ROOT, '.agent'))) {
    console.error('Run from TNF repository root.');
    process.exit(1);
  }

  const receipt = {
    generatedAt: new Date().toISOString(),
    dryRun: Boolean(args.dryRun),
    publish: null,
    frontend: null,
    browserControl: null,
    urls: {
      localUi: 'http://localhost:1420/',
      semanticHub: 'http://localhost:1420/visualizations/semantic/index.html',
      semanticExplorer: 'http://localhost:1420/visualizations/semantic/unified_graph_explorer.html',
      wordcount: 'http://localhost:1420/visualizations/semantic/wordcount_report.html',
      webApp: `http://localhost:${FRONTEND_PORT}/`,
      visualizationsCatalog: `http://localhost:${FRONTEND_PORT}/visualizations`,
      browserControl: `http://127.0.0.1:${BROWSER_CONTROL_PORT}/`,
    },
  };

  if (envFlag('TNF_SKIP_LIVE_SURFACES')) {
    console.log('Local live surfaces skipped (TNF_SKIP_LIVE_SURFACES=1)');
    receipt.skipped = 'TNF_SKIP_LIVE_SURFACES';
    writeReceipt(receipt);
    return;
  }

  console.log('=== Local live surfaces ===');
  receipt.publish = publishSemantic(args.dryRun);
  receipt.frontend = await ensureFrontend(args.dryRun);
  receipt.browserControl = await ensureBrowserControl(args.dryRun);
  writeReceipt(receipt);

  console.log('   Hub:      ' + receipt.urls.semanticHub);
  console.log('   Explorer: ' + receipt.urls.semanticExplorer);
  console.log('   Word freq:' + ' ' + receipt.urls.wordcount);
  console.log('   Web SPA:  ' + receipt.urls.webApp);
  console.log('   Panel:    ' + receipt.urls.browserControl);
  console.log(`   Receipt:  ${RECEIPT_REL}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
