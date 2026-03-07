import express from 'express';

const PORT = Number(process.env.PORT || process.env.API_SERVER_PORT || 8080);
const TNF_MARKETPLACE_API_BASE = String(process.env.TNF_MARKETPLACE_API_BASE || '')
  .trim()
  .replace(/\/+$/, '');
const CORS_ALLOW_ORIGINS = String(process.env.CORS_ALLOW_ORIGINS || '*')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

function isMarketplacePath(pathname) {
  return /^\/(?:api\/)?marketplace(?:\/|$)/.test(String(pathname || ''));
}

function canonicalMarketplacePath(pathname) {
  return String(pathname || '').replace(/^\/api/, '');
}

function buildTnfTarget(pathname) {
  const canonicalPath = canonicalMarketplacePath(pathname);
  if (!TNF_MARKETPLACE_API_BASE) return canonicalPath;
  return `${TNF_MARKETPLACE_API_BASE}${canonicalPath}`;
}

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

app.get('/', (_req, res) => res.send('API running on port ' + PORT));
app.get('/health', (_req, res) =>
  res.json({
    ok: true,
    service: 'mcp-drs-api',
    mode: 'compatibility-shim',
    marketplace: 'deprecated-removed',
  })
);

app.all(['/marketplace*', '/api/marketplace*'], (req, res) => {
  const target = buildTnfTarget(req.path);
  res.setHeader('X-TNF-Marketplace-Legacy', 'removed');
  res.setHeader('Deprecation', 'true');
  res.setHeader('Sunset', 'Tue, 30 Jun 2026 00:00:00 GMT');
  if (TNF_MARKETPLACE_API_BASE) {
    res.setHeader('Link', `<${target}>; rel="successor-version"`);
  }
  return res.status(410).json({
    message: 'Legacy marketplace component removed. Use TNF API marketplace endpoints.',
    target,
  });
});

process.on('SIGTERM', async () => {
  process.exit(0);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Starting on port ${PORT}`);
});
