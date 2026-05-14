const fs = require('fs');
const { exec } = require('child_process');

const vars = JSON.parse(fs.readFileSync('api_vars.json', 'utf8'));
const ignore = ['SERVICE_PATH'];

const args = Object.entries(vars)
  .filter(([key]) => !key.startsWith('CLOUD_RUNTIME_') && !ignore.includes(key))
  .map(([key, value]) => `--set "${key}=${value}"`)
  .join(' ');

console.log('Starting variable application for api-server-v2...');

function trySet(retries) {
  if (retries <= 0) {
    console.error('TIMED OUT: Service api-server-v2 not found after 120s.');
    process.exit(1);
  }

  exec(`cloud_runtime variables --service api-server-v2 ${args}`, (err, stdout, stderr) => {
    if (!err) {
      console.log('SUCCESS: Variables set for api-server-v2.');
      console.log(
        stdout
          .split('\n')
          .filter((l) => !l.includes('='))
          .join('\n')
      );
      process.exit(0);
    }

    const msg = (err.message || stderr || '').toLowerCase();
    if (msg.includes('not found')) {
      console.log(`Service not found yet. Retrying in 5s... (${retries} left)`);
      setTimeout(() => trySet(retries - 1), 5000);
    } else {
      console.error('ERROR: Failed to set variables.');
      console.error(stderr);
      process.exit(1);
    }
  });
}

trySet(24);
