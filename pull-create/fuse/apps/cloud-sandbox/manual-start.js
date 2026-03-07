const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('!!! MANUAL START - VERSION 9 - ROBUST INSTALL !!!');

// Self-healing: Install Playwright browsers
try {
  console.log('📦 checking/installing Playwright browsers...');

  // Set writable paths
  const localBrowsersPath = path.join(process.cwd(), 'pw-browsers');
  const npmCachePath = '/tmp/npm-cache';

  console.log(`📂 Configuration:
    - PLAYWRIGHT_BROWSERS_PATH: ${localBrowsersPath}
    - NPM_CONFIG_CACHE: ${npmCachePath}
  `);

  process.env.PLAYWRIGHT_BROWSERS_PATH = localBrowsersPath;
  process.env.NPM_CONFIG_CACHE = npmCachePath;

  // Create directories
  try {
    execSync(`mkdir -p "${localBrowsersPath}"`, { stdio: 'inherit' });
    execSync(`mkdir -p "${npmCachePath}"`, { stdio: 'inherit' });
  } catch (e) {
    console.error('⚠️ Failed to create directories:', e);
  }

  // Attempt installation ASYNC to allow server startup
  console.log('Running npx playwright install (ASYNC)...');
  const { exec } = require('child_process');

  const installProcess = exec('npx playwright install chromium --with-deps', {
    env: {
      ...process.env,
      NPM_CONFIG_CACHE: npmCachePath,
      PLAYWRIGHT_BROWSERS_PATH: localBrowsersPath,
    },
  });

  installProcess.stdout.on('data', (data) => console.log('📦 Install:', data.toString().trim()));
  installProcess.stderr.on('data', (data) =>
    console.error('📦 Install Err:', data.toString().trim())
  );

  installProcess.on('exit', (code) => {
    console.log(`✅ Browser installation completed with code ${code}`);
    try {
      const files = fs.readdirSync(localBrowsersPath);
      console.log('📂 Browser dir content:', files);
    } catch (e) {
      console.log('Empty browser dir', e.message);
    }
  });
} catch (e) {
  console.error('❌ Browser installation setup failed:', e);
}

// Now run the actual server
console.log('🚀 Starting server.js...');
// We require the compiled server file.
// Since we replaced dist/main.js with THIS file, we need to load dist/server.js (the original compiled one)
// But wait, run-service.sh executed dist/main.js.
// So we are running.
// We need to import './server.js' (the actual app).
require('./server.js');
