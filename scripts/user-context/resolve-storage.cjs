#!/usr/bin/env node

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const COLLECTIONS = ['profile', 'sources', 'memory', 'working', 'receipts', 'exports'];

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function expandHome(value, homeDir) {
  if (typeof value !== 'string') return value;
  if (value === '~') return homeDir;
  if (value.startsWith('~/')) return path.join(homeDir, value.slice(2));
  return value;
}

function activeProfileName(repoRoot, env, homeDir) {
  if (env.TNF_PROFILE && env.TNF_PROFILE.trim()) return env.TNF_PROFILE.trim();

  const pointer = path.join(repoRoot, '.agent', 'runtime-state', 'cli-boot-profile.txt');
  try {
    const value = fs.readFileSync(pointer, 'utf8').trim();
    if (value) return value;
  } catch {
    // No active pointer is a valid first-run state.
  }

  return env.USER || env.USERNAME || path.basename(homeDir) || 'default';
}

function resolveUserContextStorage(options = {}) {
  const env = options.env || process.env;
  const homeDir = options.homeDir || env.HOME || os.homedir();
  const repoRoot = options.repoRoot || process.cwd();
  const defaultsPath = options.defaultsPath || path.join(
    repoRoot,
    'data',
    'user-context',
    'storage-provider-defaults.json'
  );

  const defaults = readJson(defaultsPath) || {
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
    collections: COLLECTIONS,
    inheritance: {
      coreFleet: 'inherit-user-profile',
      swarm: 'inherit-parent',
      agent: 'inherit-parent',
    },
  };

  const profileName = options.profileName || activeProfileName(repoRoot, env, homeDir);
  const profilePath = options.profilePath
    || env.TNF_USER_PROFILE_PATH
    || path.join(homeDir, '.tnf', 'profiles', `${profileName}.json`);
  const profile = readJson(profilePath) || {};
  const userStorage = profile.contextStorage || {};

  const defaultRootTemplate = defaults.providers?.local?.rootTemplate
    || '~/.tnf/user-context/data/<profile>';
  const configuredLocalRoot = userStorage.local?.root
    || defaultRootTemplate.replaceAll('<profile>', profileName);
  const localRoot = path.resolve(expandHome(configuredLocalRoot, homeDir));

  const defaultDrive = defaults.providers?.googleDrive || {};
  const drive = {
    enabled: Boolean(userStorage.googleDrive?.enabled ?? defaultDrive.enabled),
    folderId: userStorage.googleDrive?.folderId ?? defaultDrive.folderId ?? null,
    folderUrl: userStorage.googleDrive?.folderUrl ?? defaultDrive.folderUrl ?? null,
    folderName: userStorage.googleDrive?.folderName
      || defaultDrive.folderName
      || 'TNF User Context',
  };
  const googleDriveReady = drive.enabled && Boolean(drive.folderId || drive.folderUrl);

  const requestedStrategy = userStorage.strategy || defaults.defaultStrategy || 'local-primary';
  const wantsDrivePrimary = requestedStrategy === 'google-drive-primary';
  const wantsMirrored = requestedStrategy === 'mirrored';
  const effectivePrimary = wantsDrivePrimary && googleDriveReady ? 'google_drive' : 'local';
  const degraded = (wantsDrivePrimary || wantsMirrored) && !googleDriveReady;

  const collectionNames = Array.isArray(defaults.collections) && defaults.collections.length
    ? defaults.collections
    : COLLECTIONS;
  const collections = Object.fromEntries(collectionNames.map((name) => [
    name,
    {
      logicalUri: `tnf-user://${encodeURIComponent(profileName)}/${name}`,
      localPath: path.join(localRoot, name),
      googleDriveRelativePath: `${profileName}/${name}`,
    },
  ]));

  return {
    spec: defaults.spec || 'tnf/user-context-storage/0.1',
    profileName,
    profilePath,
    profileFound: Boolean(profile && Object.keys(profile).length),
    requestedStrategy,
    effectivePrimary,
    degraded,
    fallbackReason: degraded ? 'google-drive-binding-missing' : null,
    providers: {
      local: {
        enabled: true,
        ready: true,
        root: localRoot,
      },
      googleDrive: {
        ...drive,
        ready: googleDriveReady,
      },
    },
    inheritance: userStorage.inheritance || defaults.inheritance || {
      coreFleet: 'inherit-user-profile',
      swarm: 'inherit-parent',
      agent: 'inherit-parent',
    },
    collections,
  };
}

function parseArgs(argv) {
  const out = { json: false, profileName: null, repoRoot: process.cwd() };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--json') out.json = true;
    else if (arg === '--profile' && argv[i + 1]) out.profileName = argv[++i];
    else if (arg === '--repo-root' && argv[i + 1]) out.repoRoot = path.resolve(argv[++i]);
  }
  return out;
}

if (require.main === module) {
  const args = parseArgs(process.argv.slice(2));
  const result = resolveUserContextStorage({
    repoRoot: args.repoRoot,
    profileName: args.profileName || undefined,
  });

  if (args.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else {
    console.log(`TNF user-context profile: ${result.profileName}`);
    console.log(`Strategy: ${result.requestedStrategy}`);
    console.log(`Effective primary: ${result.effectivePrimary}`);
    console.log(`Local root: ${result.providers.local.root}`);
    console.log(
      `Google Drive: ${result.providers.googleDrive.ready ? 'ready' : 'not bound'}${result.degraded ? ' (degraded fallback)' : ''}`
    );
    console.log('Use --json for machine-readable collection mappings.');
  }
}

module.exports = {
  COLLECTIONS,
  resolveUserContextStorage,
};
