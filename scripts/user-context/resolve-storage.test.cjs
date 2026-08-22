const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { resolveUserContextStorage } = require('./resolve-storage.cjs');

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-user-context-'));
  const home = path.join(root, 'home');
  const repo = path.join(root, 'repo');
  fs.mkdirSync(path.join(repo, 'data', 'user-context'), { recursive: true });
  fs.mkdirSync(path.join(home, '.tnf', 'profiles'), { recursive: true });
  fs.writeFileSync(
    path.join(repo, 'data', 'user-context', 'storage-provider-defaults.json'),
    JSON.stringify({
      spec: 'tnf/user-context-storage/0.1',
      defaultStrategy: 'local-primary',
      providers: {
        local: { enabled: true, rootTemplate: '~/.tnf/user-context/data/<profile>' },
        googleDrive: {
          enabled: false,
          requiresUserBinding: true,
          folderName: 'TNF User Context',
          folderId: null,
          folderUrl: null,
        },
      },
      collections: ['profile', 'sources', 'memory', 'working', 'receipts', 'exports'],
      inheritance: {
        coreFleet: 'inherit-user-profile',
        swarm: 'inherit-parent',
        agent: 'inherit-parent',
      },
    })
  );
  return { root, home, repo };
}

test('defaults to a stable local profile root when no profile exists', () => {
  const { home, repo } = fixture();
  const result = resolveUserContextStorage({
    homeDir: home,
    repoRoot: repo,
    profileName: 'alice',
    env: {},
  });

  assert.equal(result.profileName, 'alice');
  assert.equal(result.requestedStrategy, 'local-primary');
  assert.equal(result.effectivePrimary, 'local');
  assert.equal(result.providers.googleDrive.ready, false);
  assert.equal(result.collections.sources.localPath, path.join(home, '.tnf', 'user-context', 'data', 'alice', 'sources'));
  assert.equal(result.collections.sources.logicalUri, 'tnf-user://alice/sources');
});

test('uses a bound Google Drive profile without embedding the binding in defaults', () => {
  const { home, repo } = fixture();
  const profilePath = path.join(home, '.tnf', 'profiles', 'alice.json');
  fs.writeFileSync(profilePath, JSON.stringify({
    profileName: 'alice',
    contextStorage: {
      strategy: 'google-drive-primary',
      local: { root: '~/.tnf/user-context/data/alice' },
      googleDrive: {
        enabled: true,
        folderId: 'drive-folder-123',
        folderUrl: 'https://drive.google.com/drive/folders/drive-folder-123',
        folderName: 'TNF User Context',
      },
      inheritance: {
        coreFleet: 'inherit-user-profile',
        swarm: 'inherit-parent',
        agent: 'inherit-parent',
      },
    },
  }));

  const result = resolveUserContextStorage({
    homeDir: home,
    repoRoot: repo,
    profileName: 'alice',
    env: {},
  });

  assert.equal(result.profileFound, true);
  assert.equal(result.effectivePrimary, 'google_drive');
  assert.equal(result.providers.googleDrive.ready, true);
  assert.equal(result.providers.googleDrive.folderId, 'drive-folder-123');
  assert.equal(result.collections.receipts.googleDriveRelativePath, 'alice/receipts');
});

test('fails visibly into local fallback when Drive primary is requested but unbound', () => {
  const { home, repo } = fixture();
  const profilePath = path.join(home, '.tnf', 'profiles', 'alice.json');
  fs.writeFileSync(profilePath, JSON.stringify({
    contextStorage: {
      strategy: 'google-drive-primary',
      local: { root: '~/.tnf/user-context/data/alice' },
      googleDrive: { enabled: true, folderId: null, folderUrl: null },
    },
  }));

  const result = resolveUserContextStorage({
    homeDir: home,
    repoRoot: repo,
    profileName: 'alice',
    env: {},
  });

  assert.equal(result.effectivePrimary, 'local');
  assert.equal(result.degraded, true);
  assert.equal(result.fallbackReason, 'google-drive-binding-missing');
});
