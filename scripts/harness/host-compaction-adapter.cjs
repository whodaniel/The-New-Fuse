#!/usr/bin/env node
/**
 * Host-compaction adapter — records vendor/host compaction events as TNF artefacts.
 * Does not claim ownership of Cursor/Claude internal transcripts; bridges opacity.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const ADAPTER_DIR = path.join(ROOT, 'data/harness/host-compaction');
const COMPACTION_SCRIPT = path.join(ROOT, 'scripts/harness/compaction-record.cjs');

function parseArgs(argv) {
  const args = {
    cmd: argv[0] || 'list',
    host: 'cursor',
    run: '',
    summary: '',
    transcript: '',
    json: false,
  };
  for (let i = 1; i < argv.length; i += 1) {
    const t = argv[i];
    if (t === '--host') args.host = argv[++i] || args.host;
    else if (t === '--run') args.run = argv[++i] || '';
    else if (t === '--summary') args.summary = argv[++i] || '';
    else if (t === '--transcript') args.transcript = argv[++i] || '';
    else if (t === '--json') args.json = true;
  }
  return args;
}

function ensure() {
  fs.mkdirSync(ADAPTER_DIR, { recursive: true });
}

function writeCompactionRecord(args, extra = {}) {
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
  return { code: r.status ?? 1, parsed, extra };
}

function record(args) {
  ensure();
  const id = crypto.randomBytes(6).toString('hex');
  const meta = {
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
  const abs = path.join(ADAPTER_DIR, `${id}.json`);
  const compaction = writeCompactionRecord(args, { adapterId: id });
  meta.compactionRecord = compaction.parsed.record || null;
  meta.compactionPath = compaction.parsed.path || null;
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
  // Copy only; do not parse provider-specific formats yet.
  fs.copyFileSync(abs, dest);
  const st = fs.statSync(abs);
  args.summary =
    args.summary ||
    `Imported host transcript snapshot (${st.size} bytes) from ${path.basename(abs)} for audit lineage.`;
  const result = record(args);
  result.adapter.transcriptCopy = path.relative(ROOT, dest);
  result.adapter.bytes = st.size;
  fs.writeFileSync(
    path.join(ADAPTER_DIR, `${result.adapter.id}.json`),
    `${JSON.stringify(result.adapter, null, 2)}\n`
  );
  return result;
}

function list() {
  ensure();
  const files = fs.readdirSync(ADAPTER_DIR).filter((f) => f.endsWith('.json') && !f.includes('transcript'));
  const rows = files.map((f) => {
    try {
      return JSON.parse(fs.readFileSync(path.join(ADAPTER_DIR, f), 'utf8'));
    } catch {
      return { id: f, error: 'parse_failed' };
    }
  });
  return { ok: true, count: rows.length, records: rows };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  let result;
  if (args.cmd === 'record') result = record(args);
  else if (args.cmd === 'import') result = importTranscript(args);
  else if (args.cmd === 'list') result = list();
  else throw new Error(`unknown command: ${args.cmd}`);
  console.log(JSON.stringify(result, null, 2));
  if (result.ok === false) process.exit(1);
}

try {
  main();
} catch (err) {
  console.error(`host-compaction-adapter: ${err.message}`);
  process.exit(1);
}
