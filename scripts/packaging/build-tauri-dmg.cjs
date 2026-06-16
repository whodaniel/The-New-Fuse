#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const APP_DIR = path.join(ROOT, 'apps', 'tauri-desktop');
const DMG_DIR = path.join(APP_DIR, 'src-tauri', 'target', 'release', 'bundle', 'dmg');
const RECEIPT_PATH = path.join(ROOT, '.agent', 'runtime-logs', 'tauri-dmg-package.latest.json');

function parseArgs(argv) {
  return {
    checkOnly: argv.includes('--check'),
    allowNonMacosCheck: argv.includes('--allow-non-macos-check'),
    install: argv.includes('--install'),
    skipInstall: argv.includes('--skip-install'),
    json: argv.includes('--json'),
  };
}

function sh(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || ROOT,
    env: { ...process.env, ...(options.env || {}) },
    encoding: 'utf8',
    stdio: options.capture ? 'pipe' : 'inherit',
  });

  if (result.status !== 0) {
    const rendered = [command, ...args].join(' ');
    throw new Error(`Command failed (${result.status}): ${rendered}`);
  }

  return result.stdout ? result.stdout.trim() : '';
}

function hasCommand(command) {
  const result = spawnSync('sh', ['-lc', `command -v ${command}`], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: 'pipe',
  });
  return result.status === 0 ? result.stdout.trim() : '';
}

function commandVersion(command) {
  const result = spawnSync(command, ['--version'], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: 'pipe',
  });
  if (result.status !== 0) return null;
  const match = result.stdout.match(/(\d+)\.(\d+)\.(\d+)/);
  return match ? match[0] : null;
}

function compareVersion(actual, minimum) {
  const actualParts = actual.split('.').map(Number);
  const minimumParts = minimum.split('.').map(Number);
  for (let index = 0; index < minimumParts.length; index += 1) {
    if ((actualParts[index] || 0) > minimumParts[index]) return 1;
    if ((actualParts[index] || 0) < minimumParts[index]) return -1;
  }
  return 0;
}

function collectDmgs() {
  if (!fs.existsSync(DMG_DIR)) return [];
  return fs
    .readdirSync(DMG_DIR)
    .filter((name) => name.endsWith('.dmg'))
    .map((name) => path.join(DMG_DIR, name))
    .sort();
}

function writeReceipt(payload) {
  fs.mkdirSync(path.dirname(RECEIPT_PATH), { recursive: true });
  fs.writeFileSync(RECEIPT_PATH, `${JSON.stringify(payload, null, 2)}\n`);
}

function preflight(options) {
  if (!fs.existsSync(path.join(APP_DIR, 'src-tauri', 'tauri.conf.json'))) {
    throw new Error('Missing apps/tauri-desktop/src-tauri/tauri.conf.json');
  }

  const required = ['pnpm', 'cargo', 'rustc'];
  const macRequired = ['xcodebuild', 'hdiutil'];
  const missing = [...required, ...(process.platform === 'darwin' ? macRequired : [])].filter(
    (command) => !hasCommand(command)
  );

  if (missing.length > 0) {
    throw new Error(`Missing required command(s): ${missing.join(', ')}`);
  }

  if (process.platform !== 'darwin' && !(options.checkOnly && options.allowNonMacosCheck)) {
    throw new Error(
      `DMG packaging requires macOS because Tauri uses Apple's app bundle and hdiutil tooling. Current platform: ${process.platform}/${os.arch()}.`
    );
  }

  if (!(options.checkOnly && options.allowNonMacosCheck)) {
    const minimumRust = '1.88.0';
    for (const command of ['rustc', 'cargo']) {
      const version = commandVersion(command);
      if (!version || compareVersion(version, minimumRust) < 0) {
        throw new Error(
          `${command} ${minimumRust}+ is required for the locked Tauri dependency graph. Found: ${version || 'unknown'}. Run: rustup update stable`
        );
      }
    }
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const startedAt = new Date().toISOString();

  preflight(options);

  if (options.checkOnly) {
    const receipt = {
      status: 'preflight-ok',
      platform: process.platform,
      arch: os.arch(),
      appDir: path.relative(ROOT, APP_DIR),
      dmgDir: path.relative(ROOT, DMG_DIR),
      checkedAt: startedAt,
    };
    writeReceipt(receipt);
    if (options.json) console.log(JSON.stringify(receipt, null, 2));
    else console.log('Tauri DMG preflight passed.');
    return;
  }

  if (options.install && !options.skipInstall) {
    sh('pnpm', ['install', '--no-frozen-lockfile', '--prefer-offline']);
  }

  sh('pnpm', ['--dir', APP_DIR, 'exec', 'tauri', 'build', '--bundles', 'dmg'], {
    env: {
      CI: process.env.CI || 'false',
    },
  });

  const dmgs = collectDmgs();
  if (dmgs.length === 0) {
    throw new Error(`Tauri build completed but no DMG files were found in ${DMG_DIR}`);
  }

  const receipt = {
    status: 'packaged',
    platform: process.platform,
    arch: os.arch(),
    appDir: path.relative(ROOT, APP_DIR),
    dmgDir: path.relative(ROOT, DMG_DIR),
    dmgs: dmgs.map((filePath) => path.relative(ROOT, filePath)),
    startedAt,
    completedAt: new Date().toISOString(),
  };

  writeReceipt(receipt);
  if (options.json) console.log(JSON.stringify(receipt, null, 2));
  else {
    console.log('Tauri DMG package complete:');
    for (const dmg of dmgs) console.log(`- ${dmg}`);
  }
}

try {
  main();
} catch (error) {
  console.error(`[tauri-dmg] ${error.message}`);
  process.exit(1);
}
