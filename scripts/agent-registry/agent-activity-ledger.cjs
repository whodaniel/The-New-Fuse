#!/usr/bin/env node
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');

const root = process.env.TNF_AGENT_ACTIVITY_DIR
  ? path.resolve(process.env.TNF_AGENT_ACTIVITY_DIR)
  : path.join(os.homedir(), '.tnf', 'agent-activity');
const snapshotsDir = path.join(root, 'snapshots');
const receiptsPath = path.join(root, 'receipts.jsonl');

const SECRET_KEY_RE = /(^|[_-])(password|passwd|secret|token|api[_-]?key|cookie|authorization|refresh[_-]?token|access[_-]?token)($|[_-])/i;

function usage(exitCode = 0) {
  const text = `TNF cross-agent activity ledger\n\n` +
    `Commands:\n` +
    `  upsert-snapshot <file|->\n` +
    `  ingest-receipt <file|->\n` +
    `  orientation [--subject=<ref>] [--workspace=<ref>] [--limit=<n>]\n` +
    `  list-receipts [--subject=<ref>] [--workspace=<ref>] [--platform=<id>] [--limit=<n>]\n` +
    `  status\n\n` +
    `Storage: ${root}\n`;
  (exitCode ? process.stderr : process.stdout).write(text);
  process.exit(exitCode);
}

function ensureDirs() {
  fs.mkdirSync(snapshotsDir, { recursive: true, mode: 0o700 });
  if (!fs.existsSync(receiptsPath)) fs.writeFileSync(receiptsPath, '', { mode: 0o600 });
}

function readStdin() {
  return fs.readFileSync(0, 'utf8');
}

function readInput(file) {
  const raw = file === '-' ? readStdin() : fs.readFileSync(path.resolve(file), 'utf8');
  return JSON.parse(raw);
}

function rejectSecrets(value, trail = '$') {
  if (Array.isArray(value)) {
    value.forEach((item, index) => rejectSecrets(item, `${trail}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (SECRET_KEY_RE.test(key)) {
      throw new Error(`Refusing secret-like field at ${trail}.${key}`);
    }
    rejectSecrets(child, `${trail}.${key}`);
  }
}

function requireString(obj, key) {
  if (typeof obj?.[key] !== 'string' || !obj[key].trim()) {
    throw new Error(`Missing required string: ${key}`);
  }
}

function validateSnapshot(snapshot) {
  ['snapshotId', 'platform', 'instanceRef', 'capturedAt'].forEach((key) => requireString(snapshot, key));
  if (!Array.isArray(snapshot.capabilities)) throw new Error('capabilities must be an array');
  if (!snapshot.provenance || typeof snapshot.provenance !== 'object') throw new Error('provenance is required');
  requireString(snapshot.provenance, 'adapterId');
  rejectSecrets(snapshot);
}

function validateReceipt(receipt) {
  ['receiptId', 'platform', 'instanceRef', 'taskRef', 'startedAt', 'outcome', 'summary'].forEach((key) => requireString(receipt, key));
  if (!receipt.provenance || typeof receipt.provenance !== 'object') throw new Error('provenance is required');
  requireString(receipt.provenance, 'adapterId');
  requireString(receipt.provenance, 'observedAt');
  const allowed = new Set(['succeeded', 'failed', 'cancelled', 'deferred', 'in-progress']);
  if (!allowed.has(receipt.outcome)) throw new Error(`Invalid outcome: ${receipt.outcome}`);
  rejectSecrets(receipt);
}

function safeName(input) {
  return input.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 180);
}

function snapshotFile(snapshot) {
  const key = `${snapshot.platform}--${snapshot.instanceRef}--${snapshot.subjectRef || '_'}--${snapshot.workspaceRef || '_'}`;
  return path.join(snapshotsDir, `${safeName(key)}.json`);
}

function atomicWrite(file, content) {
  const temp = `${file}.${process.pid}.${crypto.randomBytes(6).toString('hex')}.tmp`;
  fs.writeFileSync(temp, content, { mode: 0o600 });
  fs.renameSync(temp, file);
}

function loadReceipts() {
  if (!fs.existsSync(receiptsPath)) return [];
  return fs.readFileSync(receiptsPath, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function loadSnapshots() {
  if (!fs.existsSync(snapshotsDir)) return [];
  return fs.readdirSync(snapshotsDir)
    .filter((name) => name.endsWith('.json'))
    .map((name) => JSON.parse(fs.readFileSync(path.join(snapshotsDir, name), 'utf8')));
}

function parseFlags(args) {
  const flags = {};
  for (const arg of args) {
    const match = arg.match(/^--([^=]+)=(.*)$/);
    if (match) flags[match[1]] = match[2];
  }
  return flags;
}

function matchesScope(item, flags) {
  if (flags.subject && item.subjectRef !== flags.subject) return false;
  if (flags.workspace && item.workspaceRef !== flags.workspace) return false;
  if (flags.platform && item.platform !== flags.platform) return false;
  return true;
}

function sortNewest(a, b) {
  const aTime = Date.parse(a.completedAt || a.provenance?.observedAt || a.capturedAt || a.startedAt || 0);
  const bTime = Date.parse(b.completedAt || b.provenance?.observedAt || b.capturedAt || b.startedAt || 0);
  return bTime - aTime;
}

ensureDirs();
const [command, ...args] = process.argv.slice(2);
if (!command || command === '--help' || command === '-h') usage(0);

if (command === 'upsert-snapshot') {
  if (!args[0]) usage(2);
  const snapshot = readInput(args[0]);
  validateSnapshot(snapshot);
  const file = snapshotFile(snapshot);
  const existing = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
  if (!existing || Date.parse(snapshot.capturedAt) >= Date.parse(existing.capturedAt)) {
    atomicWrite(file, `${JSON.stringify(snapshot, null, 2)}\n`);
  }
  console.log(JSON.stringify({ status: 'ok', file, snapshotId: snapshot.snapshotId }, null, 2));
  process.exit(0);
}

if (command === 'ingest-receipt') {
  if (!args[0]) usage(2);
  const receipt = readInput(args[0]);
  validateReceipt(receipt);
  const receipts = loadReceipts();
  if (receipts.some((item) => item.receiptId === receipt.receiptId)) {
    console.log(JSON.stringify({ status: 'duplicate', receiptId: receipt.receiptId }, null, 2));
    process.exit(0);
  }
  fs.appendFileSync(receiptsPath, `${JSON.stringify(receipt)}\n`, { mode: 0o600 });
  console.log(JSON.stringify({ status: 'inserted', receiptId: receipt.receiptId }, null, 2));
  process.exit(0);
}

if (command === 'list-receipts') {
  const flags = parseFlags(args);
  const limit = Math.max(1, Math.min(500, Number(flags.limit || 50)));
  const receipts = loadReceipts().filter((item) => matchesScope(item, flags)).sort(sortNewest).slice(0, limit);
  console.log(JSON.stringify({ receipts }, null, 2));
  process.exit(0);
}

if (command === 'orientation') {
  const flags = parseFlags(args);
  const limit = Math.max(1, Math.min(100, Number(flags.limit || 10)));
  const snapshots = loadSnapshots().filter((item) => matchesScope(item, flags)).sort(sortNewest);
  const receipts = loadReceipts().filter((item) => matchesScope(item, flags)).sort(sortNewest).slice(0, limit);
  const now = Date.now();
  const orientation = snapshots.map((snapshot) => ({
    platform: snapshot.platform,
    product: snapshot.product,
    instanceRef: snapshot.instanceRef,
    subjectRef: snapshot.subjectRef,
    workspaceRef: snapshot.workspaceRef,
    capturedAt: snapshot.capturedAt,
    stale: snapshot.expiresAt ? Date.parse(snapshot.expiresAt) < now : false,
    enabledCapabilities: (snapshot.capabilities || []).filter((c) => c.status === 'enabled' || c.status === 'available').map((c) => c.id),
    connectedTools: (snapshot.connectors || []).filter((c) => c.status === 'connected').map((c) => c.id || c.displayName),
    schedules: (snapshot.schedules || []).filter((s) => s.status === 'enabled').length,
    activeTasks: (snapshot.activeTaskRefs || []).length
  }));
  console.log(JSON.stringify({
    generatedAt: new Date().toISOString(),
    orientation,
    recentReceipts: receipts.map((receipt) => ({
      receiptId: receipt.receiptId,
      platform: receipt.platform,
      taskRef: receipt.taskRef,
      outcome: receipt.outcome,
      summary: receipt.summary,
      completedAt: receipt.completedAt,
      artifactRefs: receipt.artifactRefs || []
    }))
  }, null, 2));
  process.exit(0);
}

if (command === 'status') {
  const snapshots = loadSnapshots();
  const receipts = loadReceipts();
  console.log(JSON.stringify({
    root,
    snapshots: snapshots.length,
    receipts: receipts.length,
    platforms: [...new Set(snapshots.map((s) => s.platform).concat(receipts.map((r) => r.platform)))].sort()
  }, null, 2));
  process.exit(0);
}

console.error(`Unknown command: ${command}`);
usage(2);
