import { google } from 'googleapis';
import crypto from 'crypto';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

const OUT_DIR = process.env.OUT_DIR || '/Users/danielgoldberg/Documents/Arweave-ArDrive-Consolidated/00-seed-phrases-and-recovery-info/google-drive-api-search';
const MANIFEST_DIR = process.env.MANIFEST_DIR || '/Users/danielgoldberg/Documents/Arweave-ArDrive-Consolidated/99-reference-manifests';
const RESOLVE_DRIVE_PATHS = process.env.RESOLVE_DRIVE_PATHS === '1';

const TERMS = [
  'Arweave',
  'ArDrive',
  'ardrive',
  'arweave',
  'wallet',
  'wallet.json',
  'arweave-key',
  'ardrive-wallet',
  'JWK',
  'keyfile',
  'seed phrase',
  'recovery phrase',
  'secret phrase',
  'mnemonic',
  'mnemonic phrase',
  'backup phrase',
  'wallet phrase',
  'passphrase',
  'private key',
  '12 word',
  '12-word',
  '24 word',
  '24-word',
];

const CRITICAL_TERMS = [
  'seed phrase',
  'recovery phrase',
  'secret phrase',
  'mnemonic',
  'mnemonic phrase',
  'backup phrase',
  'wallet phrase',
  'passphrase',
  'private key',
  '12 word',
  '12-word',
  '24 word',
  '24-word',
  'wallet.json',
  'arweave-key',
  'ardrive-wallet',
  'keyfile',
  'jwk',
];

const HIGH_TERMS = ['arweave', 'ardrive', 'wallet'];
const FILENAME_ONLY_TERMS = new Set(['wallet']);

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function firstExistingPath(paths) {
  for (const candidate of paths.filter(Boolean)) {
    if (await fileExists(candidate)) return candidate;
  }
  return undefined;
}

async function loadGeminiWorkspaceCredentials() {
  const extensionDir = '/Users/danielgoldberg/.gemini/extensions/google-workspace';
  const tokenPath = path.join(extensionDir, 'gemini-cli-workspace-token.json');
  const masterKeyPath = path.join(extensionDir, '.gemini-cli-workspace-master-key');

  if (!(await fileExists(tokenPath)) || !(await fileExists(masterKeyPath))) return null;

  const encrypted = await fs.readFile(tokenPath, 'utf8');
  const masterKey = await fs.readFile(masterKeyPath);
  const salt = `${os.hostname()}-${os.userInfo().username}-gemini-cli-workspace`;
  const encryptionKey = crypto.scryptSync(masterKey, salt, 32);
  const parts = encrypted.split(':');
  if (parts.length !== 3) return null;

  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey, iv);
  decipher.setAuthTag(authTag);
  const decrypted = `${decipher.update(parts[2], 'hex', 'utf8')}${decipher.final('utf8')}`;
  const credentialMap = JSON.parse(decrypted);
  const mainAccount = credentialMap['main-account'];
  const token = mainAccount?.token;

  if (!token?.refreshToken && !token?.accessToken) return null;

  return {
    clientId: process.env.WORKSPACE_CLIENT_ID || '338689075775-o75k922vn5fdl18qergr96rp8g63e4d7.apps.googleusercontent.com',
    credentials: {
      access_token: token.accessToken,
      refresh_token: token.refreshToken,
      token_type: token.tokenType || 'Bearer',
      scope: token.scope,
      expiry_date: token.expiresAt,
    },
    source: tokenPath,
  };
}

async function buildAuthClient() {
  const geminiWorkspaceCredentials = await loadGeminiWorkspaceCredentials();
  if (geminiWorkspaceCredentials) {
    const oauth2Client = new google.auth.OAuth2(geminiWorkspaceCredentials.clientId);
    oauth2Client.setCredentials(geminiWorkspaceCredentials.credentials);
    return { auth: oauth2Client, source: geminiWorkspaceCredentials.source };
  }

  const authJsonPath = await firstExistingPath([
    process.env.GOOGLE_AUTH_JSON_PATH,
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    '/Users/danielgoldberg/.config/gcloud/application_default_credentials.json',
    '/Users/danielgoldberg/.config/gcloud/legacy_credentials/bizsynth@gmail.com/adc.json',
    '/Users/danielgoldberg/.gemini/oauth_creds.json',
  ]);

  if (authJsonPath) {
    const authJson = JSON.parse(await fs.readFile(authJsonPath, 'utf8'));
    if (authJson.type === 'authorized_user' || authJson.refresh_token) {
      const oauth2Client = new google.auth.OAuth2(authJson.client_id, authJson.client_secret);
      oauth2Client.setCredentials({ refresh_token: authJson.refresh_token });
      return { auth: oauth2Client, source: authJsonPath };
    }

    if (authJson.type === 'service_account') {
      const auth = new google.auth.GoogleAuth({
        keyFile: authJsonPath,
        scopes: ['https://www.googleapis.com/auth/drive.readonly'],
      });
      return { auth, source: authJsonPath };
    }

    throw new Error(`Unsupported Google auth JSON type at ${authJsonPath}`);
  }

  const oauth2Client = new google.auth.OAuth2(
    requireEnv('GOOGLE_CLIENT_ID'),
    requireEnv('GOOGLE_CLIENT_SECRET'),
  );
  oauth2Client.setCredentials({ refresh_token: requireEnv('GOOGLE_REFRESH_TOKEN') });
  return { auth: oauth2Client, source: 'environment variables' };
}

function escapeDriveQuery(value) {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function fullTextSearchTerm(term) {
  return /\s/.test(term) ? `"${term.replace(/"/g, '\\"')}"` : term;
}

function classify(reasons) {
  const text = reasons.join(' ').toLowerCase();
  if (CRITICAL_TERMS.some((term) => text.includes(term))) return 'Critical';
  if (HIGH_TERMS.some((term) => text.includes(term))) return 'High';
  return 'Medium';
}

function recommendation(classification) {
  if (classification === 'Critical') return 'Review manually and copy to restricted recovery folder if confirmed';
  if (classification === 'High') return 'Review manually';
  return 'Reference only';
}

function tsvEscape(value) {
  return String(value ?? '').replace(/\t/g, ' ').replace(/\r?\n/g, ' ');
}

async function listAll(drive, q, label) {
  const results = [];
  let pageToken;
  let page = 0;
  do {
    const response = await drive.files.list({
      q,
      fields: 'nextPageToken, files(id, name, mimeType, modifiedTime, size, md5Checksum, webViewLink, parents, trashed)',
      pageSize: 100,
      pageToken,
      spaces: 'drive',
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
    });
    results.push(...(response.data.files || []));
    pageToken = response.data.nextPageToken || undefined;
    page += 1;
    if (page % 10 === 0) {
      console.error(`Still searching ${label}: ${results.length} matches so far`);
    }
  } while (pageToken);
  return results;
}

async function buildFolderMaps(drive, parentIds) {
  const folderById = new Map();
  const pending = [...new Set(parentIds.filter(Boolean))];

  while (pending.length) {
    const id = pending.pop();
    if (!id || folderById.has(id)) continue;
    try {
      const response = await drive.files.get({
        fileId: id,
        fields: 'id, name, parents',
        supportsAllDrives: true,
      });
      const folder = response.data;
      folderById.set(id, folder);
      for (const parent of folder.parents || []) {
        if (!folderById.has(parent)) pending.push(parent);
      }
    } catch {
      folderById.set(id, { id, name: '(unresolved parent)', parents: [] });
    }
  }

  return folderById;
}

function resolvePath(file, folderById) {
  if (!RESOLVE_DRIVE_PATHS) return `Google Drive/(path not resolved)/${file.name || '(unnamed)'}`;

  const parent = file.parents?.[0];
  const names = [file.name || '(unnamed)'];
  let current = parent;
  const seen = new Set();

  while (current && !seen.has(current)) {
    seen.add(current);
    const folder = folderById.get(current);
    if (!folder) break;
    names.unshift(folder.name || '(unnamed folder)');
    current = folder.parents?.[0];
  }

  names.unshift('My Drive');
  return names.join('/');
}

async function main() {
  const { auth, source } = await buildAuthClient();
  const drive = google.drive({ version: 'v3', auth });
  const matchesById = new Map();

  for (const term of TERMS) {
    const escaped = escapeDriveQuery(term);
    const queries = [
      { q: `name contains '${escaped}' and trashed = false`, reason: `filename match: ${term}` },
    ];
    if (!FILENAME_ONLY_TERMS.has(term.toLowerCase())) {
      const escapedFullTextTerm = escapeDriveQuery(fullTextSearchTerm(term));
      queries.push({ q: `fullText contains '${escapedFullTextTerm}' and trashed = false`, reason: `content match: ${term}` });
    }

    for (const query of queries) {
      console.error(`Searching Drive: ${query.reason}`);
      const files = await listAll(drive, query.q, query.reason);
      for (const file of files) {
        const existing = matchesById.get(file.id) || { file, reasons: new Set() };
        existing.reasons.add(query.reason);
        matchesById.set(file.id, existing);
      }
    }
  }

  const matches = [...matchesById.values()];
  const folderById = RESOLVE_DRIVE_PATHS
    ? await buildFolderMaps(drive, matches.flatMap(({ file }) => file.parents || []))
    : new Map();

  const rows = matches.map(({ file, reasons }) => {
    const reasonList = [...reasons].sort();
    const classification = classify(reasonList);
    return {
      id: file.id,
      name: file.name || '',
      path: resolvePath(file, folderById),
      mimeType: file.mimeType || '',
      modifiedTime: file.modifiedTime || '',
      size: file.size || '',
      md5Checksum: file.md5Checksum || '',
      webViewLink: file.webViewLink || '',
      parentIds: (file.parents || []).join(','),
      matchReason: reasonList.join('; '),
      sensitivity: classification,
      recommendedAction: recommendation(classification),
    };
  }).sort((a, b) => {
    const sensitivityRank = { Critical: 0, High: 1, Medium: 2 };
    return (sensitivityRank[a.sensitivity] ?? 9) - (sensitivityRank[b.sensitivity] ?? 9)
      || a.path.localeCompare(b.path);
  });

  await fs.mkdir(OUT_DIR, { recursive: true, mode: 0o700 });
  await fs.mkdir(MANIFEST_DIR, { recursive: true });

  const header = [
    'sensitivity',
    'recommended_action',
    'file_name',
    'drive_path',
    'file_id',
    'mime_type',
    'modified_time',
    'size',
    'md5_checksum',
    'web_view_link',
    'parent_ids',
    'match_reason',
  ];
  const lines = [
    header.join('\t'),
    ...rows.map((row) => [
      row.sensitivity,
      row.recommendedAction,
      row.name,
      row.path,
      row.id,
      row.mimeType,
      row.modifiedTime,
      row.size,
      row.md5Checksum,
      row.webViewLink,
      row.parentIds,
      row.matchReason,
    ].map(tsvEscape).join('\t')),
  ];

  const manifestPath = path.join(OUT_DIR, 'GOOGLE_DRIVE_SENSITIVE_SEARCH_RESULTS.tsv');
  const manifestMirrorPath = path.join(MANIFEST_DIR, 'GOOGLE_DRIVE_SENSITIVE_SEARCH_RESULTS.tsv');
  await fs.writeFile(manifestPath, `${lines.join('\n')}\n`, { mode: 0o600 });
  await fs.writeFile(manifestMirrorPath, `${lines.join('\n')}\n`, { mode: 0o600 });

  const summary = {
    searchedAt: new Date().toISOString(),
    terms: TERMS,
    filenameOnlyTerms: [...FILENAME_ONLY_TERMS],
    totalMatches: rows.length,
    resolveDrivePaths: RESOLVE_DRIVE_PATHS,
    bySensitivity: rows.reduce((acc, row) => {
      acc[row.sensitivity] = (acc[row.sensitivity] || 0) + 1;
      return acc;
    }, {}),
    authSource: source,
    output: manifestPath,
    manifestMirror: manifestMirrorPath,
    note: 'Secret contents were not downloaded, printed, or stored. This is metadata and match-reason inventory only.',
  };

  await fs.writeFile(path.join(OUT_DIR, 'SUMMARY.json'), `${JSON.stringify(summary, null, 2)}\n`, { mode: 0o600 });
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
