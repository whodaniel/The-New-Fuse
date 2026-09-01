#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const DEFAULT_CONFIG = path.resolve(__dirname, '..', '..', 'data', 'harness', 'agent-resource-fabric.json');
const DEFAULT_MAX_BYTES = 10 * 1024 * 1024;
const SECRET_BASENAME = /^(?:\.env(?:\..*)?|credentials?(?:\..*)?|tokens?(?:\..*)?|cookies?(?:\..*)?|auth(?:entication)?(?:\..*)?|refresh[_-]?token(?:\..*)?|keychain(?:\..*)?)$/i;
const SKIP_DIRS = new Set(['node_modules', '.git', 'cache', 'caches', 'tmp', 'temp']);

function sha256Bytes(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function expandHome(input, home = os.homedir()) {
  const raw = String(input || '');
  if (raw === '~') return home;
  if (raw.startsWith('~/')) return path.join(home, raw.slice(2));
  return raw;
}

function stableUnique(values) {
  return [...new Set(values.filter(Boolean))].sort();
}

function loadConfig(configPath = DEFAULT_CONFIG) {
  const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  if (!parsed || parsed.spec !== 'tnf/agent-resource-fabric/0.1') {
    throw new Error(`Unsupported agent resource fabric config: ${configPath}`);
  }
  if (!Array.isArray(parsed.hosts)) throw new Error('agent-resource-fabric hosts must be an array');
  return parsed;
}

function classifyEligibility(surface, sourcePath, stat) {
  const basename = path.basename(sourcePath);
  const sensitivity = surface.sensitivity || 'internal';
  const centralization = surface.centralization || 'host-local';
  const mutability = surface.mutability || 'unknown';
  const stateful = centralization === 'state-export' || surface.resourceKind === 'stateful-memory';
  const secret = sensitivity === 'secret' || sensitivity === 'restricted-secret' || SECRET_BASENAME.test(basename);
  const sizeOk = stat.size <= (surface.maxBytes || DEFAULT_MAX_BYTES);
  const eligible = !stateful && !secret && sizeOk && centralization === 'shared-copy' && ['read-only', 'read-mostly'].includes(mutability);
  const reasons = [];
  if (stateful) reasons.push('stateful-export-policy');
  if (secret) reasons.push('secret-excluded');
  if (!sizeOk) reasons.push('oversize');
  if (centralization !== 'shared-copy') reasons.push(`centralization=${centralization}`);
  if (!['read-only', 'read-mostly'].includes(mutability)) reasons.push(`mutability=${mutability}`);
  return { eligible, secret, stateful, sizeOk, reasons };
}

function extensionAllowed(file, surface) {
  const extensions = surface.includeExtensions;
  if (!Array.isArray(extensions) || extensions.length === 0) return true;
  return extensions.includes(path.extname(file).toLowerCase());
}

function nameAllowed(file, surface) {
  const names = surface.includeNames;
  if (!Array.isArray(names) || names.length === 0) return true;
  return names.includes(path.basename(file));
}

function walkDirectory(root, surface, depth = 0, rows = []) {
  const maxDepth = Number.isInteger(surface.maxDepth) ? surface.maxDepth : 6;
  if (depth > maxDepth) return rows;
  let entries = [];
  try { entries = fs.readdirSync(root, { withFileTypes: true }); } catch { return rows; }
  for (const entry of entries) {
    if (entry.name.startsWith('.') && !surface.includeHidden) continue;
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name.toLowerCase())) continue;
      walkDirectory(full, surface, depth + 1, rows);
    } else if (entry.isFile()) {
      if (!extensionAllowed(full, surface) || !nameAllowed(full, surface)) continue;
      rows.push(full);
    } else if (entry.isSymbolicLink()) {
      rows.push(full);
    }
  }
  return rows;
}

function scanSurface(host, surface, opts = {}) {
  const home = opts.home || os.homedir();
  const resolved = expandHome(surface.path, home);
  if (!fs.existsSync(resolved)) {
    return [{
      hostId: host.id,
      hostRuntime: host.runtime,
      surfaceId: surface.id,
      configuredPath: surface.path,
      sourcePath: resolved,
      resourceKind: surface.resourceKind || 'unknown',
      state: 'absent',
      eligible: false,
      reasons: ['surface-absent'],
      consumerTags: surface.consumerTags || [host.id],
      redirectStrategy: surface.redirectStrategy || 'observe',
      redirectVerified: Boolean(surface.redirectVerified),
    }];
  }

  const top = fs.lstatSync(resolved);
  const paths = top.isDirectory() ? walkDirectory(resolved, surface) : [resolved];
  if (paths.length === 0 && top.isDirectory()) {
    return [{
      hostId: host.id,
      hostRuntime: host.runtime,
      surfaceId: surface.id,
      configuredPath: surface.path,
      sourcePath: resolved,
      resourceKind: surface.resourceKind || 'unknown',
      state: 'empty',
      eligible: false,
      reasons: ['surface-empty'],
      consumerTags: surface.consumerTags || [host.id],
      redirectStrategy: surface.redirectStrategy || 'observe',
      redirectVerified: Boolean(surface.redirectVerified),
    }];
  }

  return paths.map((file) => {
    const stat = fs.lstatSync(file);
    const base = {
      hostId: host.id,
      hostRuntime: host.runtime,
      surfaceId: surface.id,
      configuredPath: surface.path,
      sourcePath: file,
      resourceKind: surface.resourceKind || 'unknown',
      publisher: surface.publisher || 'unknown',
      sensitivity: surface.sensitivity || 'internal',
      mutability: surface.mutability || 'unknown',
      centralization: surface.centralization || 'host-local',
      consumerTags: surface.consumerTags || [host.id],
      redirectStrategy: surface.redirectStrategy || 'observe',
      redirectVerified: Boolean(surface.redirectVerified),
      statePolicy: surface.statePolicy || null,
    };
    if (stat.isSymbolicLink()) {
      return { ...base, state: 'symlink', eligible: false, reasons: ['already-linked'], linkTarget: fs.readlinkSync(file), size: 0 };
    }
    if (!stat.isFile()) return { ...base, state: 'unsupported', eligible: false, reasons: ['not-regular-file'], size: 0 };
    const policy = classifyEligibility(surface, file, stat);
    let hash = null;
    if (!policy.secret && policy.sizeOk) {
      hash = sha256Bytes(fs.readFileSync(file));
    }
    return {
      ...base,
      state: 'file',
      size: stat.size,
      mtimeMs: stat.mtimeMs,
      sha256: hash,
      eligible: policy.eligible,
      reasons: policy.reasons,
      secretExcluded: policy.secret,
      statefulExcluded: policy.stateful,
    };
  });
}

function scanInventory(config, opts = {}) {
  const hostFilter = opts.hostId ? new Set(String(opts.hostId).split(',').map((x) => x.trim()).filter(Boolean)) : null;
  const rows = [];
  for (const host of config.hosts) {
    if (hostFilter && !hostFilter.has(host.id)) continue;
    if (!Array.isArray(host.surfaces) || host.surfaces.length === 0) {
      rows.push({
        hostId: host.id,
        hostRuntime: host.runtime,
        state: host.discoveryState || 'no-surfaces',
        eligible: false,
        reasons: ['no-resource-surfaces'],
        consumerTags: [host.id],
      });
      continue;
    }
    for (const surface of host.surfaces) rows.push(...scanSurface(host, surface, opts));
  }
  const eligibleRows = rows.filter((r) => r.state === 'file' && r.eligible && r.sha256);
  const byHash = new Map();
  for (const row of eligibleRows) {
    const group = byHash.get(row.sha256) || [];
    group.push(row);
    byHash.set(row.sha256, group);
  }
  const duplicates = [];
  let reclaimableBytes = 0;
  for (const [hash, group] of byHash.entries()) {
    if (group.length < 2) continue;
    const canonicalSize = group[0].size || 0;
    const duplicateBytes = group.slice(1).reduce((sum, row) => sum + (row.size || 0), 0);
    reclaimableBytes += duplicateBytes;
    duplicates.push({
      sha256: hash,
      size: canonicalSize,
      copies: group.length,
      duplicateBytes,
      hosts: stableUnique(group.map((r) => r.hostId)),
      paths: stableUnique(group.map((r) => r.sourcePath)),
    });
  }
  const totalBytes = rows.filter((r) => r.state === 'file').reduce((sum, r) => sum + (r.size || 0), 0);
  return {
    spec: 'tnf/agent-resource-scan/0.1',
    observedAt: new Date().toISOString(),
    rows,
    summary: {
      hosts: stableUnique(rows.map((r) => r.hostId)).length,
      files: rows.filter((r) => r.state === 'file').length,
      eligibleFiles: eligibleRows.length,
      uniqueEligibleObjects: byHash.size,
      duplicateGroups: duplicates.length,
      totalBytes,
      reclaimableBytes,
      secretExcluded: rows.filter((r) => r.secretExcluded).length,
      statefulExcluded: rows.filter((r) => r.statefulExcluded).length,
    },
    duplicates,
  };
}

function resolveFabricPaths(config, opts = {}) {
  const home = opts.home || os.homedir();
  const root = path.resolve(expandHome(opts.root || process.env.TNF_AGENT_RESOURCE_ROOT || config.centralRoot, home));
  return {
    root,
    objects: path.join(root, config.objectStore || 'objects/sha256'),
    index: path.join(root, config.indexPath || 'index/resources.json'),
    receipts: path.join(root, config.receiptPath || 'receipts'),
    backups: path.join(root, config.backupPath || 'backups'),
  };
}

function objectPath(paths, hash) {
  return path.join(paths.objects, hash.slice(0, 2), hash);
}

function ensurePrivateDir(dir) {
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  try { fs.chmodSync(dir, 0o700); } catch {}
}

function readIndex(paths) {
  try { return JSON.parse(fs.readFileSync(paths.index, 'utf8')); }
  catch { return { spec: 'tnf/agent-resource-index/0.1', updatedAt: null, objects: {} }; }
}

function writeIndex(paths, index) {
  ensurePrivateDir(path.dirname(paths.index));
  index.updatedAt = new Date().toISOString();
  fs.writeFileSync(paths.index, `${JSON.stringify(index, null, 2)}\n`, { mode: 0o600 });
  try { fs.chmodSync(paths.index, 0o600); } catch {}
}

function writeReceipt(paths, operation, payload) {
  ensurePrivateDir(paths.receipts);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const file = path.join(paths.receipts, `${stamp}.${operation}.json`);
  const receipt = { spec: 'tnf/agent-resource-receipt/0.1', operation, at: new Date().toISOString(), ...payload };
  fs.writeFileSync(file, `${JSON.stringify(receipt, null, 2)}\n`, { mode: 0o600 });
  return file;
}

function importInventory(config, scan, opts = {}) {
  const paths = resolveFabricPaths(config, opts);
  ensurePrivateDir(paths.root);
  ensurePrivateDir(paths.objects);
  const index = readIndex(paths);
  let createdObjects = 0;
  let reusedObjects = 0;
  let importedSources = 0;

  for (const row of scan.rows.filter((r) => r.state === 'file' && r.eligible && r.sha256)) {
    const obj = objectPath(paths, row.sha256);
    if (!fs.existsSync(obj)) {
      ensurePrivateDir(path.dirname(obj));
      fs.copyFileSync(row.sourcePath, obj);
      try { fs.chmodSync(obj, 0o444); } catch {}
      const verified = sha256Bytes(fs.readFileSync(obj));
      if (verified !== row.sha256) {
        try { fs.unlinkSync(obj); } catch {}
        throw new Error(`Hash verification failed while importing ${row.sourcePath}`);
      }
      createdObjects += 1;
    } else {
      const existingHash = sha256Bytes(fs.readFileSync(obj));
      if (existingHash !== row.sha256) throw new Error(`Object-store corruption at ${obj}`);
      reusedObjects += 1;
    }
    const current = index.objects[row.sha256] || {
      size: row.size,
      resourceKinds: [],
      publishers: [],
      sourceHosts: [],
      sourcePaths: [],
      consumerTags: [],
      objectPath: path.relative(paths.root, obj),
    };
    current.resourceKinds = stableUnique([...current.resourceKinds, row.resourceKind]);
    current.publishers = stableUnique([...current.publishers, row.publisher]);
    current.sourceHosts = stableUnique([...current.sourceHosts, row.hostId]);
    current.sourcePaths = stableUnique([...current.sourcePaths, row.sourcePath]);
    current.consumerTags = stableUnique([...current.consumerTags, ...(row.consumerTags || [])]);
    current.lastObservedAt = scan.observedAt;
    index.objects[row.sha256] = current;
    importedSources += 1;
  }
  writeIndex(paths, index);
  const receiptPath = writeReceipt(paths, 'import', {
    createdObjects,
    reusedObjects,
    importedSources,
    objectCount: Object.keys(index.objects).length,
    reclaimableBytesObserved: scan.summary.reclaimableBytes,
  });
  return { ok: true, paths, createdObjects, reusedObjects, importedSources, objectCount: Object.keys(index.objects).length, receiptPath };
}

function planConvergence(config, scan, opts = {}) {
  const paths = resolveFabricPaths(config, opts);
  const candidates = scan.rows.filter((row) => row.state === 'file' && row.eligible && row.sha256).map((row) => ({
    hostId: row.hostId,
    surfaceId: row.surfaceId,
    sourcePath: row.sourcePath,
    sha256: row.sha256,
    objectPath: objectPath(paths, row.sha256),
    redirectStrategy: row.redirectStrategy,
    redirectVerified: row.redirectVerified,
    action: row.redirectVerified && ['symlink'].includes(row.redirectStrategy) ? 'redirect-eligible' : 'import-only',
    reason: row.redirectVerified ? null : 'redirect-not-verified-for-host-surface',
  }));
  return {
    spec: 'tnf/agent-resource-plan/0.1',
    at: new Date().toISOString(),
    root: paths.root,
    duplicateGroups: scan.duplicates,
    reclaimableBytes: scan.summary.reclaimableBytes,
    candidates,
    stateful: scan.rows.filter((r) => r.statefulExcluded).map((r) => ({ hostId: r.hostId, surfaceId: r.surfaceId, sourcePath: r.sourcePath, statePolicy: r.statePolicy || 'adapter-required' })),
    excludedSecrets: scan.rows.filter((r) => r.secretExcluded).map((r) => ({ hostId: r.hostId, surfaceId: r.surfaceId, sourcePath: r.sourcePath })),
  };
}

function backupPathFor(paths, row) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const key = sha256Bytes(Buffer.from(row.sourcePath)).slice(0, 12);
  return path.join(paths.backups, row.hostId, stamp, `${path.basename(row.sourcePath)}.${key}.bak`);
}

function redirectRow(config, row, opts = {}) {
  if (!row.redirectVerified) throw new Error(`Redirect not verified for ${row.hostId}/${row.surfaceId}`);
  if (row.redirectStrategy !== 'symlink') throw new Error(`Unsupported verified redirect strategy: ${row.redirectStrategy}`);
  if (!row.eligible || !row.sha256) throw new Error(`Resource is not eligible for redirect: ${row.sourcePath}`);
  const paths = resolveFabricPaths(config, opts);
  const obj = objectPath(paths, row.sha256);
  if (!fs.existsSync(obj)) throw new Error(`Central object missing; import first: ${row.sha256}`);
  const objectHash = sha256Bytes(fs.readFileSync(obj));
  if (objectHash !== row.sha256) throw new Error(`Central object hash mismatch: ${obj}`);
  const sourceStat = fs.lstatSync(row.sourcePath);
  if (!sourceStat.isFile()) throw new Error(`Source must be a regular file before redirect: ${row.sourcePath}`);
  const sourceHash = sha256Bytes(fs.readFileSync(row.sourcePath));
  if (sourceHash !== row.sha256) throw new Error(`Source changed since scan: ${row.sourcePath}`);

  const backup = backupPathFor(paths, row);
  ensurePrivateDir(path.dirname(backup));
  fs.copyFileSync(row.sourcePath, backup);
  try { fs.chmodSync(backup, 0o600); } catch {}

  let linked = false;
  try {
    fs.unlinkSync(row.sourcePath);
    fs.symlinkSync(obj, row.sourcePath);
    linked = true;
    const linkHash = sha256Bytes(fs.readFileSync(row.sourcePath));
    if (linkHash !== row.sha256) throw new Error(`Post-redirect verification failed for ${row.sourcePath}`);
    return { ok: true, sourcePath: row.sourcePath, objectPath: obj, backupPath: backup, strategy: 'symlink' };
  } catch (error) {
    try {
      if (linked || fs.existsSync(row.sourcePath)) fs.unlinkSync(row.sourcePath);
      fs.copyFileSync(backup, row.sourcePath);
    } catch {}
    throw error;
  }
}

function redirectInventory(config, scan, opts = {}) {
  if (!opts.apply || !opts.confirm) throw new Error('Redirect requires --apply and --confirm-resource-redirect');
  const results = [];
  for (const row of scan.rows.filter((r) => r.state === 'file' && r.eligible && r.redirectVerified)) {
    results.push(redirectRow(config, row, opts));
  }
  const paths = resolveFabricPaths(config, opts);
  const receiptPath = writeReceipt(paths, 'redirect', { redirected: results.length, results });
  return { ok: true, redirected: results.length, results, receiptPath };
}

function verifyFabric(config, opts = {}) {
  const paths = resolveFabricPaths(config, opts);
  const index = readIndex(paths);
  const failures = [];
  let verified = 0;
  for (const [hash, meta] of Object.entries(index.objects || {})) {
    const obj = path.join(paths.root, meta.objectPath || path.relative(paths.root, objectPath(paths, hash)));
    if (!fs.existsSync(obj)) { failures.push({ hash, reason: 'missing-object', path: obj }); continue; }
    const actual = sha256Bytes(fs.readFileSync(obj));
    if (actual !== hash) failures.push({ hash, reason: 'hash-mismatch', path: obj, actual });
    else verified += 1;
  }
  return { ok: failures.length === 0, verified, failures, root: paths.root };
}

function parseArgs(argv) {
  const command = argv[0] || 'scan';
  const opts = { command, json: argv.includes('--json'), apply: argv.includes('--apply'), confirm: argv.includes('--confirm-resource-redirect') };
  for (let i = 1; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--config' && argv[i + 1]) opts.configPath = argv[++i];
    else if (arg === '--root' && argv[i + 1]) opts.root = argv[++i];
    else if (arg === '--home' && argv[i + 1]) opts.home = argv[++i];
    else if (arg === '--host' && argv[i + 1]) opts.hostId = argv[++i];
  }
  return opts;
}

function printHuman(command, payload) {
  if (command === 'scan') {
    console.log('TNF Agent Resource Fabric scan');
    console.log(`- files: ${payload.summary.files}`);
    console.log(`- eligible: ${payload.summary.eligibleFiles}`);
    console.log(`- unique eligible objects: ${payload.summary.uniqueEligibleObjects}`);
    console.log(`- duplicate groups: ${payload.summary.duplicateGroups}`);
    console.log(`- estimated reclaimable: ${payload.summary.reclaimableBytes} bytes`);
    console.log(`- secret exclusions: ${payload.summary.secretExcluded}`);
    console.log(`- stateful exclusions: ${payload.summary.statefulExcluded}`);
  } else if (command === 'plan') {
    console.log('TNF Agent Resource Fabric plan');
    console.log(`- root: ${payload.root}`);
    console.log(`- candidates: ${payload.candidates.length}`);
    console.log(`- redirect-eligible: ${payload.candidates.filter((x) => x.action === 'redirect-eligible').length}`);
    console.log(`- reclaimable observed: ${payload.reclaimableBytes} bytes`);
  } else {
    console.log(JSON.stringify(payload, null, 2));
  }
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const config = loadConfig(opts.configPath || DEFAULT_CONFIG);
  let payload;
  if (opts.command === 'scan') payload = scanInventory(config, opts);
  else if (opts.command === 'plan') payload = planConvergence(config, scanInventory(config, opts), opts);
  else if (opts.command === 'import') payload = importInventory(config, scanInventory(config, opts), opts);
  else if (opts.command === 'redirect') payload = redirectInventory(config, scanInventory(config, opts), opts);
  else if (opts.command === 'verify') payload = verifyFabric(config, opts);
  else throw new Error(`Unknown command: ${opts.command}`);
  if (opts.json) console.log(JSON.stringify(payload, null, 2));
  else printHuman(opts.command, payload);
  if (payload && payload.ok === false) process.exit(1);
}

if (require.main === module) {
  try { main(); } catch (error) { console.error(`agent-resource-converge: ${error.message}`); process.exit(1); }
}

module.exports = {
  sha256Bytes,
  expandHome,
  classifyEligibility,
  scanSurface,
  scanInventory,
  resolveFabricPaths,
  objectPath,
  importInventory,
  planConvergence,
  redirectRow,
  redirectInventory,
  verifyFabric,
  loadConfig,
};
