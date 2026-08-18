#!/usr/bin/env node
/**
 * TNF trajectory retention — append-only run transcripts at the control plane.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = path.resolve(__dirname, '..', '..');
const DIR = path.join(ROOT, 'data/harness/trajectories');

function ensure() {
  fs.mkdirSync(DIR, { recursive: true });
}

function parseArgs(argv) {
  const args = {
    cmd: argv[0] || 'list',
    run: '',
    task: '',
    type: 'note',
    payload: '{}',
    status: 'ok',
    json: false,
  };
  for (let i = 1; i < argv.length; i += 1) {
    const t = argv[i];
    if (t === '--run') args.run = argv[++i] || '';
    else if (t === '--task') args.task = argv[++i] || '';
    else if (t === '--type') args.type = argv[++i] || args.type;
    else if (t === '--payload') args.payload = argv[++i] || '{}';
    else if (t === '--status') args.status = argv[++i] || args.status;
    else if (t === '--json') args.json = true;
  }
  return args;
}

function runPath(runId) {
  return path.join(DIR, `${runId}.jsonl`);
}

function start(args) {
  ensure();
  const runId = args.run || crypto.randomBytes(6).toString('hex');
  const meta = {
    op: 'start',
    runId,
    at: new Date().toISOString(),
    task: args.task || '',
  };
  fs.writeFileSync(runPath(runId), `${JSON.stringify(meta)}\n`);
  return { ok: true, runId, path: path.relative(ROOT, runPath(runId)) };
}

function append(args) {
  if (!args.run) throw new Error('append requires --run');
  ensure();
  const abs = runPath(args.run);
  if (!fs.existsSync(abs)) throw new Error(`unknown run: ${args.run}`);
  let payload;
  try {
    payload = JSON.parse(args.payload);
  } catch {
    payload = { raw: args.payload };
  }
  const row = {
    op: 'event',
    at: new Date().toISOString(),
    type: args.type,
    payload,
  };
  fs.appendFileSync(abs, `${JSON.stringify(row)}\n`);
  return { ok: true, runId: args.run, event: row };
}

function end(args) {
  if (!args.run) throw new Error('end requires --run');
  const abs = runPath(args.run);
  if (!fs.existsSync(abs)) throw new Error(`unknown run: ${args.run}`);
  const row = { op: 'end', at: new Date().toISOString(), status: args.status };
  fs.appendFileSync(abs, `${JSON.stringify(row)}\n`);
  return { ok: true, runId: args.run, status: args.status };
}

function list() {
  ensure();
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.jsonl'));
  const rows = files.map((f) => {
    const abs = path.join(DIR, f);
    const st = fs.statSync(abs);
    const head = fs.readFileSync(abs, 'utf8').split('\n').find(Boolean) || '{}';
    let meta = {};
    try {
      meta = JSON.parse(head);
    } catch {
      meta = {};
    }
    return {
      runId: f.replace(/\.jsonl$/, ''),
      task: meta.task || '',
      bytes: st.size,
      mtime: st.mtime.toISOString(),
    };
  });
  return { ok: true, count: rows.length, runs: rows.sort((a, b) => b.mtime.localeCompare(a.mtime)) };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  let result;
  if (args.cmd === 'start') result = start(args);
  else if (args.cmd === 'append') result = append(args);
  else if (args.cmd === 'end') result = end(args);
  else if (args.cmd === 'list') result = list();
  else throw new Error(`unknown command: ${args.cmd}`);
  console.log(JSON.stringify(result, null, 2));
}

try {
  main();
} catch (err) {
  console.error(`trajectory: ${err.message}`);
  process.exit(1);
}
