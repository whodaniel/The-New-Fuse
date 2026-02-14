// Minimal HTTP reverse proxy + health endpoint for Railway.
//
// Why: the OpenClaw gateway is WebSocket-centric and may not answer plain HTTP
// GETs quickly enough for Railway's healthcheck. This shim:
// - answers /health with 200 immediately
// - proxies HTTP + WS upgrade traffic to the OpenClaw gateway running locally
// - exits if the gateway process exits
//
// No external deps (uses built-in http).
const http = require('http');
const { spawn } = require('child_process');

const PUBLIC_PORT = parseInt(process.env.PORT || '8080', 10);
const TARGET_HOST = process.env.OPENCLAW_PROXY_TARGET_HOST || '127.0.0.1';
const TARGET_PORT = parseInt(process.env.OPENCLAW_INTERNAL_PORT || '19001', 10);

function isHealthPath(url) {
  if (!url) return false;
  return url === '/health' || url === '/healthz' || url.startsWith('/health?');
}

function proxyHttp(req, res) {
  const options = {
    host: TARGET_HOST,
    port: TARGET_PORT,
    method: req.method,
    path: req.url,
    headers: { ...req.headers, host: `${TARGET_HOST}:${TARGET_PORT}` },
  };

  const upstream = http.request(options, (upstreamRes) => {
    res.writeHead(upstreamRes.statusCode || 502, upstreamRes.headers);
    upstreamRes.pipe(res);
  });

  upstream.on('error', (err) => {
    res.statusCode = 502;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: false, error: String(err && err.message ? err.message : err) }));
  });

  req.pipe(upstream);
}

function proxyWebSocket(req, socket, head) {
  const upstreamSocket = require('net').connect(TARGET_PORT, TARGET_HOST, () => {
    // Forward the initial HTTP upgrade request to upstream.
    upstreamSocket.write(
      `${req.method} ${req.url} HTTP/${req.httpVersion}\r\n` +
        Object.entries(req.headers)
          .map(([k, v]) => `${k}: ${v}`)
          .join('\r\n') +
        '\r\n\r\n'
    );
    if (head && head.length) upstreamSocket.write(head);

    // Bi-directional piping.
    socket.pipe(upstreamSocket);
    upstreamSocket.pipe(socket);
  });

  upstreamSocket.on('error', () => socket.destroy());
  socket.on('error', () => upstreamSocket.destroy());
}

function startGateway() {
  // Ensure token auth works (Control UI expects a token when gateway auth is enabled).
  // If no token is provided via env, generate one and log it so you can paste it into the UI.
  if (!process.env.OPENCLAW_GATEWAY_TOKEN) {
    const crypto = require('crypto');
    const token = crypto.randomBytes(24).toString('hex'); // 48 chars
    process.env.OPENCLAW_GATEWAY_TOKEN = token;
    console.log(`Generated OPENCLAW_GATEWAY_TOKEN=${token}`);
  }

  const args = [
    'gateway',
    'run',
    '--allow-unconfigured',
    '--bind',
    'lan',
    '--port',
    String(TARGET_PORT),
    '--token',
    String(process.env.OPENCLAW_GATEWAY_TOKEN),
  ];

  const child = spawn('openclaw', args, {
    stdio: 'inherit',
    env: { ...process.env },
  });

  child.on('exit', (code, signal) => {
    const exitCode = typeof code === 'number' ? code : 1;
    console.error(`OpenClaw gateway exited (code=${exitCode}, signal=${signal || 'n/a'})`);
    process.exit(exitCode);
  });

  process.on('SIGTERM', () => child.kill('SIGTERM'));
  process.on('SIGINT', () => child.kill('SIGINT'));
}

const server = http.createServer((req, res) => {
  if (isHealthPath(req.url)) {
    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true, status: 'healthy' }));
    return;
  }
  proxyHttp(req, res);
});

server.on('upgrade', (req, socket, head) => proxyWebSocket(req, socket, head));

server.listen(PUBLIC_PORT, '0.0.0.0', () => {
  console.log(`Proxy listening on 0.0.0.0:${PUBLIC_PORT} -> ${TARGET_HOST}:${TARGET_PORT}`);
  startGateway();
});
