import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-personal-arch-'));
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = process.env.TNF_ROOT_DIR
  ? path.resolve(process.env.TNF_ROOT_DIR)
  : path.resolve(__dirname, '..', '..');

test('init creates manifest and base program files', () => {
  const root = makeTempDir();
  const outDir = path.join(root, 'reports');
  const scriptPath = path.join(REPO_ROOT, 'scripts', 'timeline', 'personal-archaeology-orchestrator.mjs');

  const result = spawnSync(process.execPath, [scriptPath, 'init', '--out-dir', outDir], {
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.existsSync(path.join(outDir, 'program.manifest.json')), true);
  assert.equal(fs.existsSync(path.join(outDir, 'blocked', 'human-actions.json')), true);
  assert.equal(fs.existsSync(path.join(outDir, 'progress', 'iteration-log.md')), true);
});

test('pulse writes heartbeat and blocked escalation records', () => {
  const root = makeTempDir();
  const outDir = path.join(root, 'reports');
  const scriptPath = path.join(REPO_ROOT, 'scripts', 'timeline', 'personal-archaeology-orchestrator.mjs');

  spawnSync(process.execPath, [scriptPath, 'init', '--out-dir', outDir], {
    encoding: 'utf8',
  });

  const pulse = spawnSync(
    process.execPath,
    [
      scriptPath,
      'pulse',
      '--',
      '--out-dir',
      outDir,
      '--agent',
      'notes-ledger-investigator',
      '--status',
      'blocked',
      '--summary',
      'Notes access is blocked.',
      '--blocked-reason',
      'Apple Notes MCP authentication required',
      '--requires-human',
      'Authenticate Apple Notes MCP',
    ],
    { encoding: 'utf8' }
  );

  assert.equal(pulse.status, 0, pulse.stderr);
  const heartbeat = JSON.parse(
    fs.readFileSync(path.join(outDir, 'heartbeats', 'notes-ledger-investigator.json'), 'utf8')
  );
  const blocked = JSON.parse(fs.readFileSync(path.join(outDir, 'blocked', 'human-actions.json'), 'utf8'));
  const alerts = fs.readFileSync(path.join(outDir, 'notifications', 'alerts.jsonl'), 'utf8');

  assert.equal(heartbeat.state, 'blocked');
  assert.equal(blocked.length, 1);
  assert.equal(alerts.includes('human_escalation_required'), true);
});

test('master-loop and digest generate orchestration summaries', () => {
  const root = makeTempDir();
  const outDir = path.join(root, 'reports');
  const scriptPath = path.join(REPO_ROOT, 'scripts', 'timeline', 'personal-archaeology-orchestrator.mjs');

  spawnSync(process.execPath, [scriptPath, 'init', '--out-dir', outDir], {
    encoding: 'utf8',
  });

  const loop = spawnSync(
    process.execPath,
    [scriptPath, 'master-loop', '--out-dir', outDir],
    { encoding: 'utf8' }
  );
  assert.equal(loop.status, 0, loop.stderr);

  const digest = spawnSync(
    process.execPath,
    [scriptPath, 'digest', '--out-dir', outDir],
    { encoding: 'utf8' }
  );
  assert.equal(digest.status, 0, digest.stderr);

  const digestContents = fs.readFileSync(path.join(outDir, 'reports', 'periodic-digest.md'), 'utf8');
  const masterStatus = JSON.parse(
    fs.readFileSync(
      path.join(outDir, 'status', 'personal-archaeology-master-orchestrator.json'),
      'utf8'
    )
  );

  assert.equal(digestContents.includes('Program Status'), true);
  assert.equal(masterStatus.summary.includes('Coordinated 3 teams'), true);
});

test('blocker-watch persists dispatch state without relay config', () => {
  const root = makeTempDir();
  const outDir = path.join(root, 'reports');
  const scriptPath = path.join(REPO_ROOT, 'scripts', 'timeline', 'personal-archaeology-orchestrator.mjs');

  spawnSync(process.execPath, [scriptPath, 'init', '--out-dir', outDir], {
    encoding: 'utf8',
  });
  spawnSync(
    process.execPath,
    [
      scriptPath,
      'pulse',
      '--out-dir',
      outDir,
      '--agent',
      'notes-ledger-investigator',
      '--status',
      'blocked',
      '--blocked-reason',
      'Apple Notes MCP authentication required',
      '--requires-human',
      'Authenticate Apple Notes MCP',
    ],
    { encoding: 'utf8' }
  );

  const watcher = spawnSync(
    process.execPath,
    [scriptPath, 'blocker-watch', '--out-dir', outDir],
    {
      encoding: 'utf8',
      env: {
        ...process.env,
        REDIS_URL: '',
        TNF_PERSONAL_ARCHAEOLOGY_RELAY_MODE: 'auto',
      },
    }
  );

  assert.equal(watcher.status, 0, watcher.stderr);
  const dispatchState = JSON.parse(
    fs.readFileSync(path.join(outDir, 'notifications', 'dispatch-state.json'), 'utf8')
  );
  const dispatchEntries = Object.values(dispatchState);
  const outbox = fs.readFileSync(path.join(outDir, 'notifications', 'outbox.jsonl'), 'utf8');

  assert.equal(dispatchEntries.length, 1);
  assert.equal(dispatchEntries[0].status, 'pending_config');
  assert.equal(outbox.includes('pending_config'), true);
});
