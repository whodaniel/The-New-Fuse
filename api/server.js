import express from 'express';
import { corsMiddleware } from './middleware/cors.js';

const PORT = Number(process.env.PORT || process.env.API_SERVER_PORT || 8080);
const TNF_MARKETPLACE_API_BASE = String(process.env.TNF_MARKETPLACE_API_BASE || '')
  .trim()
  .replace(/\/+$/, '');

const app = express();
app.use(corsMiddleware);
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
  const successorTarget = TNF_MARKETPLACE_API_BASE
    ? `${TNF_MARKETPLACE_API_BASE}/marketplace-new`
    : null;
  res.setHeader('X-TNF-Marketplace-Legacy', 'removed');
  res.setHeader('Deprecation', 'true');
  res.setHeader('Sunset', 'Tue, 30 Jun 2026 00:00:00 GMT');
  if (successorTarget) {
    res.setHeader('Link', `<${successorTarget}>; rel="successor-version"`);
  }
  return res.status(410).json({
    message: 'Legacy marketplace component removed. Use TNF API marketplace endpoints.',
    target: successorTarget || 'removed',
  });
});

process.on('SIGTERM', async () => {
  process.exit(0);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Starting on port ${PORT}`);
});
