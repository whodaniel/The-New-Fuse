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
    process.env.COMMUNITY_API_KEY ||
    '';
  if (bearer) out.Authorization = `Bearer ${bearer}`;
  if (apiKey) {
    out['x-api-key'] = apiKey;
    out['x-community-api-key'] = apiKey;
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

function normalizeMarketplace(row) {
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

function normalizeText(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

async function fetchMarketplaceByName(url, hdrs, name) {
  const q = encodeURIComponent(String(name || ''));
  const res = await fetch(`${url}?q=${q}&limit=200`, {
    method: 'GET',
    headers: hdrs,
  });
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }
  return {
    ok: res.ok,
    status: res.status,
    items: Array.isArray(body?.items) ? body.items : [],
  };
}

async function post(url, hdrs, row) {
  const res = await fetch(url, {
    method: 'POST',
    headers: hdrs,
    body: JSON.stringify(normalize(row)),
  });
  const text = await res.text();
  let body = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {}
  return { ok: res.ok, status: res.status, body, resetAtHeader: res.headers.get('x-ratelimit-reset') };
}

async function postMarketplace(url, hdrs, row) {
  const res = await fetch(url, {
    method: 'POST',
    headers: hdrs,
    body: JSON.stringify(normalizeMarketplace(row)),
  });
  const text = await res.text();
  let body = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {}
  return { ok: res.ok, status: res.status, body, resetAtHeader: res.headers.get('x-ratelimit-reset') };
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
  const base = url.replace(/\/api\/[^/]+(?:\/[^/]+)?$/, '');
  const marketplaceUrl = `${base}/api/marketplace/catalog/submit`;
  const marketplaceCatalogUrl = `${base}/api/marketplace/catalog`;
  const isDirectMarketplace = /\/api\/marketplace\/catalog\/submit$/i.test(url);
  const hdrs = headers();
  const dedupeRemote = process.env.SKILL_BANK_DEDUPE_REMOTE !== 'false';
  const remoteLookupCache = new Map();
  const seenLocal = new Set();

  const summary = {
    at: new Date().toISOString(),
    endpoint: url,
    endpointCandidates: resourceCandidateUrls,
    marketplaceFallback: marketplaceUrl,
    total: entries.length,
    posted: 0,
    skipped: 0,
    failed: 0,
  };

  const stillPending = [];
  for (const entry of entries) {
    const row = entry.row || entry;

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
          const lookup = await fetchMarketplaceByName(marketplaceCatalogUrl, hdrs, row.name);
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
      let attempts = 0;
      let result = null;
      while (attempts < 4) {
        attempts += 1;
        result = isDirectMarketplace ? await postMarketplace(url, hdrs, row) : await post(url, hdrs, row);
        if (!isDirectMarketplace && !result.ok && (result.status === 404 || result.status === 405)) {
          result = await postMarketplace(marketplaceUrl, hdrs, row);
        }
        if (result.ok) break;
        if (result.status === 429 && attempts < 4) {
          const waitMs = parseResetMs(result) + 1000;
          await sleep(waitMs);
          continue;
        }
        break;
      }
      if (result?.ok) {
        summary.posted += 1;
      } else {
        const hint = buildFailureHint(result?.status, isDirectMarketplace);
        summary.failed += 1;
        stillPending.push({ row, reason: `HTTP ${result?.status || 'unknown'}`, response: result?.body || null });
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

  console.log(
    `Pending retry complete: posted=${summary.posted} skipped=${summary.skipped} failed=${summary.failed}`
  );
  console.log(`Report: ${path.resolve(process.cwd(), args.report)}`);
  if (args.strict && summary.failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(String(err?.message || err));
  process.exit(1);
});
