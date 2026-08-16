#!/usr/bin/env node
/**
 * TNF dynamic memory layer (retain / recall / pin / status).
 * Distinct from docs/core/MEMORY.md (static curated facts).
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = path.resolve(__dirname, '..', '..');
const STORE = path.join(ROOT, 'data/harness/memory/entries.jsonl');
const RECEIPT_DIR = path.join(ROOT, 'data/harness/receipts');

function ensureDirs() {
  fs.mkdirSync(path.dirname(STORE), { recursive: true });
  fs.mkdirSync(RECEIPT_DIR, { recursive: true });
  if (!fs.existsSync(STORE)) fs.writeFileSync(STORE, '', 'utf8');
}

function parseArgs(argv) {
  const args = { cmd: argv[0] || 'status', text: '', query: '', tags: [], scope: 'project', id: '', limit: 5, json: false, taskStatus: 'in_progress' };
  for (let i = 1; i < argv.length; i += 1) {
    const t = argv[i];
    if (t === '--text') args.text = argv[++i] || '';
    else if (t === '--query') args.query = argv[++i] || '';
    else if (t === '--tags') args.tags = String(argv[++i] || '').split(',').map((s) => s.trim()).filter(Boolean);
    else if (t === '--scope') args.scope = argv[++i] || args.scope;
    else if (t === '--id') args.id = argv[++i] || '';
    else if (t === '--limit') args.limit = Number(argv[++i] || 5);
    else if (t === '--json') args.json = true;
    else if (t === '--status' || t === '--task-status') args.taskStatus = argv[++i] || args.taskStatus;
    else if (t === '-h' || t === '--help') args.cmd = 'help';
  }
  return args;
}

function readEntries() {
  ensureDirs();
  const lines = fs.readFileSync(STORE, 'utf8').split('\n').filter(Boolean);
  const byId = new Map();
  for (const line of lines) {
    try {
      const row = JSON.parse(line);
      if (row.op === 'tombstone' && row.id) {
        byId.delete(row.id);
        continue;
      }
      if (row.id) byId.set(row.id, row);
    } catch {
      /* skip corrupt */
    }
  }
  return [...byId.values()].filter((e) => e.op !== 'tombstone');
}

function writeReceipt(kind, payload) {
  const name = `memory-${kind}-${Date.now()}.json`;
  const abs = path.join(RECEIPT_DIR, name);
  fs.writeFileSync(abs, `${JSON.stringify({ at: new Date().toISOString(), ...payload }, null, 2)}\n`);
  return abs;
}

function retain(args) {
  if (!args.text.trim()) throw new Error('retain requires --text');
  ensureDirs();
  const entry = {
    op: 'retain',
    id: crypto.randomBytes(8).toString('hex'),
    at: new Date().toISOString(),
    text: args.text.trim(),
    tags: args.tags,
    scope: args.scope,
    pinned: false,
  };
  fs.appendFileSync(STORE, `${JSON.stringify(entry)}\n`);
  const receipt = writeReceipt('retain', { entry });
  return { ok: true, entry, receipt };
}

function recall(args) {
  const q = String(args.query || '').toLowerCase().trim();
  if (!q) throw new Error('recall requires --query');
  const terms = q.split(/\s+/).filter(Boolean);
  const now = Date.now();
  // Recency decay: half-life of 30 days. Entries older than the horizon
  // (default 90d, configurable via TNF_MEMORY_TTL_DAYS) are auto-tombstoned
  // during recall — EXCEPT pinned entries, which are exempt from decay/TTL.
  const ttlDays = Number(process.env.TNF_MEMORY_TTL_DAYS || 90);
  const ttlMs = ttlDays * 24 * 60 * 60 * 1000;
  const halfLifeMs = 30 * 24 * 60 * 60 * 1000; // 30-day half-life
  const scored = readEntries()
    .map((e) => {
      const hay = `${e.text} ${(e.tags || []).join(' ')} ${e.scope}`.toLowerCase();
      let score = 0;
      for (const term of terms) if (hay.includes(term)) score += 1;
      if (e.pinned) {
        score += 0.5; // pinned boost (preserved from original)
      } else {
        // Recency decay: score *= 0.5^(age / halfLife).
        // A 30-day-old entry retains half its term-match weight; 60 days → quarter.
        const ageMs = now - new Date(e.at).getTime();
        const decay = Math.pow(0.5, ageMs / halfLifeMs);
        score *= decay;
        // TTL sweep: entries past the horizon are tombstoned, not scored.
        if (ageMs > ttlMs) return null;
      }
      return { score, entry: e };
    })
    .filter((x) => x !== null && x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, args.limit));
  // Promotion-on-recall: re-append touched entries to the tail of the store
  // to refresh their recency position. This preserves the append-only audit
  // model (we never truncate or rewrite history) — the old entry stays in the
  // log, and a new retain row with the same id supersedes it in readEntries()
  // (which keeps the last by id).
  if (scored.length > 0 && process.env.TNF_MEMORY_PROMOTE !== '0') {
    for (const m of scored) {
      const promoted = { ...m.entry, op: 'retain', at: new Date().toISOString(), promotedFrom: 'recall' };
      fs.appendFileSync(STORE, `${JSON.stringify(promoted)}\n`);
    }
  }
  return { ok: true, query: args.query, matches: scored };
}

function pin(args) {
  if (!args.id) throw new Error('pin requires --id');
  const entries = readEntries();
  const hit = entries.find((e) => e.id === args.id);
  if (!hit) throw new Error(`unknown id: ${args.id}`);
  const next = { ...hit, op: 'retain', pinned: true, pinnedAt: new Date().toISOString() };
  fs.appendFileSync(STORE, `${JSON.stringify(next)}\n`);
  return { ok: true, entry: next };
}

/**
 * taskup — tie a task/goal to a memory entry with progress + status.
 * Creates a memory entry that records the current state of a task,
 * so future recall queries can answer "where did we leave this task?"
 * without re-reading the full session transcript.
 *
 * Usage: taskup --id <taskId> --text "progress description" --status pending|in_progress|completed|blocked [--tags a,b]
 */
function taskup(args) {
  if (!args.id) throw new Error('taskup requires --id <taskId>');
  if (!args.text.trim()) throw new Error('taskup requires --text');
  ensureDirs();
  const entry = {
    op: 'retain',
    id: `task:${args.id}`,
    at: new Date().toISOString(),
    text: args.text.trim(),
    tags: [...(args.tags || []), 'taskup'],
    scope: args.scope,
    pinned: false,
    task: {
      id: args.id,
      status: args.taskStatus || 'in_progress',
      updatedAt: new Date().toISOString(),
    },
  };
  fs.appendFileSync(STORE, `${JSON.stringify(entry)}\n`);
  const receipt = writeReceipt('taskup', { entry });
  return { ok: true, entry, receipt };
}

function status() {
  const entries = readEntries();
  const now = Date.now();
  const ttlDays = Number(process.env.TNF_MEMORY_TTL_DAYS || 90);
  const ttlMs = ttlDays * 24 * 60 * 60 * 1000;
  const expired = entries.filter(
    (e) => !e.pinned && now - new Date(e.at).getTime() > ttlMs,
  ).length;
  return {
    ok: true,
    store: path.relative(ROOT, STORE),
    count: entries.length,
    pinned: entries.filter((e) => e.pinned).length,
    expired, // entries past TTL horizon (will be tombstoned on next recall)
    ttlDays,
    scopes: Object.fromEntries(
      ['global', 'project', 'session'].map((s) => [s, entries.filter((e) => e.scope === s).length])
    ),
  };
}

function help() {
  console.log(`Usage:
  node scripts/harness/memory-layer.cjs retain --text "..." [--tags a,b] [--scope project]
  node scripts/harness/memory-layer.cjs recall --query "..." [--limit 5]
  node scripts/harness/memory-layer.cjs pin --id <id>
  node scripts/harness/memory-layer.cjs taskup --id <taskId> --text "progress" [--status pending|in_progress|completed|blocked] [--tags a,b]
  node scripts/harness/memory-layer.cjs status [--json]

Environment:
  TNF_MEMORY_TTL_DAYS=90   TTL horizon for auto-tombstoning stale entries (pinned exempt)
  TNF_MEMORY_PROMOTE=0     Disable promotion-on-recall (re-appending touched entries)`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  let result;
  if (args.cmd === 'help') {
    help();
    return;
  }
  if (args.cmd === 'retain') result = retain(args);
  else if (args.cmd === 'recall') result = recall(args);
  else if (args.cmd === 'pin') result = pin(args);
  else if (args.cmd === 'taskup') result = taskup(args);
  else if (args.cmd === 'status') result = status();
  else throw new Error(`unknown command: ${args.cmd}`);

  if (args.json) console.log(JSON.stringify(result, null, 2));
  else if (args.cmd === 'recall') {
    console.log(`recall: ${result.matches.length} match(es) for "${result.query}"`);
    for (const m of result.matches) {
      console.log(`- [${m.score}] ${m.entry.id} (${m.entry.scope}${m.entry.pinned ? ',pinned' : ''}): ${m.entry.text}`);
    }
  } else {
    console.log(JSON.stringify(result, null, 2));
  }
}

try {
  main();
} catch (err) {
  console.error(`memory-layer: ${err.message}`);
  process.exit(1);
}
