import express from 'express';
import pkg from 'pg';

const { Pool } = pkg;
const PORT = Number(process.env.PORT || process.env.API_SERVER_PORT || 8080);
const MODERATION_API_KEY = String(process.env.MODERATION_API_KEY || '').trim();
const MODERATION_API_KEY_PREVIOUS = String(process.env.MODERATION_API_KEY_PREVIOUS || '').trim();
const CORS_ALLOW_ORIGINS = String(process.env.CORS_ALLOW_ORIGINS || '*')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const DEFAULT_ITEMS = [
  {
    id: 'exp-open-audio-deck',
    slug: 'open-audio-deck',
    name: 'Open Audio Deck',
    description:
      'Spotify-style Audius client for streaming trending tracks and searching the Open Audio catalog.',
    kind: 'experience',
    category: 'music',
    tags: ['music', 'audius', 'streaming'],
    capabilities: ['music_streaming', 'playlist_discovery', 'audius_search'],
    rating: 4.9,
    totalRuns: 4200,
    successRate: 99.2,
    pricePerRun: 0,
    status: 'online',
    publicationStatus: 'published',
    launchUrl: 'https://open-audio-deck-production.up.railway.app',
    createdBy: 'tnf-core',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'exp-merkaba-lab',
    slug: 'merkaba-lab',
    name: 'Merkaba Lab',
    description:
      'PoolTogether-inspired arcade lab with rotating jackpot physics, sidepot strategy, and replay loops.',
    kind: 'experience',
    category: 'pooltogether',
    tags: ['pooltogether', 'merkaba', 'lab'],
    capabilities: ['pool_variations', 'sidepot_strategy', 'jackpot_cycles'],
    rating: 4.8,
    totalRuns: 13370,
    successRate: 98.4,
    pricePerRun: 0,
    status: 'online',
    publicationStatus: 'published',
    launchUrl: 'https://ai-arcade.xyz/#merkaba-lab',
    createdBy: 'tnf-core',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'skill-code-review-sentinel',
    slug: 'code-review-sentinel',
    name: 'Code Review Sentinel',
    description:
      'Security-aware review skill for pull requests with architecture and test quality checks.',
    kind: 'skill',
    category: 'development',
    tags: ['skill', 'code-review', 'security'],
    capabilities: ['code_review', 'security_analysis', 'test_gap_detection'],
    rating: 4.7,
    totalRuns: 9800,
    successRate: 97.3,
    pricePerRun: 0.06,
    status: 'online',
    publicationStatus: 'published',
    createdBy: 'tnf-core',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'model-qwen3-coder-next',
    slug: 'qwen3-coder-next',
    name: 'Qwen3 Coder Next',
    description: 'High-speed coding and repository analysis primitive for developer workflows.',
    kind: 'model',
    category: 'code',
    tags: ['model', 'coder', 'code'],
    capabilities: ['code_generation', 'refactoring', 'repository_analysis'],
    rating: 4.9,
    totalRuns: 15420,
    successRate: 98.2,
    pricePerRun: 0.05,
    status: 'online',
    publicationStatus: 'published',
    createdBy: 'tnf-core',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const VALID_KINDS = new Set([
  'experience',
  'workflow',
  'mcp_server',
  'skill',
  'prompt',
  'agent_template',
  'agent',
  'model',
]);
const VALID_PUBLICATION = new Set(['draft', 'review', 'published', 'archived']);
const VALID_STATUS = new Set(['online', 'busy', 'offline']);
const VALID_EXPERIENCE_CATEGORIES = new Set([
  'games',
  'music',
  'content',
  'social',
  'social-toys',
  'pooltogether',
  'community',
  'lab',
]);
const BLOCKED_ARCADE_PRIMITIVE_NAMES = new Set([
  'qwen3 coder next',
  'deepseek r1',
  'tnf director',
  'data wizard',
  'content creator pro',
  'code review sentinel',
]);
const rateBuckets = new Map();

function sanitizeText(value, max = 400) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function getClientIp(req) {
  const xff = String(req.headers['x-forwarded-for'] || '')
    .split(',')[0]
    .trim();
  return xff || req.socket?.remoteAddress || 'unknown';
}

function createRateLimiter({ windowMs, max, keyPrefix }) {
  return function rateLimit(req, res, next) {
    const now = Date.now();
    const ip = getClientIp(req);
    const key = `${keyPrefix}:${ip}`;
    const current = rateBuckets.get(key);

    if (!current || current.resetAt <= now) {
      rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (current.count >= max) {
      const retryAfter = Math.ceil((current.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      return res
        .status(429)
        .json({ message: 'Rate limit exceeded', retryAfterSeconds: retryAfter });
    }

    current.count += 1;
    return next();
  };
}

function requireModerationAuth(req, res, next) {
  if (!MODERATION_API_KEY) {
    return res.status(503).json({ message: 'Moderation API key is not configured' });
  }

  const authHeader = String(req.headers.authorization || '');
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const xApiKey = String(req.headers['x-api-key'] || '').trim();
  const supplied = bearerToken || xApiKey;

  const validKeys = new Set([MODERATION_API_KEY, MODERATION_API_KEY_PREVIOUS].filter(Boolean));
  if (!supplied || !validKeys.has(supplied)) {
    return res.status(401).json({ message: 'Unauthorized moderation request' });
  }

  return next();
}

function normalizeList(values, max = 16) {
  if (!Array.isArray(values)) return [];
  const out = [];
  const seen = new Set();
  for (const v of values) {
    const s = sanitizeText(v, 80).toLowerCase();
    if (!s || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
    if (out.length >= max) break;
  }
  return out;
}

function ensureUrl(input) {
  if (!input) return undefined;
  const value = sanitizeText(input, 2000);
  if (!value) return undefined;
  const parsed = new URL(value);
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('launchUrl must use http or https');
  }
  return parsed.toString();
}

function nowIso() {
  return new Date().toISOString();
}

function looksLikePrimitivePayload(payload) {
  const name = sanitizeText(payload?.name, 200).toLowerCase();
  const description = sanitizeText(payload?.description, 2000).toLowerCase();
  const category = sanitizeText(payload?.category, 120).toLowerCase();
  const type = sanitizeText(payload?.type, 40).toUpperCase();
  const tags = normalizeList(payload?.tags, 20);
  const capabilities = normalizeList(payload?.capabilities, 20);
  const haystack = `${name} ${description} ${category} ${tags.join(' ')} ${capabilities.join(' ')}`;

  if (BLOCKED_ARCADE_PRIMITIVE_NAMES.has(name)) {
    return true;
  }

  if (type === 'CODER' || type === 'ANALYZER' || type === 'STRATEGIST' || type === 'GENERIC') {
    return true;
  }

  const primitiveHints = [
    'mcp',
    'server',
    'skill',
    'prompt',
    'template',
    'model',
    'workflow',
    'orchestrator',
    'reasoning',
    'code',
  ];
  return primitiveHints.some((hint) => haystack.includes(hint));
}

class CatalogStore {
  constructor() {
    this.memory = [...DEFAULT_ITEMS];
    this.pool = null;
  }

  async init() {
    const conn = process.env.MARKETPLACE_DATABASE_URL || process.env.DATABASE_URL;
    if (!conn) return;

    this.pool = new Pool({ connectionString: conn, max: 5 });
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS marketplace_catalog_items (
        id TEXT PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        kind TEXT NOT NULL,
        category TEXT NOT NULL,
        tags JSONB NOT NULL DEFAULT '[]'::jsonb,
        capabilities JSONB NOT NULL DEFAULT '[]'::jsonb,
        rating DOUBLE PRECISION NOT NULL DEFAULT 0,
        total_runs INTEGER NOT NULL DEFAULT 0,
        success_rate DOUBLE PRECISION NOT NULL DEFAULT 0,
        price_per_run DOUBLE PRECISION NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'online',
        publication_status TEXT NOT NULL DEFAULT 'draft',
        launch_url TEXT,
        created_by TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const existing = await this.pool.query(
      'SELECT COUNT(*)::int AS n FROM marketplace_catalog_items'
    );
    if (existing.rows[0]?.n === 0) {
      for (const item of this.memory) {
        await this.upsert(item);
      }
    }
  }

  async close() {
    if (this.pool) await this.pool.end();
  }

  async all() {
    if (!this.pool) {
      return [...this.memory].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }

    const { rows } = await this.pool.query(`
      SELECT id, slug, name, description, kind, category, tags, capabilities, rating,
             total_runs, success_rate, price_per_run, status, publication_status,
             launch_url, created_by, created_at, updated_at
      FROM marketplace_catalog_items
      ORDER BY updated_at DESC
    `);

    return rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      description: r.description,
      kind: r.kind,
      category: r.category,
      tags: Array.isArray(r.tags) ? r.tags : [],
      capabilities: Array.isArray(r.capabilities) ? r.capabilities : [],
      rating: Number(r.rating || 0),
      totalRuns: Number(r.total_runs || 0),
      successRate: Number(r.success_rate || 0),
      pricePerRun: Number(r.price_per_run || 0),
      status: VALID_STATUS.has(r.status) ? r.status : 'online',
      publicationStatus: VALID_PUBLICATION.has(r.publication_status)
        ? r.publication_status
        : 'draft',
      launchUrl: r.launch_url || undefined,
      createdBy: r.created_by || undefined,
      createdAt: new Date(r.created_at).toISOString(),
      updatedAt: new Date(r.updated_at).toISOString(),
    }));
  }

  async getById(id) {
    const items = await this.all();
    return items.find((i) => i.id === id || i.slug === id) || null;
  }

  async upsert(item) {
    if (!this.pool) {
      const idx = this.memory.findIndex((i) => i.id === item.id || i.slug === item.slug);
      if (idx >= 0) this.memory[idx] = item;
      else this.memory.unshift(item);
      return item;
    }

    await this.pool.query(
      `INSERT INTO marketplace_catalog_items (
         id, slug, name, description, kind, category, tags, capabilities, rating,
         total_runs, success_rate, price_per_run, status, publication_status, launch_url,
         created_by, created_at, updated_at
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18
       )
       ON CONFLICT (id) DO UPDATE SET
         slug = EXCLUDED.slug,
         name = EXCLUDED.name,
         description = EXCLUDED.description,
         kind = EXCLUDED.kind,
         category = EXCLUDED.category,
         tags = EXCLUDED.tags,
         capabilities = EXCLUDED.capabilities,
         rating = EXCLUDED.rating,
         total_runs = EXCLUDED.total_runs,
         success_rate = EXCLUDED.success_rate,
         price_per_run = EXCLUDED.price_per_run,
         status = EXCLUDED.status,
         publication_status = EXCLUDED.publication_status,
         launch_url = EXCLUDED.launch_url,
         created_by = EXCLUDED.created_by,
         created_at = EXCLUDED.created_at,
         updated_at = EXCLUDED.updated_at`,
      [
        item.id,
        item.slug,
        item.name,
        item.description,
        item.kind,
        item.category,
        JSON.stringify(item.tags || []),
        JSON.stringify(item.capabilities || []),
        item.rating || 0,
        item.totalRuns || 0,
        item.successRate || 0,
        item.pricePerRun || 0,
        item.status || 'online',
        item.publicationStatus || 'draft',
        item.launchUrl || null,
        item.createdBy || null,
        item.createdAt,
        item.updatedAt,
      ]
    );
    return item;
  }
}

const store = new CatalogStore();
await store.init().catch((err) => {
  console.error('Marketplace DB init failed, using memory fallback:', err.message);
});

const app = express();
app.use((req, res, next) => {
  const requestOrigin = String(req.headers.origin || '');
  if (CORS_ALLOW_ORIGINS.includes('*')) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else if (requestOrigin && CORS_ALLOW_ORIGINS.includes(requestOrigin)) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  return next();
});
app.use(express.json({ limit: '1mb' }));

async function queryCatalogFromRequest(req, force = {}) {
  const kind = force.kind || sanitizeText(req.query.kind, 40).toLowerCase() || undefined;
  const status = force.status || sanitizeText(req.query.status, 20).toLowerCase() || undefined;
  const category = sanitizeText(req.query.category, 80).toLowerCase() || undefined;
  const q = sanitizeText(req.query.q, 120).toLowerCase() || undefined;
  const limit = Math.max(1, Math.min(Number(req.query.limit || 50) || 50, 200));
  const offset = Math.max(0, Number(req.query.offset || 0) || 0);

  const items = await store.all();
  const filtered = items.filter((item) => {
    if (kind && item.kind !== kind) return false;
    if (status && item.publicationStatus !== status) return false;
    if (category && item.category.toLowerCase() !== category) return false;
    if (q) {
      const haystack = [
        item.name,
        item.description,
        item.category,
        ...item.tags,
        ...item.capabilities,
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  return { items: filtered.slice(offset, offset + limit), total: filtered.length };
}

async function createExperience(payload) {
  const name = sanitizeText(payload?.name, 200);
  const description = sanitizeText(payload?.description, 5000);
  const category = sanitizeText(payload?.category, 120).toLowerCase();
  const launchUrl = ensureUrl(payload?.launchUrl);
  const tags = normalizeList(payload?.tags, 12);
  if (!name || !description || !category) {
    throw new Error('name, description, category are required');
  }

  if (!VALID_EXPERIENCE_CATEGORIES.has(category)) {
    throw new Error(
      'Invalid experience category. Use one of: games, music, content, social, social-toys, pooltogether, community, lab'
    );
  }

  if (looksLikePrimitivePayload(payload)) {
    throw new Error(
      'This submission looks like a primitive. Submit it through /marketplace/catalog/submit with kind != experience'
    );
  }

  const existing = await store.all();
  const baseSlug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'item';
  let slug = baseSlug;
  let i = 1;
  const slugs = new Set(existing.map((x) => x.slug));
  while (slugs.has(slug)) slug = `${baseSlug}-${i++}`;

  const item = {
    id: `exp-community-${Date.now()}`,
    slug,
    name,
    description,
    kind: 'experience',
    category,
    tags: tags.length ? tags : ['community', 'ugc'],
    capabilities: ['ugc_submission'],
    rating: 0,
    totalRuns: 0,
    successRate: 0,
    pricePerRun: 0,
    status: 'online',
    publicationStatus: 'review',
    launchUrl,
    createdBy: sanitizeText(payload?.createdBy || 'community', 80).toLowerCase(),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  await store.upsert(item);
  return item;
}

app.get('/', (_req, res) => res.send('API running on port ' + PORT));
app.get('/health', (_req, res) =>
  res.json({ ok: true, service: 'mcp-drs-api', mode: store.pool ? 'db' : 'memory' })
);

app.get(['/marketplace/catalog', '/api/marketplace/catalog'], async (req, res) => {
  return res.json(await queryCatalogFromRequest(req));
});

app.get(['/marketplace/experiences', '/api/marketplace/experiences'], async (req, res) => {
  return res.json(
    await queryCatalogFromRequest(req, {
      kind: 'experience',
      status: req.query.status || 'published',
    })
  );
});

app.get(['/marketplace/catalog/:id', '/api/marketplace/catalog/:id'], async (req, res) => {
  const item = await store.getById(req.params.id);
  if (!item) return res.status(404).json({ message: `Catalog item not found: ${req.params.id}` });
  return res.json(item);
});

const submitRateLimit = createRateLimiter({ windowMs: 60_000, max: 25, keyPrefix: 'submit' });
const moderationRateLimit = createRateLimiter({
  windowMs: 60_000,
  max: 60,
  keyPrefix: 'moderation',
});

app.post(
  ['/marketplace/experiences/submit', '/api/marketplace/experiences/submit'],
  submitRateLimit,
  async (req, res) => {
    try {
      const item = await createExperience(req.body);
      return res.status(201).json(item);
    } catch (error) {
      return res.status(400).json({ message: error.message || 'Invalid experience payload' });
    }
  }
);

app.post(
  ['/marketplace/catalog/submit', '/api/marketplace/catalog/submit'],
  submitRateLimit,
  async (req, res) => {
    try {
      const kind = sanitizeText(req.body?.kind, 40).toLowerCase();
      if (!VALID_KINDS.has(kind))
        return res.status(400).json({ message: 'kind is required and must be valid' });
      if (kind === 'experience') {
        const item = await createExperience(req.body);
        return res.status(201).json(item);
      }

      const name = sanitizeText(req.body?.name, 200);
      const description = sanitizeText(req.body?.description, 5000);
      const category = sanitizeText(req.body?.category, 120).toLowerCase();
      const launchUrl = ensureUrl(req.body?.launchUrl);
      const tags = normalizeList(req.body?.tags, 12);
      const capabilities = normalizeList(req.body?.capabilities, 16);
      if (!name || !description || !category)
        return res.status(400).json({ message: 'name, description, category are required' });

      const existing = await store.all();
      const baseSlug =
        name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '') || 'item';
      let slug = baseSlug;
      let i = 1;
      const slugs = new Set(existing.map((x) => x.slug));
      while (slugs.has(slug)) slug = `${baseSlug}-${i++}`;

      const item = {
        id: `${kind}-${Date.now()}`,
        slug,
        name,
        description,
        kind,
        category,
        tags: tags.length ? tags : [kind, 'community'],
        capabilities: capabilities.length ? capabilities : ['community_submission'],
        rating: 0,
        totalRuns: 0,
        successRate: 0,
        pricePerRun: 0,
        status: 'online',
        publicationStatus: 'review',
        launchUrl,
        createdBy: sanitizeText(req.body?.createdBy || 'community', 80).toLowerCase(),
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };

      await store.upsert(item);
      return res.status(201).json(item);
    } catch (error) {
      return res.status(400).json({ message: error.message || 'Invalid catalog payload' });
    }
  }
);

app.post(
  [
    '/marketplace/catalog/:id/publication-status',
    '/api/marketplace/catalog/:id/publication-status',
  ],
  moderationRateLimit,
  requireModerationAuth,
  async (req, res) => {
    const toStatus = sanitizeText(req.body?.toStatus, 30).toLowerCase();
    if (!VALID_PUBLICATION.has(toStatus))
      return res.status(400).json({ message: 'toStatus is required and must be valid' });
    const item = await store.getById(req.params.id);
    if (!item) return res.status(404).json({ message: `Catalog item not found: ${req.params.id}` });

    const allowed = {
      draft: new Set(['review', 'archived']),
      review: new Set(['draft', 'published', 'archived']),
      published: new Set(['review', 'archived']),
      archived: new Set(['draft']),
    };

    if (item.publicationStatus !== toStatus && !allowed[item.publicationStatus]?.has(toStatus)) {
      return res
        .status(400)
        .json({
          message: `Invalid publication transition: ${item.publicationStatus} -> ${toStatus}`,
        });
    }

    item.publicationStatus = toStatus;
    item.updatedAt = nowIso();
    await store.upsert(item);
    return res.json(item);
  }
);

process.on('SIGTERM', async () => {
  await store.close().catch(() => {});
  process.exit(0);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Starting on port ${PORT}`);
});
