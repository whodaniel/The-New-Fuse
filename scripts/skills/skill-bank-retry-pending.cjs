#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const args = {
    pending: '.agent/skill-bank/pending-import.ndjson',
    report: '.agent/skill-bank/retry-report.json',
    strict: false,
  };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--pending' && argv[i + 1]) {
      args.pending = argv[i + 1];
      i += 1;
    } else if (a === '--report' && argv[i + 1]) {
      args.report = argv[i + 1];
      i += 1;
    } else if (a === '--strict') {
      args.strict = true;
    }
  }
  return args;
}

function ensureDir(file) {
  fs.mkdirSync(path.dirname(path.resolve(process.cwd(), file)), { recursive: true });
}

function endpoint() {
  const base =
    process.env.RESOURCE_REGISTRY_API_BASE_URL ||
    process.env.TNF_API_BASE_URL ||
    process.env.API_BASE_URL ||
    'http://localhost:3001';
  return `${String(base).replace(/\/$/, '')}/api/resources`;
}

function headers() {
  const out = { 'Content-Type': 'application/json' };
  const bearer =
    process.env.RESOURCE_REGISTRY_BEARER_TOKEN ||
    process.env.TNF_RESOURCE_REGISTRY_BEARER_TOKEN ||
    process.env.SUPER_ADMIN_TOKEN ||
    '';
  const apiKey =
    process.env.RESOURCE_REGISTRY_API_KEY ||
    process.env.TNF_RESOURCE_REGISTRY_API_KEY ||
    process.env.API_KEY ||
    '';
  if (bearer) out.Authorization = `Bearer ${bearer}`;
  if (apiKey) {
    out['x-api-key'] = apiKey;
    out['X-API-Key'] = apiKey;
  }
  return out;
}

function normalize(row) {
  return {
    name: row.name,
    description: row.description || '',
    category: row.category || 'CLAUDE_SKILL',
    type: row.type || 'MARKDOWN',
    content: row.content || {
      source: row.source || null,
      snapshotPath: row.metadata?.snapshotPath || null,
      description: row.description || '',
    },
    tags: Array.isArray(row.tags) ? row.tags : [],
    keywords: Array.isArray(row.tags) ? row.tags : [],
    version: '1.0.0',
    source: row.source || 'skill-bank',
    visibility: row.visibility || 'AGENTS_ONLY',
    isVerified: true,
    metadata: row.metadata || {},
  };
}

async function post(url, hdrs, row) {
  const res = await fetch(url, {
    method: 'POST',
    headers: hdrs,
    body: JSON.stringify(normalize(row)),
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, text };
}

async function main() {
  const args = parseArgs(process.argv);
  const pendingFile = path.resolve(process.cwd(), args.pending);
  if (!fs.existsSync(pendingFile)) {
    console.log('No pending import file found.');
    return;
  }

  const lines = fs.readFileSync(pendingFile, 'utf8').split('\n').filter(Boolean);
  const entries = lines
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  const url = endpoint();
  const hdrs = headers();

  const summary = {
    at: new Date().toISOString(),
    endpoint: url,
    total: entries.length,
    posted: 0,
    failed: 0,
  };

  const stillPending = [];
  for (const entry of entries) {
    const row = entry.row || entry;
    try {
      const r = await post(url, hdrs, row);
      if (r.ok) {
        summary.posted += 1;
      } else {
        summary.failed += 1;
        stillPending.push({ row, reason: `HTTP ${r.status}`, response: r.text });
      }
    } catch (error) {
      summary.failed += 1;
      stillPending.push({ row, reason: String(error.message || error) });
    }
  }

  ensureDir(args.report);
  fs.writeFileSync(path.resolve(process.cwd(), args.report), JSON.stringify(summary, null, 2));

  if (stillPending.length) {
    const text = `${stillPending.map((e) => JSON.stringify(e)).join('\n')}\n`;
    fs.writeFileSync(pendingFile, text);
  } else {
    fs.unlinkSync(pendingFile);
  }

  console.log(`Pending retry complete: posted=${summary.posted} failed=${summary.failed}`);
  console.log(`Report: ${path.resolve(process.cwd(), args.report)}`);
  if (args.strict && summary.failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(String(err?.message || err));
  process.exit(1);
});
