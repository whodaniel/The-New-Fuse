#!/usr/bin/env node
/* eslint-disable no-console */

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

const ROOT = process.cwd();
const STATIC_DIR = path.join(ROOT, 'scripts/local-ui/static');
const DEFAULT_PORT = 1421;
const LOCAL_API_ORIGIN = process.env.TNF_LOCAL_API_ORIGIN || 'http://127.0.0.1:3001';
// The gateway (3001) does not expose admin metrics routes; apps/api (3002) does.
const ADMIN_API_ORIGIN = process.env.TNF_ADMIN_API_ORIGIN || 'http://127.0.0.1:3002';
const RELAY_ORIGIN = process.env.TNF_RELAY_HTTP_ORIGIN || 'http://127.0.0.1:3000';
const BRIDGE_ORIGIN = process.env.TNF_BRIDGE_HTTP_ORIGIN || 'http://127.0.0.1:3005';

const RELAY_POST_ALLOW = /^\/bridge\/(approve|deny|toggle)$/;

/**
 * Same-origin pass-throughs: the static panel cannot call the local services
 * directly without CORS, so allowlisted prefixes are proxied per rule below.
 */
const PROXY_RULES = [
  {
    prefix: '/api/local-runtime/',
    origin: LOCAL_API_ORIGIN,
    methods: ['GET'],
    forwardAuth: true,
  },
  {
    prefix: '/api/admin/metrics/chronological-processes',
    origin: ADMIN_API_ORIGIN,
    methods: ['GET', 'POST', 'PUT'],
    forwardAuth: true,
  },
  {
    prefix: '/bridge-api/',
    origin: BRIDGE_ORIGIN,
    methods: ['GET'],
    stripPrefix: '/bridge-api',
  },
  {
    prefix: '/relay-api/',
    origin: RELAY_ORIGIN,
    methods: ['GET', 'POST'],
    stripPrefix: '/relay-api',
    postAllow: RELAY_POST_ALLOW,
    operatorHeader: 'browser-control-panel',
  },
];

function proxyUpstream(req, res, rule, urlPath) {
  const upstreamPath = rule.stripPrefix ? urlPath.slice(rule.stripPrefix.length) || '/' : urlPath;
  if (req.method === 'POST' && rule.postAllow && !rule.postAllow.test(upstreamPath)) {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'POST not allowed for this path' }));
    return;
  }
  const search = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  const target = new URL(upstreamPath + search, rule.origin);
  const headers = { accept: 'application/json' };
  if (req.headers['content-type']) headers['content-type'] = req.headers['content-type'];
  if (rule.operatorHeader) headers['x-tnf-operator'] = rule.operatorHeader;
  if (rule.forwardAuth) {
    const auth = req.headers.authorization || process.env.TNF_LOCAL_RUNTIME_TOKEN;
    if (auth) {
      headers.authorization = auth.startsWith('Bearer ') ? auth : `Bearer ${auth}`;
    }
  }

  const upstream = http.request(
    target,
    { method: req.method, headers, timeout: 10000 },
    (upstreamRes) => {
      res.writeHead(upstreamRes.statusCode || 502, {
        'Content-Type': upstreamRes.headers['content-type'] || 'application/json',
      });
      upstreamRes.pipe(res);
    }
  );

  upstream.on('timeout', () => upstream.destroy(new Error('timeout')));
  upstream.on('error', (error) => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        available: false,
        reason: `Upstream unreachable at ${rule.origin} (${error.message})`,
      })
    );
  });

  if (req.method === 'POST' || req.method === 'PUT') {
    req.pipe(upstream);
  } else {
    upstream.end();
  }
}

function probeHealth(origin, healthPath) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const request = http.get(new URL(healthPath, origin), { timeout: 2000 }, (response) => {
      response.resume();
      resolve({
        up: (response.statusCode || 0) >= 200 && (response.statusCode || 0) < 500,
        statusCode: response.statusCode || 0,
        latencyMs: Date.now() - startedAt,
      });
    });
    request.on('timeout', () => request.destroy(new Error('timeout')));
    request.on('error', (error) => {
      resolve({ up: false, error: error.message, latencyMs: Date.now() - startedAt });
    });
  });
}

async function handlePanelHealth(res) {
  const [relay, bridge, api] = await Promise.all([
    probeHealth(RELAY_ORIGIN, '/health'),
    probeHealth(BRIDGE_ORIGIN, '/health'),
    probeHealth(LOCAL_API_ORIGIN, '/health'),
  ]);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(
    JSON.stringify({ generatedAt: new Date().toISOString(), relay, bridge, api })
  );
}

function parseArgs(argv) {
  return {
    port: Number(process.env.TNF_BROWSER_CONTROL_PORT || DEFAULT_PORT),
    open: !argv.includes('--no-open'),
    skipRelay: argv.includes('--skip-relay'),
    help: argv.includes('-h') || argv.includes('--help'),
  };
}

function printUsage() {
  console.log('Usage: node scripts/local-ui/serve-browser-control.cjs [options]');
  console.log('');
  console.log('Serve standalone TNF browser control + federation HTML panel.');
  console.log('');
  console.log('Options:');
  console.log('  --skip-relay  Do not start relay-core in background');
  console.log('  --no-open     Do not open browser automatically');
  console.log('  -h, --help    Show help');
}

function openBrowser(url) {
  if (process.platform === 'darwin') {
    spawn('open', [url], { stdio: 'ignore' });
    return;
  }
  if (process.platform === 'win32') {
    spawn('cmd', ['/c', 'start', '', url], { stdio: 'ignore' });
    return;
  }
  spawn('xdg-open', [url], { stdio: 'ignore' });
}

function contentType(filePath) {
  if (filePath.endsWith('.html')) return 'text/html; charset=utf-8';
  if (filePath.endsWith('.js')) return 'application/javascript; charset=utf-8';
  if (filePath.endsWith('.css')) return 'text/css; charset=utf-8';
  return 'application/octet-stream';
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printUsage();
    process.exit(0);
  }

  if (!args.skipRelay) {
    spawn('pnpm', ['run', '-s', 'relay:start'], {
      cwd: ROOT,
      stdio: 'inherit',
      env: { ...process.env, RELAY_PORT: process.env.RELAY_PORT || '3000' },
      detached: true,
    }).unref();
    setTimeout(() => {
      probeHealth(RELAY_ORIGIN, '/health').then((result) => {
        if (result.up) {
          console.log(`[relay] healthy at ${RELAY_ORIGIN} (${result.latencyMs}ms)`);
        } else {
          console.warn(`[relay] NOT healthy at ${RELAY_ORIGIN}: ${result.error || result.statusCode}`);
        }
      });
    }, 5000).unref();
  }

  const server = http.createServer((req, res) => {
    const urlPath = req.url?.split('?')[0] || '/';

    if (urlPath === '/panel/health') {
      handlePanelHealth(res);
      return;
    }

    const rule = PROXY_RULES.find((candidate) => urlPath.startsWith(candidate.prefix));
    if (rule) {
      if (!rule.methods.includes(req.method)) {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Method ${req.method} not allowed` }));
        return;
      }
      proxyUpstream(req, res, rule, urlPath);
      return;
    }

    const relative = urlPath === '/' ? '/browser-control.html' : urlPath;
    const filePath = path.join(STATIC_DIR, relative);

    if (!filePath.startsWith(STATIC_DIR)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    res.writeHead(200, { 'Content-Type': contentType(filePath) });
    fs.createReadStream(filePath).pipe(res);
  });

  server.listen(args.port, '127.0.0.1', () => {
    const url = `http://127.0.0.1:${args.port}/`;
    console.log(`TNF browser control panel: ${url}`);
    if (args.open) openBrowser(url);
  });
}

main();
