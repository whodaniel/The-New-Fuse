#!/usr/bin/env node
/**
 * Host-compaction adapter — TNF control-plane boundary over vendor/host compaction.
 *
 * Commands:
 *   record  --host <name> [--run id] [--summary text]
 *   import  --host <name> --transcript <path> [--summary text]
 *   list
 *   status
 *   verify [--strict]
 *   discover [--host cursor|claude|codex]
 */
'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const ADAPTER_DIR = path.join(ROOT, 'data/harness/host-compaction');
const COMPACTION_DIR = path.join(ROOT, 'data/harness/compaction');
const COMPACTION_SCRIPT = path.join(ROOT, 'scripts/harness/compaction-record.cjs');
const RECEIPT_DIR = path.join(ROOT, 'data/harness/receipts');

function parseArgs(argv) {
  const args = {
    cmd: argv[0] || 'status',
    host: 'cursor',
    run: '',
    summary: '',
    transcript: '',
    json: false,
    strict: false,
  };
  for (let i = 1; i < argv.length; i += 1) {
    const t = argv[i];
    if (t === '--host') args.host = argv[++i] || args.host;
    else if (t === '--run') args.run = argv[++i] || '';
    else if (t === '--summary') args.summary = argv[++i] || '';
    else if (t === '--transcript') args.transcript = argv[++i] || '';
    else if (t === '--json') args.json = true;
    else if (t === '--strict') args.strict = true;
  }
  return args;
}

function ensure() {
  fs.mkdirSync(ADAPTER_DIR, { recursive: true });
  fs.mkdirSync(COMPACTION_DIR, { recursive: true });
}

function sha256File(abs) {
  try {
    return crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex');
  } catch {
    return null;
  }
}

function writeCompactionRecord(args) {
  const summary =
    args.summary ||
    `Host ${args.host} compaction boundary recorded by TNF adapter (vendor transcript remains opaque).`;
  const r = spawnSync(
    process.execPath,
    [
      COMPACTION_SCRIPT,
      'write',
      '--stage',
      'host_adapter',
      '--summary',
      summary,
      ...(args.run ? ['--run', args.run] : []),
      '--host-owned',
    ],
    { cwd: ROOT, encoding: 'utf8' }
  );
  let parsed = {};
  try {
    parsed = JSON.parse(r.stdout || '{}');
  } catch {
    parsed = { raw: r.stdout };
  }
  return { code: r.status ?? 1, parsed };
}

function record(args) {
  ensure();
  const id = crypto.randomBytes(6).toString('hex');
  const meta = {
    spec: 'tnf/host-compaction-adapter/0.1',
    id,
    at: new Date().toISOString(),
    host: args.host,
    runId: args.run || null,
    summary:
      args.summary ||
      `Recorded host compaction event for ${args.host} without full transcript export.`,
    opacity: 'host_owned',
    note: 'TNF retains adapter receipt + compaction-record. Full host transcript export remains optional.',
  };
  const compaction = writeCompactionRecord(args);
  meta.compactionRecord = compaction.parsed.record || null;
  meta.compactionPath = compaction.parsed.path || null;
  const abs = path.join(ADAPTER_DIR, `${id}.json`);
  fs.writeFileSync(abs, `${JSON.stringify(meta, null, 2)}\n`);
  return { ok: compaction.code === 0, adapter: meta, path: path.relative(ROOT, abs) };
}

function importTranscript(args) {
  if (!args.transcript) throw new Error('import requires --transcript <path>');
  const abs = path.isAbsolute(args.transcript)
    ? args.transcript
    : path.join(ROOT, args.transcript);
  if (!fs.existsSync(abs)) throw new Error(`transcript not found: ${abs}`);
  ensure();
  const id = crypto.randomBytes(6).toString('hex');
  const dest = path.join(ADAPTER_DIR, `${id}.transcript-copy.jsonl`);
  fs.copyFileSync(abs, dest);
  const st = fs.statSync(abs);
  const hash = sha256File(abs);
  args.summary =
    args.summary ||
    `Imported host transcript snapshot (${st.size} bytes, sha256=${String(hash).slice(0, 12)}…) from ${path.basename(abs)} for audit lineage.`;
  const result = record(args);
  result.adapter.transcriptCopy = path.relative(ROOT, dest);
  result.adapter.transcriptSha256 = hash;
  result.adapter.bytes = st.size;
  result.adapter.sourcePath = abs;
  fs.writeFileSync(
    path.join(ADAPTER_DIR, `${result.adapter.id}.json`),
    `${JSON.stringify(result.adapter, null, 2)}\n`
  );
  return result;
}

function loadAdapters() {
  ensure();
  const files = fs
    .readdirSync(ADAPTER_DIR)
    .filter((f) => f.endsWith('.json') && !f.includes('transcript'));
  return files.map((f) => {
    const abs = path.join(ADAPTER_DIR, f);
    try {
      const row = JSON.parse(fs.readFileSync(abs, 'utf8'));
      row._file = f;
      return row;
    } catch {
      return { id: f, error: 'parse_failed', _file: f };
    }
  });
}

function list() {
  const rows = loadAdapters();
  return { ok: true, count: rows.length, records: rows };
}

function status() {
  const rows = loadAdapters().filter((r) => !r.error);
  const byHost = {};
  let withTranscript = 0;
  let linkedCompaction = 0;
  for (const r of rows) {
    byHost[r.host || 'unknown'] = (byHost[r.host || 'unknown'] || 0) + 1;
    if (r.transcriptCopy) withTranscript += 1;
    if (r.compactionPath || r.compactionRecord) linkedCompaction += 1;
  }
  const compactionFiles = fs.existsSync(COMPACTION_DIR)
    ? fs.readdirSync(COMPACTION_DIR).filter((f) => f.endsWith('.json')).length
    : 0;
  return {
    ok: true,
    adapters: rows.length,
    byHost,
    withTranscript,
    linkedCompaction,
    compactionRecords: compactionFiles,
    dirs: {
      adapters: path.relative(ROOT, ADAPTER_DIR),
      compaction: path.relative(ROOT, COMPACTION_DIR),
    },
  };
}

function verify(args) {
  const rows = loadAdapters();
  const issues = [];
  let checked = 0;
  for (const r of rows) {
    checked += 1;
    if (r.error) {
      issues.push(`${r._file}: parse_failed`);
      continue;
    }
    if (!r.id || !r.at || !r.host) issues.push(`${r._file}: missing id/at/host`);
    if (r.compactionPath) {
      const abs = path.join(ROOT, r.compactionPath);
      if (!fs.existsSync(abs)) issues.push(`${r.id}: missing compactionPath ${r.compactionPath}`);
    } else if (!r.compactionRecord) {
      issues.push(`${r.id}: no linked compaction record`);
    }
    if (r.transcriptCopy) {
      const tabs = path.join(ROOT, r.transcriptCopy);
      if (!fs.existsSync(tabs)) issues.push(`${r.id}: missing transcriptCopy`);
      else if (r.transcriptSha256) {
        const live = sha256File(tabs);
        if (live && live !== r.transcriptSha256) {
          issues.push(`${r.id}: transcript sha256 drift`);
        }
      }
    }
  }
  const ok = args.strict ? issues.length === 0 && checked > 0 : issues.length === 0;
  const payload = {
    ok: args.strict ? checked > 0 && issues.length === 0 : issues.length === 0,
    checked,
    issues: issues.slice(0, 40),
    strict: Boolean(args.strict),
    note:
      checked === 0
        ? 'No adapter receipts yet — run: host-compaction record --host cursor'
        : undefined,
  };
  if (args.strict && checked === 0) payload.ok = false;
  fs.mkdirSync(RECEIPT_DIR, { recursive: true });
  const receipt = path.join(RECEIPT_DIR, `host-compaction-verify-${Date.now()}.json`);
  fs.writeFileSync(receipt, `${JSON.stringify(payload, null, 2)}\n`);
  payload.receipt = path.relative(ROOT, receipt);
  return payload;
}

function discover(args) {
  const home = os.homedir();
  const candidates = [];
  const pushIf = (host, p, kind) => {
    if (fs.existsSync(p)) candidates.push({ host, path: p, kind, present: true });
    else candidates.push({ host, path: p, kind, present: false });
  };

  // Best-effort known surfaces — presence only; never mutate host state.
  pushIf('cursor', path.join(home, '.cursor'), 'dir');
  pushIf('cursor', path.join(home, '.cursor', 'projects'), 'dir');
  pushIf('claude', path.join(home, '.claude'), 'dir');
  pushIf('claude', path.join(home, 'Library', 'Application Support', 'Claude'), 'dir');
  pushIf('codex', path.join(home, '.codex'), 'dir');
  pushIf('codex', path.join(home, '.codex', 'sessions'), 'dir');

  const filtered = args.host
    ? candidates.filter((c) => c.host === args.host || args.cmd === 'discover')
    : candidates;
  return {
    ok: true,
    hostFilter: args.host || null,
    candidates: filtered,
    guidance:
      'Use import --transcript <export> after the host exports a transcript. TNF does not scrape private host DBs.',
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  let result;
  if (args.cmd === 'record') result = record(args);
  else if (args.cmd === 'import') result = importTranscript(args);
  else if (args.cmd === 'list') result = list();
  else if (args.cmd === 'status') result = status();
  else if (args.cmd === 'verify') result = verify(args);
  else if (args.cmd === 'discover') result = discover(args);
  else throw new Error(`unknown command: ${args.cmd} (record|import|list|status|verify|discover)`);

  console.log(JSON.stringify(result, null, 2));
  if (result.ok === false) process.exit(1);
}

module.exports = { record, importTranscript, list, status, verify, discover };

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error(`host-compaction-adapter: ${err.message}`);
    process.exit(1);
  }
}
