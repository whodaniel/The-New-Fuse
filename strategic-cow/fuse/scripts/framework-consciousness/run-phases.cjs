#!/usr/bin/env node
/**
 * Run framework-consciousness phases in sequence.
 *
 * Usage:
 *   node scripts/framework-consciousness/run-phases.cjs 1 6
 */

const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');

const PHASE_SCRIPTS = {
  1: 'scripts/framework-consciousness/initialize.cjs',
  2: 'scripts/framework-consciousness/run-phase-2.cjs',
  3: 'scripts/framework-consciousness/run-phase-3.cjs',
  4: 'scripts/framework-consciousness/run-phase-4.cjs',
  5: 'scripts/framework-consciousness/run-phase-5.cjs',
  6: 'scripts/framework-consciousness/run-phase-6.cjs'
};

function parsePhase(value, fallback) {
  const n = Number(value);
  if (!Number.isInteger(n)) return fallback;
  if (n < 1 || n > 6) return fallback;
  return n;
}

const start = parsePhase(process.argv[2], 1);
const end = parsePhase(process.argv[3], 6);

if (start > end) {
  console.error(`Invalid phase range: ${start}..${end}`);
  process.exit(1);
}

console.log(`Running framework-consciousness phases ${start}..${end}\n`);

for (let phase = start; phase <= end; phase += 1) {
  const script = PHASE_SCRIPTS[phase];
  if (!script) {
    console.error(`Missing script mapping for phase ${phase}`);
    process.exit(1);
  }

  console.log(`\n=== Phase ${phase} ===`);
  try {
    execSync(`node ${script}`, {
      cwd: ROOT,
      stdio: 'inherit'
    });
  } catch (err) {
    console.error(`\nPhase ${phase} failed.`);
    process.exit(err.status || 1);
  }
}

console.log('\nAll requested framework-consciousness phases completed.');
