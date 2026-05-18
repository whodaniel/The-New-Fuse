#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const packageRoot = path.resolve(__dirname, '..');
const relayEntrypoint = path.join(packageRoot, 'dist', 'standalone-relay.js');

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: packageRoot,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    ...options,
  });
  return typeof result.status === 'number' ? result.status : 1;
}

if (!fs.existsSync(relayEntrypoint)) {
  console.log('[relay-core] dist/standalone-relay.js not found. Building relay-core first...');
  const buildExit = run('pnpm', ['run', 'build']);
  if (buildExit !== 0) {
    process.exit(buildExit);
  }
}

if (!fs.existsSync(relayEntrypoint)) {
  console.warn(
    '[relay-core] Build did not create dist/standalone-relay.js. Falling back to relay:dev.'
  );
  const devExit = run('pnpm', ['run', 'relay:dev']);
  process.exit(devExit);
}

const relayExit = run('node', [relayEntrypoint], { shell: false });
process.exit(relayExit);
