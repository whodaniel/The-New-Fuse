#!/usr/bin/env node

const { execSync } = require('child_process');

const script = process.argv[2];
const concurrency = process.argv[3] || '50';

if (!script) {
  console.log('Usage: node scripts/run-optimized.js <script> [concurrency]');
  process.exit(1);
}

const cmd = `turbo run ${script} --concurrency=${concurrency} --output-logs=errors-only`;
console.log(`Running: ${cmd}`);

try {
  execSync(cmd, { stdio: 'inherit' });
} catch (error) {
  process.exit(error.status);
}
