const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Skip native module builds in CI/Docker/Railway environments
if (process.env.RAILWAY_ENVIRONMENT || process.env.CI || process.env.DOCKER || process.env.KUBERNETES_SERVICE_HOST) {
  console.log('[postinstall.js] Skipping native module builds in CI/Docker/Railway environment');
  process.exit(0);
}

const canvasModulePath = path.join(__dirname, '..', 'node_modules', 'canvas');
const canvasNodeFile = path.join(canvasModulePath, 'build', 'Release', 'canvas.node');

function log(message) {
  console.log(`[postinstall.js] ${message}`);
}

function rebuildCanvas() {
  log('Canvas module is missing or broken. Attempting to rebuild...');
  try {
    const nodeGypPath = path.join(__dirname, '..', 'node_modules', 'node-gyp', 'bin', 'node-gyp.js');
    execSync(`node "${nodeGypPath}" rebuild`, { cwd: canvasModulePath, stdio: 'inherit' });
    log('Canvas rebuild successful.');
  } catch (error) {
    log('ERROR: Canvas rebuild failed.');
    console.error(error);
    log('Please try running "bun run fix:native-modules" manually.');
  }
}

if (fs.existsSync(canvasModulePath)) {
  if (!fs.existsSync(canvasNodeFile)) {
    rebuildCanvas();
  } else {
    log('Canvas module found and appears to be correctly built.');
  }
} else {
  log('Canvas module not found in node_modules. Skipping rebuild.');
}
