#!/usr/bin/env node
/**
 * Framework-consciousness evolutionary mode.
 *
 * Executes phases 1..6 and writes a summary artifact.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const OUT_DIR = path.join(ROOT, '.framework-consciousness');

function readJson(file, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch (_err) {
    return fallback;
  }
}

console.log('Starting framework-consciousness evolutionary cycle (phases 1..6)\n');
execSync('node scripts/framework-consciousness/run-phases.cjs 1 6', {
  cwd: ROOT,
  stdio: 'inherit'
});

const phaseFiles = [
  'foundation-discovery-report.json',
  'phase-2-pattern-recognition-report.json',
  'phase-3-integration-intelligence-report.json',
  'phase-4-capability-synthesis-report.json',
  'phase-5-emergence-evolution-report.json',
  'phase-6-reach-value-report.json'
];

const phases = phaseFiles
  .map(file => ({ file, data: readJson(path.join(OUT_DIR, file), null) }))
  .filter(entry => entry.data);

const summary = {
  timestamp: new Date().toISOString(),
  mode: 'evolutionary',
  completedReports: phases.length,
  expectedReports: phaseFiles.length,
  completionPct: Number(((phases.length / phaseFiles.length) * 100).toFixed(1)),
  latestPhase: phases.length > 0 ? phases[phases.length - 1].data.phase : null,
  phaseStatuses: phases.map(p => ({
    file: p.file,
    phase: p.data.phase || null,
    status: p.data.status || null,
    reportTimestamp: p.data.timestamp || null
  }))
};

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}
const outPath = path.join(OUT_DIR, 'evolution-summary.json');
fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));

console.log('\nEvolutionary cycle complete.');
console.log(`Summary saved: ${outPath}`);
