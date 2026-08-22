#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_MANIFEST = 'docs/core/FRONTLOAD_MANIFEST.md';

function sha256(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function extractStageSection(text, stage) {
  const lines = String(text || '').split(/\r?\n/);
  const wanted = new RegExp(`^##\\s+Stage\\s+${String(stage).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
  const start = lines.findIndex((line) => wanted.test(line.trim()));
  if (start < 0) return '';
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i += 1) {
    if (/^##\s+/.test(lines[i])) {
      end = i;
      break;
    }
  }
  return lines.slice(start, end).join('\n');
}

function parseStageEntries(text, stage = 'A') {
  const section = extractStageSection(text, stage);
  if (!section) return [];
  const entries = [];
  for (const raw of section.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line.startsWith('|') || /^\|\s*-+/.test(line)) continue;
    const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
    if (!cells.length || cells.some((cell) => /^path$/i.test(cell))) continue;
    const pathCellIndex = cells.findIndex((cell) => /`[^`]+`/.test(cell));
    if (pathCellIndex < 0) continue;
    const match = cells[pathCellIndex].match(/`([^`]+)`/);
    if (!match) continue;
    const relPath = match[1].trim();
    if (!relPath || relPath.includes('{') || relPath.includes('<')) continue;
    const role = cells[cells.length - 1] || '';
    if (!entries.some((entry) => entry.path === relPath)) {
      entries.push({ order: entries.length + 1, path: relPath, role });
    }
  }
  return entries;
}

function hydrateStage({ root = process.cwd(), stage = 'A', consumer = 'unknown' } = {}) {
  const manifestPath = path.join(root, DEFAULT_MANIFEST);
  const observedAt = new Date().toISOString();
  if (!fs.existsSync(manifestPath)) {
    return {
      ok: false,
      stage,
      consumer,
      observedAt,
      manifest: { path: DEFAULT_MANIFEST, status: 'missing', sha256: null },
      entries: [],
    };
  }

  let manifestBody;
  try {
    manifestBody = fs.readFileSync(manifestPath);
  } catch (error) {
    return {
      ok: false,
      stage,
      consumer,
      observedAt,
      manifest: { path: DEFAULT_MANIFEST, status: 'unreadable', sha256: null, error: error.message },
      entries: [],
    };
  }

  const parsed = parseStageEntries(manifestBody.toString('utf8'), stage);
  const entries = parsed.map((entry) => {
    const abs = path.join(root, entry.path);
    if (!fs.existsSync(abs)) return { ...entry, status: 'missing', sha256: null, bytes: 0 };
    try {
      const body = fs.readFileSync(abs);
      return { ...entry, status: 'loaded', sha256: sha256(body), bytes: body.length };
    } catch (error) {
      return { ...entry, status: 'unreadable', sha256: null, bytes: 0, error: error.message };
    }
  });

  return {
    ok: entries.length > 0 && entries.every((entry) => entry.status === 'loaded'),
    stage,
    consumer,
    observedAt,
    manifest: { path: DEFAULT_MANIFEST, status: 'loaded', sha256: sha256(manifestBody), bytes: manifestBody.length },
    entries,
  };
}

function parseArgs(argv) {
  const out = { stage: 'A', json: false, consumer: process.env.TNF_HARNESS_CONSUMER || 'cli' };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--json') out.json = true;
    else if (arg === '--stage' && argv[i + 1]) out.stage = argv[++i];
    else if (arg === '--consumer' && argv[i + 1]) out.consumer = argv[++i];
    else if (arg === '-h' || arg === '--help') {
      console.log('Usage: node scripts/protocols/frontload-manifest.cjs [--stage A] [--consumer id] [--json]');
      process.exit(0);
    }
  }
  return out;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const receipt = hydrateStage({ root: process.cwd(), stage: args.stage, consumer: args.consumer });
  if (args.json) {
    console.log(JSON.stringify(receipt, null, 2));
  } else {
    console.log(`TNF Stage ${receipt.stage} manifest hydration — ${receipt.ok ? 'PASS' : 'FAIL'}`);
    console.log(`- manifest: ${receipt.manifest.path} ${receipt.manifest.sha256 ? receipt.manifest.sha256.slice(0, 12) : receipt.manifest.status}`);
    for (const entry of receipt.entries) {
      console.log(`${entry.status === 'loaded' ? 'OK' : 'FAIL'}: ${entry.path}${entry.sha256 ? ` @ ${entry.sha256.slice(0, 12)}` : ''}`);
    }
  }
  process.exit(receipt.ok ? 0 : 1);
}

if (require.main === module) main();
module.exports = { DEFAULT_MANIFEST, sha256, extractStageSection, parseStageEntries, hydrateStage };
