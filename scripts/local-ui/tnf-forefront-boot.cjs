#!/usr/bin/env node
/* eslint-disable no-console */

const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = process.cwd();
const RECEIPT_PATH = '.agent/runtime-logs/forefront-boot.latest.json';

function parseArgs(argv) {
  return {
    web: !argv.includes('--tauri'),
    tauri: argv.includes('--tauri'),
    skipRelay: argv.includes('--skip-relay'),
    skipOnboard: argv.includes('--skip-onboard'),
    skipCursor: argv.includes('--skip-cursor'),
    noOpen: argv.includes('--no-open'),
    help: argv.includes('-h') || argv.includes('--help'),
  };
}

function runSync(cmd, args) {
  return spawnSync(cmd, args, { cwd: ROOT, stdio: 'inherit', env: process.env });
}

function printUsage() {
  console.log('Usage: node scripts/local-ui/tnf-forefront-boot.cjs [options]');
  console.log('');
  console.log('Bring TNF to the operator forefront: harness, relay, local UI, browser control.');
  console.log('');
  console.log('Options:');
  console.log('  --tauri         Use native Tauri shell instead of web UI');
  console.log('  --skip-relay    Skip relay startup');
  console.log('  --skip-onboard  Skip Turn Zero onboard');
  console.log('  --skip-cursor   Skip Cursor harness onboard');
  console.log('  --no-open       Do not open browser automatically');
  console.log('  -h, --help      Show help');
}

function writeReceipt(payload) {
  const abs = path.join(ROOT, RECEIPT_PATH);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

function openBrowser(url) {
  if (process.platform === 'darwin') {
    spawnSync('open', [url], { stdio: 'ignore' });
    return;
  }
  if (process.platform === 'win32') {
    spawnSync('cmd', ['/c', 'start', '', url], { stdio: 'ignore' });
    return;
  }
  spawnSync('xdg-open', [url], { stdio: 'ignore' });
}

function main() {
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
    steps: [],
    uiUrl: 'http://localhost:1420/#/browser',
  };

  console.log('=== TNF Forefront Boot ===');

  if (!args.skipOnboard) {
    console.log('\n[1/5] Turn Zero onboard');
    const code = runSync('node', ['scripts/tnf-onboard.cjs', '--runtime-timeout-ms', '1000']).status ?? 1;
    receipt.steps.push({ step: 'onboard', ok: code === 0, code });
    if (code !== 0) process.exit(code);
  }

  console.log('\n[2/5] Harness boot');
  const harness = runSync('pnpm', ['run', '-s', 'tnf:harness:boot']).status ?? 1;
  receipt.steps.push({ step: 'harness', ok: harness === 0, code: harness });

  if (!args.skipCursor && fs.existsSync(path.join(ROOT, 'scripts/cursor/tnf-cursor-harness-onboard.cjs'))) {
    console.log('\n[3/5] Cursor harness onboard');
    const cursor = runSync('node', ['scripts/cursor/tnf-cursor-harness-onboard.cjs']).status ?? 1;
    receipt.steps.push({ step: 'cursor-harness', ok: cursor === 0, code: cursor });
  } else {
    console.log('\n[3/5] Cursor harness skipped');
    receipt.steps.push({ step: 'cursor-harness', skipped: true });
  }

  console.log('\n[4/5] Local UI + relay');
  const bootArgs = [
    'scripts/local-ui/tnf-local-ui-boot.cjs',
    args.tauri ? '--tauri' : '--web',
    '--skip-onboard',
  ];
  if (args.skipRelay) bootArgs.push('--skip-relay');

  const ui = spawn('node', bootArgs, {
    cwd: ROOT,
    stdio: 'inherit',
    env: {
      ...process.env,
      TNF_FOREFRONT: '1',
      VITE_DEFAULT_ENV: 'local',
      VITE_PORT: '1420',
      PORT: '1420',
    },
    detached: !process.stdout.isTTY,
  });

  if (!process.stdout.isTTY) {
    ui.unref();
    receipt.steps.push({ step: 'local-ui', mode: 'detached', pid: ui.pid });
  } else {
    receipt.steps.push({ step: 'local-ui', mode: 'foreground' });
    ui.on('exit', (code) => process.exit(code ?? 0));
  }

  if (!args.noOpen) {
    console.log('\n[5/5] Opening browser control surface');
    spawnSync('sleep', ['3']);
    openBrowser(receipt.uiUrl);
    receipt.steps.push({ step: 'open-browser', url: receipt.uiUrl });
  }

  writeReceipt(receipt);
  console.log(`\n✅ Forefront boot initiated`);
  console.log(`   UI:      ${receipt.uiUrl}`);
  console.log(`   Receipt: ${RECEIPT_PATH}`);
  console.log('   CLI:     tnf local-ui | tnf forefront status');
}

main();
