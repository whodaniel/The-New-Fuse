#!/usr/bin/env node
/* eslint-disable no-console */

const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = process.cwd();
const TAURI_DIR = path.join(ROOT, 'apps/tauri-desktop');

function parseArgs(argv) {
  return {
    mode: argv.includes('--tauri') ? 'tauri' : argv.includes('--web') ? 'web' : 'web',
    skipRelay: argv.includes('--skip-relay'),
    skipOnboard: argv.includes('--skip-onboard'),
    help: argv.includes('-h') || argv.includes('--help'),
  };
}

function run(cmd, args, options = {}) {
  return spawnSync(cmd, args, {
    cwd: ROOT,
    stdio: 'inherit',
    env: process.env,
    ...options,
  });
}

function commandExists(cmd) {
  return run('sh', ['-lc', `command -v ${cmd}`], { stdio: 'ignore' }).status === 0;
}

function printUsage() {
  console.log('Usage: node scripts/local-ui/tnf-local-ui-boot.cjs [options]');
  console.log('');
  console.log('Options:');
  console.log('  --web          Start Vite local UI (default)');
  console.log('  --tauri        Start Tauri desktop shell (requires Rust toolchain)');
  console.log('  --skip-relay   Do not start relay-core in background');
  console.log('  --skip-onboard Skip tnf onboard preflight');
  console.log('  -h, --help     Show help');
}

function ensureRepoRoot() {
  if (!fs.existsSync(path.join(ROOT, '.agent'))) {
    console.error('Run from TNF repository root.');
    process.exit(1);
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printUsage();
    process.exit(0);
  }

  ensureRepoRoot();

  console.log('=== TNF Local UI Boot ===');

  if (!args.skipOnboard) {
    console.log('\n[1/4] Turn Zero onboard');
    const onboard = run('node', ['scripts/tnf-onboard.cjs', '--runtime-timeout-ms', '1000']);
    if (onboard.status !== 0) process.exit(onboard.status || 1);
  }

  console.log('\n[2/4] Harness boot');
  run('pnpm', ['run', '-s', 'tnf:harness:boot']);

  if (!args.skipRelay) {
    console.log('\n[3/4] Relay service');
    if (commandExists('pnpm')) {
      const relay = spawn('pnpm', ['run', '-s', 'relay:start'], {
        cwd: ROOT,
        stdio: 'inherit',
        env: {
          ...process.env,
          RELAY_PORT: process.env.RELAY_PORT || '3000',
        },
      });
      relay.on('error', (error) => {
        console.warn(`Relay start warning: ${error.message}`);
      });
      // Give relay a moment to bind before UI starts.
      spawnSync('sleep', ['2']);
    } else {
      console.warn('pnpm not found; skipping relay start');
    }
  } else {
    console.log('\n[3/4] Relay service skipped');
  }

  console.log('\n[4/4] Local UI');
  if (!fs.existsSync(TAURI_DIR)) {
    console.error(`Missing ${TAURI_DIR}`);
    process.exit(1);
  }

  const uiEnv = {
    ...process.env,
    VITE_DEFAULT_ENV: 'local',
    VITE_API_URL: process.env.VITE_API_URL || 'http://localhost:3001',
    VITE_WS_URL: process.env.VITE_WS_URL || 'ws://127.0.0.1:3000/ws',
    VITE_RELAY_URL: process.env.VITE_RELAY_URL || 'ws://127.0.0.1:3000/ws',
    VITE_PORT: '1420',
    PORT: '1420',
  };

  if (args.mode === 'tauri') {
    console.log('Launching Tauri desktop shell on http://localhost:1420');
    const tauri = spawn('pnpm', ['run', 'tauri:dev'], {
      cwd: TAURI_DIR,
      stdio: 'inherit',
      env: uiEnv,
    });
    tauri.on('exit', (code) => process.exit(code ?? 0));
    return;
  }

  console.log('Launching web local UI on http://localhost:1420');
  if (process.env.TNF_FOREFRONT === '1') {
    console.log('Forefront mode: deep link http://localhost:1420/#/browser');
  }
  const web = spawn('pnpm', ['run', 'dev'], {
    cwd: TAURI_DIR,
    stdio: 'inherit',
    env: uiEnv,
  });
  web.on('exit', (code) => process.exit(code ?? 0));
}

main();
