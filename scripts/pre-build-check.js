const fs = require('fs');
const path = require('path');

const canvasNodeFile = path.join(__dirname, '..', 'node_modules', 'canvas', 'build', 'Release', 'canvas.node');

function log(message) {
  console.log(`[pre-build-check.js] ${message}`);
}

log('Verifying native modules before build/test...');

if (!fs.existsSync(canvasNodeFile)) {
  log('ERROR: Critical native module "canvas.node" is missing.');
  log('This likely means the postinstall script failed or was skipped.');
  log('Please run "bun install" again, or try running "bun run fix:native-modules" to fix the issue.');
  process.exit(1);
}

log('Native module verification successful.');
