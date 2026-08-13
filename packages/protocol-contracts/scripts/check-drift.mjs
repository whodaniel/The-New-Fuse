import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(packageRoot, '..', '..');

const trackedPaths = [
  'packages/protocol-contracts/generated/jsonschema',
  'packages/protocol-contracts/generated/python',
  'docs/protocols/schemas/twip-envelope.schema.json',
  'docs/protocols/schemas/twip-identity.schema.json',
  'docs/protocols/schemas/sgp-envelope.schema.json',
  'docs/protocols/schemas/sgp-payloads.schema.json',
];

function runGitStatus() {
  const result = spawnSync('git', ['status', '--porcelain', '--', ...trackedPaths], {
    cwd: repoRoot,
    stdio: 'pipe',
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    const stderr = result.stderr?.trim() || result.stdout?.trim() || 'unknown git error';
    throw new Error(stderr);
  }

  return result.stdout.trim();
}

function main() {
  const status = runGitStatus();
  if (status) {
    console.error('[protocol-contracts] drift detected in generated artifacts:');
    console.error(status);
    process.exit(1);
  }

  console.log('[protocol-contracts] no drift detected');
}

try {
  main();
} catch (error) {
  console.error(`[protocol-contracts] drift check failed: ${error.message}`);
  process.exit(1);
}
