const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

test('chronological-dispatch writes a fallback artifact when explicitly allowed', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-chronological-dispatch-'));
  const profilesPath = path.join(
    tempRoot,
    'data',
    'protocols',
    'chronological-dispatch-profiles.json'
  );
  fs.mkdirSync(path.dirname(profilesPath), { recursive: true });
  fs.writeFileSync(
    profilesPath,
    JSON.stringify(
      {
        spec: 'tnf/chronological-dispatch-profiles/0.1',
        entries: {
          'tenant-test-dispatch': {
            title: 'Test Dispatch',
            priority: 'high',
            targetQueue: 'tnf:master:tasks:planning',
            instruction: 'Run the test dispatch.',
            itinerary: {
              lane: 'directive',
              horizon: 'short_term',
            },
          },
        },
      },
      null,
      2
    ),
    'utf8'
  );

  const scriptPath = path.join(
    process.cwd(),
    'scripts',
    'protocols',
    'chronological-dispatch.cjs'
  );
  const stdout = execFileSync('node', [scriptPath, '--process-id', 'tenant-test-dispatch'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      TNF_REPO_ROOT: tempRoot,
      ALLOW_LOCAL_DISPATCH_FALLBACK: 'true',
    },
    encoding: 'utf8',
  });

  const parsed = JSON.parse(stdout);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.fallback, 'local-artifact');
  assert.ok(parsed.artifactPath);
  assert.ok(fs.existsSync(parsed.artifactPath));

  const artifact = JSON.parse(fs.readFileSync(parsed.artifactPath, 'utf8'));
  assert.equal(artifact.queueItem.processId, 'tenant-test-dispatch');
  assert.equal(artifact.targetQueue, 'tnf:master:tasks:planning');

  fs.rmSync(tempRoot, { recursive: true, force: true });
});
