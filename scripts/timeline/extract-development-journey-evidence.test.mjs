import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import {
  buildTimelineBatch,
  detectLocalSourceKind,
  extractDateFromFilename,
  findSensitiveContentSignals,
} from './extract-development-journey-evidence.mjs';

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-journey-'));
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = process.env.TNF_ROOT_DIR
  ? path.resolve(process.env.TNF_ROOT_DIR)
  : path.resolve(__dirname, '..', '..');

function writeFile(root, relPath, contents = 'x') {
  const absPath = path.join(root, relPath);
  fs.mkdirSync(path.dirname(absPath), { recursive: true });
  fs.writeFileSync(absPath, contents);
}

test('extractDateFromFilename parses dashed and compact date formats', () => {
  assert.equal(extractDateFromFilename('QA_REPORT_2026-01-11.md'), '2026-01-11T00:00:00.000Z');
  assert.equal(extractDateFromFilename('trajectory_20250710_121158.json'), '2025-07-10T12:11:58.000Z');
  assert.equal(
    extractDateFromFilename('twip-terminal-macro-board-2026-03-18T18-59-20Z.md'),
    '2026-03-18T18:59:20.000Z'
  );
});

test('buildTimelineBatch produces historical_event entries', () => {
  const batch = buildTimelineBatch([
    {
      eventId: 'evt-1',
      timestamp: '2025-01-01T00:00:00.000Z',
      label: 'Repo created',
      category: 'repo_created',
      confidence: 'hard',
      summary: 'Created',
      evidence: [{ type: 'github_api', ref: 'https://example.test' }],
      payload: { path: 'README.md' },
    },
  ]);

  assert.equal(batch.length, 1);
  assert.equal(batch[0].eventType, 'historical_event');
  assert.equal(batch[0].actor, 'tnf_journey_reconstruction');
  assert.equal(batch[0].payload.sourceEventId, 'evt-1');
});

test('detectLocalSourceKind classifies text, code, and media artifacts', () => {
  assert.equal(detectLocalSourceKind('/tmp/story.md', {}), 'text');
  assert.equal(detectLocalSourceKind('/tmp/agent.ts', { includeCodeArtifacts: true }), 'code');
  assert.equal(detectLocalSourceKind('/tmp/demo.mp4', { includeMediaArtifacts: true }), 'media');
  assert.equal(detectLocalSourceKind('/tmp/demo.mp4', {}), null);
});

test('findSensitiveContentSignals detects likely secret material', () => {
  const signals = findSensitiveContentSignals('OPENAI_API_KEY=sk-abcdefghijklmnopqrstuvwxyz123456');
  assert.equal(signals.includes('openai_api_key'), true);
});

test('script writes outputs for a minimal git repo', () => {
  const root = makeTempDir();
  const scriptPath = path.join(REPO_ROOT, 'scripts', 'timeline', 'extract-development-journey-evidence.mjs');

  fs.mkdirSync(path.join(root, '.git'), { recursive: true });
  writeFile(root, 'docs/protocols/reports/seed-2026-03-19.md', '# TNF report');

  const result = spawnSync(
    process.execPath,
    [
      scriptPath,
      '--repo-root',
      root,
      '--out-dir',
      path.join(root, 'out'),
      '--no-github',
      '--git-limit',
      '0',
      '--artifact-limit',
      '10',
    ],
    {
      encoding: 'utf8',
    }
  );

  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.ok, true);
  assert.equal(fs.existsSync(path.join(root, 'out', 'tnf-development-journey-evidence.json')), true);
  assert.equal(fs.existsSync(path.join(root, 'out', 'tnf-development-journey-timeline-events.json')), true);
  assert.equal(fs.existsSync(path.join(root, 'out', 'tnf-development-journey-summary.md')), true);
});

test('script captures local code and media artifacts while skipping sensitive files', () => {
  const root = makeTempDir();
  const localRoot = makeTempDir();
  const scriptPath = path.join(REPO_ROOT, 'scripts', 'timeline', 'extract-development-journey-evidence.mjs');

  fs.mkdirSync(path.join(root, '.git'), { recursive: true });
  writeFile(root, 'docs/protocols/reports/seed-2026-03-19.md', '# TNF report');

  writeFile(localRoot, 'notes/tnf-origin-story.md', 'TNF and OpenClaw ideas evolving in parallel.');
  writeFile(localRoot, 'code/tnf-orchestrator.ts', 'export const slug = "tnf-orchestrator";');
  writeFile(localRoot, 'captures/openclaw-demo.mp4', 'fake-video-binary');
  writeFile(localRoot, '.env', 'OPENAI_API_KEY=sk-abcdefghijklmnopqrstuvwxyz123456');

  const result = spawnSync(
    process.execPath,
    [
      scriptPath,
      '--repo-root',
      root,
      '--out-dir',
      path.join(root, 'out'),
      '--local-root',
      localRoot,
      '--no-github',
      '--git-limit',
      '0',
      '--artifact-limit',
      '10',
      '--local-artifact-limit',
      '20',
      '--include-project-roots',
      '--include-code-artifacts',
      '--include-media-artifacts',
    ],
    {
      encoding: 'utf8',
    }
  );

  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.ok, true);
  assert.equal(payload.privacyStats.skippedSensitivePathCount >= 1, true);

  const ledger = JSON.parse(fs.readFileSync(path.join(root, 'out', 'tnf-development-journey-evidence.json'), 'utf8'));
  const categories = new Set(ledger.map((entry) => entry.category));
  const allPaths = ledger
    .map((entry) => entry.payload?.path)
    .filter(Boolean)
    .join('\n');

  assert.equal(categories.has('code_artifact'), true);
  assert.equal(categories.has('media_experiment'), true);
  assert.equal(allPaths.includes('.env'), false);
});
