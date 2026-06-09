#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import zlib from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

const CONSOLIDATED = '/Users/danielgoldberg/Documents/Arweave-ArDrive-Consolidated';
const VERIFICATION = path.join(CONSOLIDATED, '02-ardrive-exports', 'verification');
const MANIFESTS = path.join(CONSOLIDATED, '99-reference-manifests');
const TX_JSONL = path.join(VERIFICATION, 'ARDRIVE_RELATED_TRANSACTIONS.jsonl');
const WALLETS_TSV = path.join(VERIFICATION, 'WALLETS_DISCOVERED.tsv');
const SENSITIVE_TSV = path.join(MANIFESTS, 'SENSITIVE_SEED_RECOVERY_AND_TEXT_KEY_FILES.tsv');

const OUT_DRIVES = path.join(MANIFESTS, 'ARDRIVE_DRIVES_DISCOVERED.tsv');
const OUT_DECRYPTED = path.join(MANIFESTS, 'ARDRIVE_DECRYPTED_DRIVE_NAMES.tsv');
const OUT_ATTEMPTS = path.join(MANIFESTS, 'ARDRIVE_PRIVATE_METADATA_DECRYPTION_ATTEMPTS.json');

const DRIVE_IDS = [
  '082436bd-9fc8-41d2-ae6a-855715844c7f',
  '94ccddb5-1e46-4bec-8e1a-2740ef47f0d2',
  'e539976b-761c-41ef-aa72-522fdffa48ae'
];

const require = createRequire(import.meta.url);

function tagValue(tags, name) {
  return tags.find((t) => t.name === name)?.value || '';
}

function tsvEscape(value) {
  return String(value ?? '').replace(/\t/g, ' ').replace(/\r?\n/g, ' ');
}

function base64UrlToBuffer(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(padded, 'base64');
}

function arweaveAddressFromJwk(jwk) {
  return crypto.createHash('sha256').update(base64UrlToBuffer(jwk.n)).digest('base64url');
}

function uuidToBytes(uuid) {
  return Buffer.from(uuid.replace(/-/g, ''), 'hex');
}

function hkdfSha256(ikm, info) {
  return Buffer.from(crypto.hkdfSync('sha256', Buffer.from(ikm), Buffer.alloc(0), Buffer.from(info, 'utf8'), 32));
}

function driveDecrypt(cipherIV, key, data) {
  const authTag = data.subarray(data.length - 16);
  const encrypted = data.subarray(0, data.length - 16);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(cipherIV, 'base64'), { authTagLength: 16 });
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

function signV1(jwk, driveId) {
  const signingKey = Buffer.concat([Buffer.from('drive', 'utf8'), uuidToBytes(driveId)]);
  const sign = crypto.createSign('sha256');
  sign.update(signingKey);
  const key = crypto.createPrivateKey({ key: jwk, format: 'jwk' });
  return sign.sign({
    key,
    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    saltLength: 0
  });
}

async function signV2(jwk, driveId) {
  let arbundles;
  try {
    arbundles = require('/tmp/ardrive-lite/node_modules/@dha-team/arbundles');
  } catch {
    try {
      arbundles = require('@dha-team/arbundles');
    } catch {
      return null;
    }
  }
  const signingKey = Buffer.concat([Buffer.from('drive', 'utf8'), uuidToBytes(driveId)]);
  const signer = new arbundles.ArweaveSigner(jwk);
  signer.sign = function sign(message) {
    return arbundles.getCryptoDriver().sign(jwk, message, { saltLength: 0 });
  };
  const dataItem = arbundles.createData(signingKey, signer, {
    tags: [{ name: 'Action', value: 'Drive-Signature-V2' }]
  });
  await dataItem.sign(signer);
  return Buffer.from(dataItem.rawSignature);
}

async function deriveDriveKey({ password, driveId, jwk, signatureType, walletSignature }) {
  walletSignature = walletSignature || (signatureType === '2' ? await signV2(jwk, driveId) : signV1(jwk, driveId));
  if (!walletSignature) return null;
  return hkdfSha256(walletSignature, password);
}

async function graphqlTransactionsForDrive(driveId, entityType) {
  const query = `query($tags:[TagFilter!]){transactions(tags:$tags, first:20, sort:HEIGHT_DESC){edges{node{id owner{address} bundledIn{id} block{height timestamp} tags{name value} data{size}}}}}`;
  const variables = { tags: [{ name: 'Drive-Id', values: [driveId] }, { name: 'Entity-Type', values: [entityType] }] };
  const response = await fetch('https://arweave.net/graphql', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables })
  });
  if (!response.ok) throw new Error(`GraphQL HTTP ${response.status}`);
  const json = await response.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data.transactions.edges.map((edge) => edge.node);
}

async function collectDriveRecords() {
  const recordsById = new Map();
  if (fs.existsSync(TX_JSONL)) {
    const lines = readline.createInterface({
      input: fs.createReadStream(TX_JSONL),
      crlfDelay: Infinity
    });
    for await (const line of lines) {
      if (!line.trim()) continue;
      const tx = JSON.parse(line);
      if (tx.entityType !== 'drive') continue;
      const key = `${tx.driveId}:${tx.id}`;
      recordsById.set(key, {
        id: tx.id,
        owner: { address: tx.walletAddress || '' },
        bundledIn: tx.bundledIn ? { id: tx.bundledIn } : null,
        block: { height: tx.blockHeight || '', timestamp: tx.blockTimestamp || '' },
        tags: tx.tags || [],
        data: { size: tx.dataSize || '' }
      });
    }
  }
  for (const driveId of DRIVE_IDS) {
    const records = await graphqlTransactionsForDrive(driveId, 'drive');
    for (const tx of records) {
      recordsById.set(`${driveId}:${tx.id}`, tx);
    }
  }
  return [...recordsById.values()].sort((a, b) => {
    const aTs = a.block?.timestamp || 0;
    const bTs = b.block?.timestamp || 0;
    return aTs - bTs;
  });
}

function collectWallets() {
  const wallets = new Map();
  if (!fs.existsSync(WALLETS_TSV)) return [];
  const lines = fs.readFileSync(WALLETS_TSV, 'utf8').trim().split('\n').slice(1);
  for (const line of lines) {
    const cols = line.split('\t');
    const paths = (cols[4] || '').split(' | ').filter(Boolean);
    for (const walletPath of paths) {
      if (!fs.existsSync(walletPath)) continue;
      try {
        const jwk = JSON.parse(fs.readFileSync(walletPath, 'utf8'));
        const address = arweaveAddressFromJwk(jwk);
        if (!wallets.has(address)) {
          wallets.set(address, { address, jwk, sourcePath: walletPath });
        }
      } catch {
        // Skip malformed/non-wallet JSON files.
      }
    }
  }
  return [...wallets.values()];
}

function addCandidate(set, source, value) {
  const text = String(value || '').replace(/\0/g, '').trim();
  if (text.length < 4 || text.length > 300) return;
  if (/^\{.+\}$/.test(text) && text.includes('"kty"')) return;
  set.set(text, source);
}

function extractNoteBlobText(hexBlob) {
  if (!hexBlob) return '';
  let raw;
  try {
    raw = Buffer.from(hexBlob, 'hex');
  } catch {
    return '';
  }
  if (raw.length > 2 && raw[0] === 0x1f && raw[1] === 0x8b) {
    try {
      raw = zlib.gunzipSync(raw);
    } catch {
      // Keep the original bytes if gzip probing fails.
    }
  }
  const decoded = raw.toString('utf8');
  const segments = decoded.match(/[ -~\t\n]{4,}/g) || [];
  return segments
    .flatMap((segment) => segment.split(/\r?\n/))
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line, index, lines) => line.length > 1 && line !== lines[index - 1])
    .slice(0, 1200)
    .join('\n');
}

function collectAppleNotesCandidates(candidates) {
  const dbPath = path.join(process.env.HOME || '/Users/danielgoldberg', 'Library', 'Group Containers', 'group.com.apple.notes', 'NoteStore.sqlite');
  if (!fs.existsSync(dbPath)) return 0;
  const sql = `
SELECT
  o.Z_PK,
  COALESCE(o.ZTITLE1, o.ZTITLE2, o.ZTITLE, ''),
  COALESCE(o.ZSNIPPET, o.ZSUMMARY, ''),
  COALESCE(hex(d.ZDATA), '')
FROM ZICCLOUDSYNCINGOBJECT o
LEFT JOIN ZICNOTEDATA d ON d.Z_PK = o.ZNOTEDATA
WHERE o.Z_ENT = 11
  AND COALESCE(o.ZMARKEDFORDELETION, 0) = 0;
`;
  let output = '';
  try {
    output = execFileSync('sqlite3', ['-separator', '\x1f', dbPath, sql], {
      encoding: 'utf8',
      maxBuffer: 512 * 1024 * 1024
    });
  } catch {
    return 0;
  }
  let noteCount = 0;
  for (const row of output.split('\n')) {
    if (!row.trim()) continue;
    const [pk, title, snippet, hexBlob] = row.split('\x1f');
    const source = `Apple Notes note ${pk}`;
    noteCount += 1;
    addCandidate(candidates, source, title);
    addCandidate(candidates, source, snippet);
    const text = extractNoteBlobText(hexBlob);
    for (const line of text.split(/\r?\n/)) {
      addCandidate(candidates, source, line);
      const colon = line.indexOf(':');
      if (colon !== -1) addCandidate(candidates, source, line.slice(colon + 1));
      for (const match of line.matchAll(/["'`](.{4,300}?)["'`]/g)) {
        addCandidate(candidates, source, match[1]);
      }
      for (const match of line.matchAll(/\b(?:[a-z]+[\s,;.-]+){3,23}[a-z]+\b/gi)) {
        addCandidate(candidates, source, match[0].replace(/[,;.-]+/g, ' ').replace(/\s+/g, ' '));
      }
    }
  }
  return noteCount;
}

function addTextCandidates(candidates, source, text) {
  const trimmed = String(text || '').trim();
  if (trimmed.length <= 300) addCandidate(candidates, source, trimmed);
  for (const rawLine of trimmed.split(/\r?\n/)) {
    const line = rawLine.trim();
    addCandidate(candidates, source, line);
    const colon = line.indexOf(':');
    if (colon !== -1) addCandidate(candidates, source, line.slice(colon + 1));
    for (const match of line.matchAll(/["'`](.{4,300}?)["'`]/g)) {
      addCandidate(candidates, source, match[1]);
    }
    for (const match of line.matchAll(/\b(?:[a-z]+[\s,;.-]+){3,23}[a-z]+\b/gi)) {
      addCandidate(candidates, source, match[0].replace(/[,;.-]+/g, ' ').replace(/\s+/g, ' '));
    }
  }
}

async function getGoogleAccessToken() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) return null;
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token'
  });
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body
  });
  if (!response.ok) return null;
  const json = await response.json();
  return json.access_token || null;
}

async function googleDriveList(token, q, pageSize = 50) {
  const url = new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.set('q', q);
  url.searchParams.set('pageSize', String(pageSize));
  url.searchParams.set('fields', 'files(id,name,mimeType,size,modifiedTime)');
  url.searchParams.set('supportsAllDrives', 'true');
  url.searchParams.set('includeItemsFromAllDrives', 'true');
  const response = await fetch(url, { headers: { authorization: `Bearer ${token}` } });
  if (!response.ok) return [];
  const json = await response.json();
  return json.files || [];
}

async function googleDriveReadFile(token, file) {
  const headers = { authorization: `Bearer ${token}` };
  let url;
  if (file.mimeType === 'application/vnd.google-apps.document') {
    url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.id)}/export?mimeType=text/plain`;
  } else if (file.mimeType === 'application/vnd.google-apps.spreadsheet') {
    url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.id)}/export?mimeType=text/csv`;
  } else if (file.mimeType === 'application/vnd.google-apps.presentation') {
    url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.id)}/export?mimeType=text/plain`;
  } else {
    const size = Number.parseInt(file.size || '0', 10);
    const readableMime = /text|json|csv|markdown|xml|html|rtf|javascript|x-shellscript|x-python/i.test(file.mimeType || '');
    if (!readableMime || size > 2 * 1024 * 1024) return '';
    url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.id)}?alt=media`;
  }
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(20000) });
  if (!response.ok) return '';
  return Buffer.from(await response.arrayBuffer()).toString('utf8');
}

async function collectGoogleDriveCandidates(candidates) {
  const token = await getGoogleAccessToken();
  if (!token) return { filesRead: 0 };
  const queries = [
    "trashed = false and name contains 'Nk1Q'",
    "trashed = false and name contains 'arweave-key'",
    "trashed = false and name contains 'ardrive'",
    "trashed = false and name contains 'ArDrive'",
    "trashed = false and fullText contains 'Nk1QTeJK5QPyoZGVgLKh857NJOtrqyT1E9BYqfFUgTk'",
    "trashed = false and fullText contains 'ArDrive'",
    "trashed = false and fullText contains 'Arweave'",
    "trashed = false and fullText contains 'seed phrase'",
    "trashed = false and fullText contains 'recovery phrase'",
    "trashed = false and fullText contains 'passphrase'",
    "trashed = false and fullText contains 'wallet password'"
  ];
  const filesById = new Map();
  for (const q of queries) {
    for (const file of await googleDriveList(token, q, 80)) filesById.set(file.id, file);
  }
  let filesRead = 0;
  for (const file of filesById.values()) {
    const text = await googleDriveReadFile(token, file);
    if (!text) continue;
    filesRead += 1;
    addCandidate(candidates, `Google Drive file ${file.id}`, file.name);
    addTextCandidates(candidates, `Google Drive file ${file.id}`, text);
  }
  return { filesRead };
}

function collectCandidatePasswords() {
  const candidates = new Map();
  const sourceFiles = new Set();
  const addFile = (filePath) => {
    if (filePath && fs.existsSync(filePath)) sourceFiles.add(filePath);
  };
  if (fs.existsSync(SENSITIVE_TSV)) {
    const lines = fs.readFileSync(SENSITIVE_TSV, 'utf8').trim().split('\n').slice(1);
    for (const line of lines) {
      const cols = line.split('\t');
      addFile(path.join(CONSOLIDATED, cols[2] || ''));
    }
  }
  [
    path.join(CONSOLIDATED, '00-seed-phrases-and-recovery-info', 'search-manifests', 'PRECISE_LOCAL_FILE_MATCHES.txt'),
    path.join(CONSOLIDATED, '00-seed-phrases-and-recovery-info', 'search-manifests', 'PRECISE_MAIL_MATCHES.txt'),
    path.join(CONSOLIDATED, '00-seed-phrases-and-recovery-info', 'from-notes', 'APPLE_NOTES_SEARCH_SUMMARY.txt'),
    path.join(CONSOLIDATED, '00-seed-phrases-and-recovery-info', 'google-drive-api-search', 'GOOGLE_DRIVE_SENSITIVE_SEARCH_RESULTS.tsv')
  ].forEach(addFile);

  for (const filePath of sourceFiles) {
    const stat = fs.statSync(filePath);
    if (!stat.isFile() || stat.size > 10 * 1024 * 1024) continue;
    let text;
    try {
      text = fs.readFileSync(filePath, 'utf8');
    } catch {
      continue;
    }
    const rel = path.relative(CONSOLIDATED, filePath);
    const trimmed = text.trim();
    if (trimmed.length <= 300) addCandidate(candidates, rel, trimmed);
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      addCandidate(candidates, rel, line);
      const colon = line.indexOf(':');
      if (colon !== -1) addCandidate(candidates, rel, line.slice(colon + 1));
      for (const match of line.matchAll(/["'`](.{4,300}?)["'`]/g)) {
        addCandidate(candidates, rel, match[1]);
      }
      for (const match of line.matchAll(/\b(?:[a-z]+[\s,;.-]+){3,23}[a-z]+\b/gi)) {
        addCandidate(candidates, rel, match[0].replace(/[,;.-]+/g, ' ').replace(/\s+/g, ' '));
      }
    }
  }
  collectAppleNotesCandidates(candidates);
  return candidates;
}

function gatewayCandidates() {
  const known = [
    'https://sol01.ario.io.vn',
    'https://sol02.ario.io.vn',
    'https://sol03.ario.io.vn',
    'https://arweave.net',
    'https://gateway.arweave.net',
    'https://g8way.io'
  ];
  const gatewayFile = '/tmp/ario_gateways.txt';
  if (!fs.existsSync(gatewayFile)) return known;
  const fromFile = fs.readFileSync(gatewayFile, 'utf8').split('\n').map((line) => line.trim()).filter(Boolean);
  return [...new Set([...known, ...fromFile])];
}

async function fetchFromGateways(txId) {
  const directGateways = [
    'https://arweave.net',
    'https://gateway.arweave.net',
    'https://sol01.ario.io.vn',
    'https://sol02.ario.io.vn',
    'https://sol03.ario.io.vn'
  ];
  for (const gateway of directGateways) {
    try {
      const response = await fetch(`${gateway}/${txId}`, { signal: AbortSignal.timeout(6000) });
      if (response.ok) return Buffer.from(await response.arrayBuffer());
    } catch {
      // Try the next gateway, then Wayfinder.
    }
  }
  try {
    const {
      createWayfinderClient,
      RoundRobinRoutingStrategy
    } = require('/tmp/ardrive-lite/node_modules/@ar.io/wayfinder-core');
    const wayfinder = createWayfinderClient({
      routingSettings: {
        strategy: new RoundRobinRoutingStrategy({
          gateways: [
            new URL('https://arweave.net'),
            new URL('https://gateway.arweave.net'),
            new URL('https://g8way.io'),
            new URL('https://arweave.dev')
          ]
        })
      },
      verificationSettings: { enabled: false }
    });
    const response = await wayfinder.request(`ar://${txId}`);
    if (response.ok) return Buffer.from(await response.arrayBuffer());
    throw new Error(`Wayfinder HTTP ${response.status}`);
  } catch (error) {
    throw new Error(`Fetch ${txId} failed through direct gateways and Wayfinder: ${error.message}`);
  }
}

async function fetchBundledDataItem(txId, bundleTxId) {
  const { unbundleData } = require('/tmp/ardrive-lite/node_modules/@dha-team/arbundles');
  let lastError = '';
  for (const gateway of gatewayCandidates()) {
    try {
      const response = await fetch(`${gateway}/${bundleTxId}`, { signal: AbortSignal.timeout(15000) });
      if (!response.ok) {
        lastError = `${gateway} HTTP ${response.status}`;
        continue;
      }
      const bundleBytes = Buffer.from(await response.arrayBuffer());
      const items = await unbundleData(bundleBytes).getItems();
      const item = items.find((candidate) => candidate.id === txId);
      if (item) return Buffer.from(item.rawData);
      lastError = `${gateway} did not contain item ${txId}`;
    } catch (error) {
      lastError = `${gateway} ${error.message}`;
    }
  }
  throw new Error(`Could not extract ${txId} from bundle ${bundleTxId}: ${lastError}`);
}

async function fetchTxData(txId, bundleTxId) {
  try {
    return await fetchFromGateways(txId);
  } catch (directError) {
    if (bundleTxId) return await fetchBundledDataItem(txId, bundleTxId);
    throw directError;
  }
}

function looksLikeDriveMetadata(buffer) {
  try {
    const json = JSON.parse(buffer.toString('utf8'));
    if (typeof json.name === 'string' && typeof json.rootFolderId === 'string') return json;
  } catch {
    return null;
  }
  return null;
}

async function main() {
  fs.mkdirSync(MANIFESTS, { recursive: true });
  const driveRecords = await collectDriveRecords();
  const wallets = collectWallets();
  const candidateMap = collectCandidatePasswords();
  const googleDriveCandidateStats = await collectGoogleDriveCandidates(candidateMap);
  const candidates = [...candidateMap.entries()].map(([password, source]) => ({ password, source }));
  const dataCache = new Map();
  const decrypted = [];
  let attempts = 0;
  let skippedMissingOwnerWallet = 0;
  let skippedV2NoSigner = 0;
  const signatureCache = new Map();

  for (const record of driveRecords) {
    const driveId = tagValue(record.tags, 'Drive-Id');
    const owner = record.owner?.address || '';
    const signatureType = tagValue(record.tags, 'Signature-Type') || '1';
    const cipherIV = tagValue(record.tags, 'Cipher-IV');
    const ownerWallets = wallets.filter((wallet) => wallet.address === owner);
    if (!ownerWallets.length) {
      skippedMissingOwnerWallet += 1;
      continue;
    }
    if (!dataCache.has(record.id)) dataCache.set(record.id, await fetchTxData(record.id, record.bundledIn?.id));
    const encryptedData = dataCache.get(record.id);
    for (const wallet of ownerWallets) {
      const signatureCacheKey = `${wallet.address}:${driveId}:${signatureType}`;
      if (!signatureCache.has(signatureCacheKey)) {
        signatureCache.set(signatureCacheKey, signatureType === '2' ? await signV2(wallet.jwk, driveId) : signV1(wallet.jwk, driveId));
      }
      const walletSignature = signatureCache.get(signatureCacheKey);
      if (!walletSignature) {
        skippedV2NoSigner += 1;
        continue;
      }
      for (const candidate of candidates) {
        attempts += 1;
        let key;
        try {
          key = await deriveDriveKey({
            password: candidate.password,
            driveId,
            jwk: wallet.jwk,
            signatureType,
            walletSignature
          });
        } catch {
          continue;
        }
        try {
          const metadata = looksLikeDriveMetadata(driveDecrypt(cipherIV, key, encryptedData));
          if (!metadata) continue;
          decrypted.push({
            driveId,
            txId: record.id,
            owner,
            signatureType,
            name: metadata.name,
            rootFolderId: metadata.rootFolderId,
            blockHeight: record.block?.height || '',
            blockTimestamp: record.block?.timestamp || '',
            candidateSource: candidate.source,
            walletSource: path.relative(CONSOLIDATED, wallet.sourcePath)
          });
          break;
        } catch {
          // Wrong candidate key.
        }
      }
    }
  }

  const driveRows = [
    ['drive_id', 'tx_id', 'owner_address', 'privacy', 'auth_mode', 'signature_type', 'arfs_version', 'app_version', 'block_height', 'block_timestamp', 'data_size', 'decrypted_name', 'root_folder_id'].join('\t')
  ];
  for (const record of driveRecords) {
    const driveId = tagValue(record.tags, 'Drive-Id');
    const hit = decrypted.find((item) => item.driveId === driveId && item.txId === record.id);
    driveRows.push([
      driveId,
      record.id,
      record.owner?.address || '',
      tagValue(record.tags, 'Drive-Privacy'),
      tagValue(record.tags, 'Drive-Auth-Mode'),
      tagValue(record.tags, 'Signature-Type') || '1',
      tagValue(record.tags, 'ArFS'),
      tagValue(record.tags, 'App-Version'),
      record.block?.height || '',
      record.block?.timestamp || '',
      record.data?.size || '',
      hit?.name || '',
      hit?.rootFolderId || ''
    ].map(tsvEscape).join('\t'));
  }
  fs.writeFileSync(OUT_DRIVES, `${driveRows.join('\n')}\n`);

  const decryptedRows = [
    ['drive_id', 'drive_name', 'root_folder_id', 'owner_address', 'tx_id', 'signature_type', 'block_height', 'block_timestamp', 'candidate_source', 'wallet_source'].join('\t')
  ];
  for (const item of decrypted) {
    decryptedRows.push([
      item.driveId,
      item.name,
      item.rootFolderId,
      item.owner,
      item.txId,
      item.signatureType,
      item.blockHeight,
      item.blockTimestamp,
      item.candidateSource,
      item.walletSource
    ].map(tsvEscape).join('\t'));
  }
  fs.writeFileSync(OUT_DECRYPTED, `${decryptedRows.join('\n')}\n`);

  fs.writeFileSync(OUT_ATTEMPTS, `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    driveRecordCount: driveRecords.length,
    localWalletCount: wallets.length,
    candidatePasswordCount: candidates.length,
    googleDriveCandidateFilesRead: googleDriveCandidateStats.filesRead,
    attempts,
    decryptedDriveCount: decrypted.length,
    skippedMissingOwnerWallet,
    skippedV2NoSigner,
    outputFiles: { drives: OUT_DRIVES, decrypted: OUT_DECRYPTED }
  }, null, 2)}\n`);

  console.log(JSON.stringify({
    driveRecordCount: driveRecords.length,
    localWalletCount: wallets.length,
    candidatePasswordCount: candidates.length,
    googleDriveCandidateFilesRead: googleDriveCandidateStats.filesRead,
    attempts,
    decryptedDriveCount: decrypted.length,
    skippedMissingOwnerWallet,
    skippedV2NoSigner,
    outputs: [OUT_DRIVES, OUT_DECRYPTED, OUT_ATTEMPTS]
  }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
