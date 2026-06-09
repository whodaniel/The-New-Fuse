import Arweave from 'arweave';
import crypto from 'crypto';
import { once } from 'events';
import fsSync from 'fs';
import fs from 'fs/promises';
import path from 'path';

const HOME = '/Users/danielgoldberg';
const COLLECTION_DIR = `${HOME}/Documents/Arweave-ArDrive-Consolidated`;
const OUT_DIR = process.env.OUT_DIR || `${COLLECTION_DIR}/02-ardrive-exports/verification`;
const MANIFEST_DIR = process.env.MANIFEST_DIR || `${COLLECTION_DIR}/99-reference-manifests`;
const GRAPHQL_URL = process.env.ARWEAVE_GRAPHQL_URL || 'https://arweave.net/graphql';
const GATEWAY_URL = process.env.ARWEAVE_GATEWAY_URL || 'https://arweave.net';
const PAGE_SIZE = Number(process.env.PAGE_SIZE || 100);
const FETCH_PUBLIC_METADATA = process.env.FETCH_PUBLIC_METADATA !== '0';
const MAX_METADATA_BYTES = Number(process.env.MAX_METADATA_BYTES || 1024 * 1024);

const WALLET_ROOTS = [
  `${COLLECTION_DIR}/01-wallets-and-keys`,
  `${COLLECTION_DIR}/03-original-document-folders`,
  `${HOME}/Documents/Arweave - Ardrive files`,
  `${HOME}/Documents/ArWeave Wallet `,
  `${HOME}/Documents/Arweave Wallet March-18-2023dataapplication`,
  `${HOME}/Desktop/A1-Inter-LLM-Com/The-New-Fuse/scripts/personal-archaeology`,
];

const arweave = Arweave.init({ host: 'arweave.net', protocol: 'https', port: 443 });

function tsv(value) {
  return String(value ?? '').replace(/\t/g, ' ').replace(/\r?\n/g, ' ');
}

function tagMap(tags = []) {
  const map = {};
  for (const tag of tags) {
    if (!map[tag.name]) map[tag.name] = [];
    map[tag.name].push(tag.value);
  }
  return map;
}

function firstTag(tags, name) {
  return tagMap(tags)[name]?.[0] || '';
}

async function writeLine(stream, line) {
  if (!stream.write(`${line}\n`)) await once(stream, 'drain');
}

async function closeStream(stream) {
  stream.end();
  await once(stream, 'finish');
}

function hasArDriveSignal(tags = []) {
  const map = tagMap(tags);
  const appNames = (map['App-Name'] || []).join(' ');
  return Boolean(
    map.ArFS ||
      map['Entity-Type'] ||
      map['Drive-Id'] ||
      map['Folder-Id'] ||
      map['File-Id'] ||
      map['Parent-Folder-Id'] ||
      map['Snapshot-Id'] ||
      /ardrive|arfs|tnf-personal-archaeology/i.test(appNames),
  );
}

function classifyTransaction(node) {
  const tags = node.tags || [];
  const entityType = firstTag(tags, 'Entity-Type');
  const appName = firstTag(tags, 'App-Name');
  if (entityType) return `ArFS ${entityType}`;
  if (/ardrive/i.test(appName)) return 'ArDrive-tagged transaction';
  if (/TNF-Personal-Archaeology/i.test(appName)) return 'TNF Arweave upload';
  if (firstTag(tags, 'File-Id')) return 'ArFS file data';
  return hasArDriveSignal(tags) ? 'ArDrive/ArFS related' : 'Other owner transaction';
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function walkFiles(root) {
  const out = [];
  if (!(await exists(root))) return out;
  const stack = [root];
  while (stack.length) {
    const item = stack.pop();
    let stat;
    try {
      stat = await fs.lstat(item);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      const entries = await fs.readdir(item);
      for (const entry of entries) stack.push(path.join(item, entry));
    } else if (/\.json$/i.test(item) && /(wallet|arweave|ardrive|key)/i.test(path.basename(item))) {
      out.push(item);
    }
  }
  return out.sort();
}

async function discoverWallets() {
  const candidates = [];
  for (const root of WALLET_ROOTS) candidates.push(...(await walkFiles(root)));

  const byHash = new Map();
  const wallets = [];
  for (const filePath of candidates) {
    try {
      const raw = await fs.readFile(filePath);
      const hash = crypto.createHash('sha256').update(raw).digest('hex');
      const parsed = JSON.parse(raw.toString('utf8'));
      if (!parsed.kty || !parsed.n || !parsed.e || !parsed.d) continue;
      const address = await arweave.wallets.jwkToAddress(parsed);
      const existing = byHash.get(hash);
      if (existing) {
        existing.paths.push(filePath);
      } else {
        const wallet = {
          address,
          sha256Prefix: hash.slice(0, 16),
          bytes: raw.length,
          paths: [filePath],
        };
        byHash.set(hash, wallet);
        wallets.push(wallet);
      }
    } catch {
      // Ignore non-JWK JSON files.
    }
  }
  return wallets.sort((a, b) => a.address.localeCompare(b.address));
}

async function postGraphql(query, variables, attempt = 1) {
  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  if (!response.ok) {
    if (attempt <= 5 && [408, 429, 500, 502, 503, 504].includes(response.status)) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
      return postGraphql(query, variables, attempt + 1);
    }
    throw new Error(`GraphQL HTTP ${response.status}: ${await response.text()}`);
  }

  const json = await response.json();
  if (json.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
  }
  return json.data;
}

async function fetchAllOwnerTransactions(address, onNode) {
  const query = `
    query($owner: String!, $after: String, $first: Int!) {
      transactions(owners: [$owner], first: $first, after: $after, sort: HEIGHT_ASC) {
        pageInfo { hasNextPage }
        edges {
          cursor
          node {
            id
            owner { address }
            recipient
            quantity { ar winston }
            fee { ar winston }
            block { height timestamp }
            bundledIn { id }
            data { size type }
            tags { name value }
          }
        }
      }
    }
  `;

  let count = 0;
  let after;
  let page = 0;
  while (true) {
    page += 1;
    const data = await postGraphql(query, { owner: address, after, first: PAGE_SIZE });
    const connection = data.transactions;
    for (const edge of connection.edges || []) {
      count += 1;
      await onNode(edge.node);
    }
    console.error(`Fetched ${count} owner transactions for ${address} (${page} pages)`);
    if (!connection.pageInfo?.hasNextPage) break;
    after = connection.edges.at(-1)?.cursor;
    if (!after) break;
  }
  return count;
}

async function fetchMetadataJson(txId, node) {
  if (!FETCH_PUBLIC_METADATA) return null;
  const size = Number(node.data?.size || 0);
  if (!size || size > MAX_METADATA_BYTES) return null;
  const contentType = firstTag(node.tags, 'Content-Type') || node.data?.type || '';
  const cipher = firstTag(node.tags, 'Cipher');
  if (cipher || !/json|text/i.test(contentType)) return null;

  const response = await fetch(`${GATEWAY_URL}/${txId}`);
  if (!response.ok) return null;
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { rawTextPreview: text.slice(0, 500) };
  }
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true, mode: 0o700 });
  await fs.mkdir(MANIFEST_DIR, { recursive: true });

  const wallets = await discoverWallets();
  await fs.writeFile(
    path.join(OUT_DIR, 'WALLETS_DISCOVERED.tsv'),
    [
      ['address', 'sha256_prefix', 'bytes', 'path_count', 'paths'].join('\t'),
      ...wallets.map((wallet) => [
        wallet.address,
        wallet.sha256Prefix,
        wallet.bytes,
        wallet.paths.length,
        wallet.paths.join(' | '),
      ].map(tsv).join('\t')),
    ].join('\n') + '\n',
    { mode: 0o600 },
  );

  const allJsonlPath = path.join(OUT_DIR, 'ALL_OWNER_TRANSACTIONS.jsonl');
  const ardriveJsonlPath = path.join(OUT_DIR, 'ARDRIVE_RELATED_TRANSACTIONS.jsonl');
  const metadataJsonlPath = path.join(OUT_DIR, 'PUBLIC_METADATA_DECODED.jsonl');
  const ardriveTsvPath = path.join(OUT_DIR, 'ARDRIVE_RELATED_TRANSACTIONS.tsv');

  const allStream = fsSync.createWriteStream(allJsonlPath, { flags: 'w', mode: 0o600 });
  const ardriveStream = fsSync.createWriteStream(ardriveJsonlPath, { flags: 'w', mode: 0o600 });
  const metadataStream = fsSync.createWriteStream(metadataJsonlPath, { flags: 'w', mode: 0o600 });
  const ardriveTsvStream = fsSync.createWriteStream(ardriveTsvPath, { flags: 'w', mode: 0o600 });

  await writeLine(ardriveTsvStream, [
    'wallet_address',
    'transaction_id',
    'classification',
    'entity_type',
    'drive_id',
    'drive_privacy',
    'folder_id',
    'parent_folder_id',
    'file_id',
    'snapshot_id',
    'app_name',
    'content_type',
    'cipher',
    'data_size',
    'block_height',
    'block_timestamp',
    'bundled_in',
  ].join('\t'));

  let ownerTransactionCount = 0;
  let ardriveRelatedTransactionCount = 0;
  let decodedPublicMetadataCount = 0;
  const byWallet = {};
  const byClassification = {};
  const byEntityType = {};
  const driveIds = new Set();
  const privateDriveIds = new Set();

  for (const wallet of wallets) {
    await fetchAllOwnerTransactions(wallet.address, async (node) => {
      const classification = classifyTransaction(node);
      const record = {
        walletAddress: wallet.address,
        id: node.id,
        classification,
        isArDriveRelated: hasArDriveSignal(node.tags),
        entityType: firstTag(node.tags, 'Entity-Type'),
        driveId: firstTag(node.tags, 'Drive-Id'),
        drivePrivacy: firstTag(node.tags, 'Drive-Privacy'),
        folderId: firstTag(node.tags, 'Folder-Id'),
        parentFolderId: firstTag(node.tags, 'Parent-Folder-Id'),
        fileId: firstTag(node.tags, 'File-Id'),
        snapshotId: firstTag(node.tags, 'Snapshot-Id'),
        appName: firstTag(node.tags, 'App-Name'),
        appVersion: firstTag(node.tags, 'App-Version'),
        contentType: firstTag(node.tags, 'Content-Type') || node.data?.type || '',
        cipher: firstTag(node.tags, 'Cipher'),
        dataSize: node.data?.size || '',
        blockHeight: node.block?.height || '',
        blockTimestamp: node.block?.timestamp || '',
        bundledIn: node.bundledIn?.id || '',
        tags: node.tags,
      };
      ownerTransactionCount += 1;
      await writeLine(allStream, JSON.stringify(record));

      if (record.isArDriveRelated) {
        ardriveRelatedTransactionCount += 1;
        byWallet[record.walletAddress] = (byWallet[record.walletAddress] || 0) + 1;
        byClassification[record.classification] = (byClassification[record.classification] || 0) + 1;
        byEntityType[record.entityType || '(none)'] = (byEntityType[record.entityType || '(none)'] || 0) + 1;
        if (record.driveId) driveIds.add(record.driveId);
        if (record.driveId && record.drivePrivacy === 'private') privateDriveIds.add(record.driveId);

        await writeLine(ardriveStream, JSON.stringify(record));
        await writeLine(ardriveTsvStream, [
          record.walletAddress,
          record.id,
          record.classification,
          record.entityType,
          record.driveId,
          record.drivePrivacy,
          record.folderId,
          record.parentFolderId,
          record.fileId,
          record.snapshotId,
          record.appName,
          record.contentType,
          record.cipher,
          record.dataSize,
          record.blockHeight,
          record.blockTimestamp,
          record.bundledIn,
        ].map(tsv).join('\t'));

        try {
          const metadata = await fetchMetadataJson(node.id, node);
          if (metadata) {
            decodedPublicMetadataCount += 1;
            await writeLine(metadataStream, JSON.stringify({ txId: node.id, walletAddress: wallet.address, metadata }));
          }
        } catch (error) {
          console.error(`Metadata fetch skipped for ${node.id}: ${error.message}`);
        }
      }
    });
  }

  await Promise.all([
    closeStream(allStream),
    closeStream(ardriveStream),
    closeStream(metadataStream),
    closeStream(ardriveTsvStream),
  ]);
  await fs.copyFile(ardriveTsvPath, path.join(MANIFEST_DIR, 'ARDRIVE_RELATED_TRANSACTIONS.tsv'));
  await fs.chmod(path.join(MANIFEST_DIR, 'ARDRIVE_RELATED_TRANSACTIONS.tsv'), 0o600);

  const summary = {
    verifiedAt: new Date().toISOString(),
    walletCount: wallets.length,
    ownerTransactionCount,
    ardriveRelatedTransactionCount,
    decodedPublicMetadataCount,
    driveCount: driveIds.size,
    privateDriveCount: privateDriveIds.size,
    byWallet,
    byClassification,
    byEntityType,
    outputDirectory: OUT_DIR,
    note: 'Wallet private key material was not printed. Private/encrypted ArDrive metadata is inventoried by tags and transaction IDs; encrypted contents require ArDrive private-drive sync or drive keys to decrypt.',
  };

  await fs.writeFile(path.join(OUT_DIR, 'SUMMARY.json'), JSON.stringify(summary, null, 2) + '\n', { mode: 0o600 });
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
