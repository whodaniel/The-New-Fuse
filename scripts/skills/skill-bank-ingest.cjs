#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const args = {
    file: '.agent/skill-bank/resource-registry-import.json',
    pending: '.agent/skill-bank/pending-import.ndjson',
    report: '.agent/skill-bank/ingest-report.json',
    dryRun: false,
    strict: false,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--file' && argv[i + 1]) {
      args.file = argv[i + 1];
      i += 1;
    } else if (a === '--pending' && argv[i + 1]) {
      args.pending = argv[i + 1];
      i += 1;
    } else if (a === '--report' && argv[i + 1]) {
      args.report = argv[i + 1];
      i += 1;
    } else if (a === '--dry-run') {
      args.dryRun = true;
    } else if (a === '--strict') {
      args.strict = true;
    }
  }

  return args;
}

function ensureDir(p) {
  fs.mkdirSync(path.dirname(path.resolve(process.cwd(), p)), { recursive: true });
}

function endpoint() {
  const base =
    process.env.RESOURCE_REGISTRY_API_BASE_URL ||
    process.env.TNF_API_BASE_URL ||
    process.env.API_BASE_URL ||
    'http://localhost:3001';
  return `${String(base).replace(/\/$/, '')}/api/resources`;
}

function buildHeaders() {
  const headers = {
    'Content-Type': 'application/json',
  };

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

  if (bearer) headers.Authorization = `Bearer ${bearer}`;
  if (apiKey) {
    headers['x-api-key'] = apiKey;
    headers['X-API-Key'] = apiKey;
  }

  return headers;
}

function normalizeRow(row) {
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

function appendPending(file, items) {
  if (!items.length) return;
  ensureDir(file);
  const fd = fs.openSync(path.resolve(process.cwd(), file), 'a');
  try {
    for (const item of items) {
      fs.writeSync(fd, `${JSON.stringify(item)}\n`);
    }
  } finally {
    fs.closeSync(fd);
  }
}

async function postRow(url, headers, row) {
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(normalizeRow(row)),
  });
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return {
    ok: res.ok,
    status: res.status,
    body,
  };
}

async function main() {
  const args = parseArgs(process.argv);
  const sourceFile = path.resolve(process.cwd(), args.file);

  if (!fs.existsSync(sourceFile)) {
    console.error(`Import file not found: ${sourceFile}`);
    process.exit(1);
  }

  const payload = JSON.parse(fs.readFileSync(sourceFile, 'utf8'));
  const rows = Array.isArray(payload.rows) ? payload.rows : [];
  const url = endpoint();
  const headers = buildHeaders();

  const summary = {
    at: new Date().toISOString(),
    sourceFile,
    endpoint: url,
    total: rows.length,
    dryRun: args.dryRun,
    posted: 0,
    failed: 0,
    staged: 0,
    errors: [],
  };

  const failedItems = [];

  for (const row of rows) {
    if (args.dryRun) {
      summary.posted += 1;
      continue;
    }

    try {
      const result = await postRow(url, headers, row);
      if (result.ok) {
        summary.posted += 1;
      } else {
        summary.failed += 1;
        failedItems.push({ row, reason: `HTTP ${result.status}`, response: result.body });
      }
    } catch (error) {
      summary.failed += 1;
      failedItems.push({ row, reason: String(error.message || error) });
    }
  }

  if (failedItems.length) {
    appendPending(args.pending, failedItems);
    summary.staged = failedItems.length;
    summary.errors = failedItems.slice(0, 20).map((e) => ({
      name: e.row?.name,
      reason: e.reason,
    }));
  }

  ensureDir(args.report);
  fs.writeFileSync(path.resolve(process.cwd(), args.report), JSON.stringify(summary, null, 2));

  console.log(
    `Skill-bank ingest complete: posted=${summary.posted} failed=${summary.failed} staged=${summary.staged}`
  );
  console.log(`Report: ${path.resolve(process.cwd(), args.report)}`);

  if (args.strict && summary.failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(String(err?.message || err));
  process.exit(1);
});
