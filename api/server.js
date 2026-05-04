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
 const isAllowedOrigin = CORS_ALLOW_ORIGINS.includes('*') || 
  (requestOrigin && CORS_ALLOW_ORIGINS.includes(requestOrigin));
 
 if (isAllowedOrigin) {
 if (CORS_ALLOW_ORIGINS.includes('*')) {
 res.setHeader('Access-Control-Allow-Origin', '*');
 } else {
 res.setHeader('Access-Control-Allow-Origin', requestOrigin);
 res.setHeader('Vary', 'Origin');
 }
 res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
 res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
 
 if (req.method === 'OPTIONS') {
 return res.status(204).end();
 }
 return next();
 } else {
 // Invalid origin: reject preflight requests with 403
 if (req.method === 'OPTIONS') {
 return res.status(403).json({ error: 'Forbidden', message: 'CORS origin not allowed' });
 }
 // For non-preflight requests, simply don't set CORS headers
 // This allows the browser to handle the CORS failure silently
 return next();
 }
});
app.use(express.json({ limit: '1mb' }));

app.get('/', (_req, res) => res.send('API running on port ' + PORT));

app.get('/.well-known/agent-card.json', (_req, res) => {
  res.json({
    version: '1.2',
    agentId: 'api-server-001',
    name: 'TNF API Server',
    description: 'Primary control plane and gateway for the TNF multi-agent network.',
    skills: [
      { name: 'Orchestration', description: 'Routing and management of agent communications' },
      { name: 'Marketplace', description: 'Legacy marketplace shim for compatibility' },
    ],
    endpoint: `http://localhost:${PORT}`,
    aars: {
      score: 0.1,
      factors: { autonomy: 0.2, toolUse: 0.1, persistence: 0.0 },
    },
    signature: {
      type: 'ed25519',
      publicKey: 'static-dev-key',
      value: 'static-dev-sig',
    },
  });
});

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
