#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { ensurePortReady } = require('../../../scripts/lib/tnf-port-reaper.cjs');
const {
  isRelayHealthBody,
  probeRelayWebSocket,
} = require('../../../scripts/lib/tnf-relay-port-catalog.cjs');

const packageRoot = path.resolve(__dirname, '..');
const relayEntrypoint = path.join(packageRoot, 'dist', 'standalone-relay.js');
const RELAY_PORT = Number(process.env.RELAY_PORT || process.env.PORT || 3000);

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: packageRoot,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    ...options,
  });
  return typeof result.status === 'number' ? result.status : 1;
}

async function main() {
  const portState = await ensurePortReady({
    port: RELAY_PORT,
    healthUrl: `http://127.0.0.1:${RELAY_PORT}/health`,
    isHealthy: isRelayHealthBody,
    probeReady: () => probeRelayWebSocket(RELAY_PORT),
    graceMs: 2000,
    log: (message) => console.log(message),
  });

  if (portState.state === 'already-running') {
    console.log(
      `[relay-core] Relay is already running and healthy on port ${RELAY_PORT} (pid ${portState.pids.join(', ')}). Nothing to do.`
    );
    process.exit(0);
  }

  if (portState.state === 'blocked') {
    console.error(
      `[relay-core] Port ${RELAY_PORT} is occupied by pid(s) ${portState.pids.join(', ')} and could not be freed automatically. Investigate manually (e.g. \`node scripts/tnf-ports.cjs status\`).`
    );
    process.exit(1);
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
}

main();
