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

function normalizeBase(value) {
  return String(value || '')
    .trim()
    .replace(/\/+$/, '');
}

function normalizePath(value) {
  const raw = String(value || '').trim();
  if (!raw) return '/';
  return raw.startsWith('/') ? raw : `/${raw}`;
}

function joinUrl(base, routePath) {
  const normalizedBase = normalizeBase(base);
  let normalizedPath = normalizePath(routePath);

  // Prevent accidental /api/api/... when base already ends in /api.
  if (normalizedBase.toLowerCase().endsWith('/api') && normalizedPath.toLowerCase().startsWith('/api/')) {
    normalizedPath = normalizedPath.slice('/api'.length);
  }

  return `${normalizedBase}${normalizedPath}`;
}

function stripApiSuffix(base) {
  return normalizeBase(base).replace(/\/api$/i, '');
}

function uniqueUrls(values) {
  const seen = new Set();
  const out = [];
  for (const value of values) {
    const normalized = normalizeBase(value);
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    out.push(normalized);
  }
  return out;
}

function resolveEndpoints() {
  const baseRaw =
    process.env.RESOURCE_REGISTRY_API_BASE_URL ||
    process.env.TNF_API_BASE_URL ||
    process.env.API_BASE_URL ||
    'http://localhost:3001';
  const path = process.env.RESOURCE_REGISTRY_ENDPOINT_PATH || '/api/resources';
  return `${String(base).replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
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
    process.env.COMMUNITY_API_KEY ||
    '';

  if (bearer) headers.Authorization = `Bearer ${bearer}`;
  if (apiKey) {
    headers['x-api-key'] = apiKey;
    headers['x-community-api-key'] = apiKey;
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

function normalizeMarketplaceRow(row) {
  const tags = Array.isArray(row.tags) ? row.tags : [];
  const genericTags = new Set([
    'skill-bank',
    'project',
    'global',
    'codex',
    'claude',
    'gemini',
    'kilo',
    'openclaw',
    'picoclaw',
    'project-agent',
  ]);
  const usefulTags = tags
    .map((t) => String(t || '').toLowerCase().trim())
    .filter((t) => t && !genericTags.has(t));

  const category = usefulTags[0] || 'automation';
  const categoryHint = String(row.category || '').toUpperCase();
  const sourceHint = String(row.source || '').toLowerCase();
  let kind = 'skill';
  if (categoryHint.includes('WORKFLOW') || sourceHint.includes('/workflow')) kind = 'workflow';
  else if (categoryHint.includes('TEMPLATE')) kind = 'agent_template';
  else if (categoryHint.includes('MODEL')) kind = 'model';
  else if (categoryHint.includes('MCP')) kind = 'mcp_server';
  else if (categoryHint.includes('PROMPT')) kind = 'prompt';

  return {
    name: row.name,
    description: row.description || 'TNF skill-bank import',
    kind,
    category,
    tags: usefulTags.slice(0, 12),
    capabilities: usefulTags.slice(0, 12),
    createdBy: 'skill-bank',
  };
}

function parseResetMs(result) {
  try {
    if (result.body && typeof result.body === 'object' && result.body.resetTime) {
      const val = result.body.resetTime;
      if (typeof val === 'number') return Math.max(0, val - Date.now());
      const parsed = Date.parse(String(val));
      if (!Number.isNaN(parsed)) return Math.max(0, parsed - Date.now());
    }
  } catch {}
  try {
    if (result.resetAtHeader) {
      const parsed = Date.parse(String(result.resetAtHeader));
      if (!Number.isNaN(parsed)) return Math.max(0, parsed - Date.now());
    }
  } catch {}
  return 60000;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeText(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

async function fetchMarketplaceByName(url, headers, name) {
  const q = encodeURIComponent(String(name || ''));
  const res = await fetch(`${url}?q=${q}&limit=200`, {
    method: 'GET',
    headers,
  });
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }
  const items = Array.isArray(body?.items) ? body.items : [];
  return {
    ok: res.ok,
    status: res.status,
    items,
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
    resetAtHeader: res.headers.get('x-ratelimit-reset'),
  };
}

async function postRowMarketplace(url, headers, row) {
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(normalizeMarketplaceRow(row)),
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
    resetAtHeader: res.headers.get('x-ratelimit-reset'),
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
  const base = url.replace(/\/api\/[^/]+(?:\/[^/]+)?$/, '');
  const marketplaceUrl = `${base}/api/marketplace/catalog/submit`;
  const marketplaceCatalogUrl = `${base}/api/marketplace/catalog`;
  const isDirectMarketplace = /\/api\/marketplace\/catalog\/submit$/i.test(url);
  const headers = buildHeaders();
  const dedupeRemote = process.env.SKILL_BANK_DEDUPE_REMOTE !== 'false';
  const remoteLookupCache = new Map();
  const seenLocal = new Set();

  const summary = {
    at: new Date().toISOString(),
    sourceFile,
    endpoint: url,
    endpointCandidates: resourceCandidateUrls,
    marketplaceFallback: marketplaceUrl,
    total: rows.length,
    dryRun: args.dryRun,
    posted: 0,
    skipped: 0,
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

    const nameKey = normalizeText(row.name);
    const descKey = normalizeText(row.description || '');
    const localSig = `${nameKey}::${descKey}`;
    if (seenLocal.has(localSig)) {
      summary.skipped += 1;
      continue;
    }
    seenLocal.add(localSig);

    if (dedupeRemote && row.name) {
      const cacheKey = nameKey;
      let remoteItems = remoteLookupCache.get(cacheKey);
      if (!remoteItems) {
        try {
          const lookup = await fetchMarketplaceByName(marketplaceCatalogUrl, headers, row.name);
          remoteItems = lookup.ok ? lookup.items : [];
        } catch {
          remoteItems = [];
        }
        remoteLookupCache.set(cacheKey, remoteItems);
      }
      const exists = Array.isArray(remoteItems)
        && remoteItems.some(
          (item) =>
            normalizeText(item?.name) === nameKey
            && normalizeText(item?.description || '') === descKey
            && normalizeText(item?.createdBy || '') === 'skill-bank'
        );
      if (exists) {
        summary.skipped += 1;
        continue;
      }
    }

    try {
      let done = false;
      let attempts = 0;
      let lastResult = null;
      while (!done && attempts < 4) {
        attempts += 1;
        let result = isDirectMarketplace
          ? await postRowMarketplace(url, headers, row)
          : await postRow(url, headers, row);
        // Auto-fallback when API doesn't support POST /api/resources.
        if (!isDirectMarketplace && !result.ok && (result.status === 404 || result.status === 405)) {
          result = await postRowMarketplace(marketplaceUrl, headers, row);
        }
        lastResult = result;
        if (result.ok) {
          summary.posted += 1;
          done = true;
          break;
        }
        if (result.status === 429 && attempts < 4) {
          const waitMs = parseResetMs(result) + 1000;
          await sleep(waitMs);
          continue;
        }
        done = true;
      }
      if (!lastResult?.ok) {
        summary.failed += 1;
        failedItems.push({
          row,
          reason: `HTTP ${lastResult?.status || 'unknown'}`,
          response: lastResult?.body || null,
        });
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
      hint: e.hint || undefined,
    }));
  }

  ensureDir(args.report);
  fs.writeFileSync(path.resolve(process.cwd(), args.report), JSON.stringify(summary, null, 2));

  console.log(
    `Skill-bank ingest complete: posted=${summary.posted} skipped=${summary.skipped} failed=${summary.failed} staged=${summary.staged}`
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
