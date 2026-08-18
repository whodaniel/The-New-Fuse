#!/usr/bin/env node
/**
 * Write inspectable compaction records (UNU: compaction outputs as records).
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = path.resolve(__dirname, '..', '..');
const DIR = path.join(ROOT, 'data/harness/compaction');

function parseArgs(argv) {
  const args = {
    cmd: argv[0] || 'list',
    run: '',
    stage: 'cheap_clearance',
    summary: '',
    droppedRefs: [],
    hostOpacity: true,
    json: false,
  };
  for (let i = 1; i < argv.length; i += 1) {
    const t = argv[i];
    if (t === '--run') args.run = argv[++i] || '';
    else if (t === '--stage') args.stage = argv[++i] || args.stage;
    else if (t === '--summary') args.summary = argv[++i] || '';
    else if (t === '--dropped') args.droppedRefs = String(argv[++i] || '').split(',').map((s) => s.trim()).filter(Boolean);
    else if (t === '--host-owned') args.hostOpacity = true;
    else if (t === '--tnf-owned') args.hostOpacity = false;
    else if (t === '--json') args.json = true;
  }
  return args;
}

function write(args) {
  if (!args.summary.trim()) throw new Error('write requires --summary');
  fs.mkdirSync(DIR, { recursive: true });
  const id = crypto.randomBytes(6).toString('hex');
  const record = {
    id,
    at: new Date().toISOString(),
    runId: args.run || null,
    stage: args.stage,
    summary: args.summary.trim(),
    droppedRefs: args.droppedRefs,
    hostCompactionOpaque: args.hostOpacity,
    note: args.hostOpacity
      ? 'Host LLM may have compacted beyond this record; TNF records control-plane boundary only.'
      : 'TNF-owned compaction/summarization.',
  };
  const abs = path.join(DIR, `${id}.json`);
  fs.writeFileSync(abs, `${JSON.stringify(record, null, 2)}\n`);
  return { ok: true, record, path: path.relative(ROOT, abs) };
}

function list() {
  fs.mkdirSync(DIR, { recursive: true });
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.json'));
  const records = files.map((f) => {
    try {
      return JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
    } catch {
      return { id: f, error: 'parse_failed' };
    }
  });
  return { ok: true, count: records.length, records };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const result = args.cmd === 'write' ? write(args) : list();
  console.log(JSON.stringify(result, null, 2));
}

try {
  main();
} catch (err) {
  console.error(`compaction-record: ${err.message}`);
  process.exit(1);
}
