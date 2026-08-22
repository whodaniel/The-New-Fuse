#!/usr/bin/env node

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const STRATEGIES = new Set([
  'local-primary',
  'google-drive-primary',
  'mirrored',
  'local-only',
]);

function usage(exitCode = 0) {
  const text = `TNF user-context storage configuration

Usage:
  node scripts/user-context/configure-storage.cjs [options]

Options:
  --profile <name>              TNF profile name (default: TNF_PROFILE/USER)
  --strategy <strategy>         local-primary | google-drive-primary | mirrored | local-only
  --local-root <path>           Local user-context root
  --drive-folder-id <id>        User-authorized Google Drive root folder ID
  --drive-folder-url <url>      User-authorized Google Drive root folder URL
  --drive-folder-name <name>    Display folder name (default: TNF User Context)
  --disable-drive               Clear Drive binding and disable Drive
  --show                        Print the profile without changing it
  --help                        Show this help

This command edits only ~/.tnf/profiles/<profile>.json. It never writes a user-specific
Drive ID, token, or absolute personal path into repository source.
`;
  process.stdout.write(text);
  process.exit(exitCode);
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') out.help = true;
    else if (arg === '--show') out.show = true;
    else if (arg === '--disable-drive') out.disableDrive = true;
    else if (arg === '--profile') out.profile = argv[++i];
    else if (arg === '--strategy') out.strategy = argv[++i];
    else if (arg === '--local-root') out.localRoot = argv[++i];
    else if (arg === '--drive-folder-id') out.driveFolderId = argv[++i];
    else if (arg === '--drive-folder-url') out.driveFolderUrl = argv[++i];
    else if (arg === '--drive-folder-name') out.driveFolderName = argv[++i];
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return out;
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    usage(2);
  }
  if (args.help) usage(0);

  const home = process.env.HOME || os.homedir();
  const profileName = args.profile || process.env.TNF_PROFILE || process.env.USER || 'default';
  const profileDir = path.join(home, '.tnf', 'profiles');
  const profilePath = path.join(profileDir, `${profileName}.json`);
  const profile = readJson(profilePath) || {
    profileName,
    createdAt: new Date().toISOString(),
  };

  if (args.show) {
    process.stdout.write(`${JSON.stringify(profile, null, 2)}\n`);
    return;
  }

  if (args.strategy && !STRATEGIES.has(args.strategy)) {
    throw new Error(`Invalid strategy: ${args.strategy}`);
  }

  const previous = profile.contextStorage || {};
  const local = {
    root: args.localRoot
      || previous.local?.root
      || `~/.tnf/user-context/data/${profileName}`,
  };

  let googleDrive = {
    enabled: Boolean(previous.googleDrive?.enabled),
    folderId: previous.googleDrive?.folderId || null,
    folderUrl: previous.googleDrive?.folderUrl || null,
    folderName: previous.googleDrive?.folderName || 'TNF User Context',
  };

  if (args.disableDrive) {
    googleDrive = {
      enabled: false,
      folderId: null,
      folderUrl: null,
      folderName: args.driveFolderName || googleDrive.folderName,
    };
  } else {
    if (args.driveFolderId !== undefined) googleDrive.folderId = args.driveFolderId || null;
    if (args.driveFolderUrl !== undefined) googleDrive.folderUrl = args.driveFolderUrl || null;
    if (args.driveFolderName) googleDrive.folderName = args.driveFolderName;
    if (googleDrive.folderId || googleDrive.folderUrl) googleDrive.enabled = true;
  }

  profile.contextStorage = {
    strategy: args.strategy || previous.strategy || 'local-primary',
    local,
    googleDrive,
    inheritance: previous.inheritance || {
      coreFleet: 'inherit-user-profile',
      swarm: 'inherit-parent',
      agent: 'inherit-parent',
    },
  };
  profile.updatedAt = new Date().toISOString();

  fs.mkdirSync(profileDir, { recursive: true, mode: 0o700 });
  fs.writeFileSync(profilePath, `${JSON.stringify(profile, null, 2)}\n`, { mode: 0o600 });

  console.log(`Updated TNF profile storage: ${profilePath}`);
  console.log(`Strategy: ${profile.contextStorage.strategy}`);
  console.log(`Local root: ${profile.contextStorage.local.root}`);
  console.log(
    `Google Drive: ${profile.contextStorage.googleDrive.enabled ? 'enabled' : 'disabled'}${
      profile.contextStorage.googleDrive.enabled && !(profile.contextStorage.googleDrive.folderId || profile.contextStorage.googleDrive.folderUrl)
        ? ' (not bound)'
        : ''
    }`
  );
  console.log('Verify with: node scripts/user-context/resolve-storage.cjs --json');
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
