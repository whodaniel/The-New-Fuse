#!/usr/bin/env node
/**
 * Write inspectable compaction records (UNU: compaction outputs as records).
 *
 * Assimilated extensions (AI 7 competitive synthesis):
 * - HoH Dual State Schema s_t = (A_t, E_t) (Shanghai AI Lab HoH, yeb2ffn8rJk):
 *   separates Artifact State (A_t: code, configs, commits) from Epistemic
 *   Evidence State (E_t: verified tests, unresolved gaps, unverified hypotheses)
 *   so compaction never promotes unverified hypotheses into factual state.
 * - Skill Execution State X_t (Google Agent Skills, kFpLzCVLA20):
 *   preserves { goal, currentStage, unresolvedBlockers, pendingSteps, remainingBudget }
 *   across multi-step skill execution boundaries.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = path.resolve(__dirname, '..', '..');
const DIR = path.join(ROOT, 'data/harness/compaction');

function parseStructuredArg(raw) {
  if (raw === undefined || raw === null || raw === '') return null;
  if (typeof raw === 'object') return raw;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;
  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      // fall through to CSV list
    }
  }
  return trimmed
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseArgs(argv) {
  const args = {
    cmd: argv[0] || 'list',
    run: '',
    stage: 'cheap_clearance',
    summary: '',
    droppedRefs: [],
    artifactState: null,
    evidenceState: null,
    skillState: null,
    hostOpacity: true,
    json: false,
  };
  for (let i = 1; i < argv.length; i += 1) {
    const t = argv[i];
    if (t === '--run') args.run = argv[++i] || '';
    else if (t === '--stage') args.stage = argv[++i] || args.stage;
    else if (t === '--summary') args.summary = argv[++i] || '';
    else if (t === '--dropped')
      args.droppedRefs = String(argv[++i] || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    else if (t === '--artifact-state') args.artifactState = parseStructuredArg(argv[++i]);
    else if (t === '--evidence-state') args.evidenceState = parseStructuredArg(argv[++i]);
    else if (t === '--skill-state') args.skillState = parseStructuredArg(argv[++i]);
    else if (t === '--host-owned') args.hostOpacity = true;
    else if (t === '--tnf-owned') args.hostOpacity = false;
    else if (t === '--json') args.json = true;
  }
  return args;
}

function write(args, customDir = DIR) {
  if (!args || !String(args.summary || '').trim()) throw new Error('write requires --summary');
  fs.mkdirSync(customDir, { recursive: true });
  const id = crypto.randomBytes(6).toString('hex');
  const artifactState = parseStructuredArg(args.artifactState);
  const evidenceState = parseStructuredArg(args.evidenceState);
  const skillState = parseStructuredArg(args.skillState);
  const record = {
    id,
    at: new Date().toISOString(),
    runId: args.run || null,
    stage: args.stage || 'cheap_clearance',
    summary: String(args.summary).trim(),
    droppedRefs: Array.isArray(args.droppedRefs) ? args.droppedRefs : [],
    ...(artifactState ? { artifactState } : {}),
    ...(evidenceState ? { evidenceState } : {}),
    ...(skillState ? { skillState } : {}),
    hostCompactionOpaque: args.hostOpacity !== undefined ? Boolean(args.hostOpacity) : true,
    note:
      args.hostOpacity !== false
        ? 'Host LLM may have compacted beyond this record; TNF records control-plane boundary only.'
        : 'TNF-owned compaction/summarization (HoH dual-state s_t = (A_t, E_t) + Skill State X_t).',
  };
  const abs = path.join(customDir, `${id}.json`);
  fs.writeFileSync(abs, `${JSON.stringify(record, null, 2)}\n`);
  return { ok: true, record, path: path.relative(ROOT, abs) };
}

function list(customDir = DIR) {
  fs.mkdirSync(customDir, { recursive: true });
  const files = fs.readdirSync(customDir).filter((f) => f.endsWith('.json'));
  const records = files.map((f) => {
    try {
      return JSON.parse(fs.readFileSync(path.join(customDir, f), 'utf8'));
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

module.exports = {
  write,
  list,
  parseArgs,
  parseStructuredArg,
};

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error(`compaction-record: ${err.message}`);
    process.exit(1);
  }
}
