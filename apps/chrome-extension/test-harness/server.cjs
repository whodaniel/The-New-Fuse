#!/usr/bin/env node
/**
 * Static server for the Fuse Connect browser test harness.
 *
 * The extension's content script matches http://localhost:* /*, so serving the
 * mock chat page over plain localhost is enough for content/index.js to attach.
 *
 *   node test-harness/server.cjs [port]      # default 4599
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.argv[2] || process.env.HARNESS_PORT || 4599);
const ROOT = __dirname;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const rel = url.pathname === '/' ? '/mock-chat.html' : url.pathname;
  // Confine reads to the harness directory.
  const file = path.join(ROOT, path.normalize(rel).replace(/^(\.\.[/\\])+/, ''));
  if (!file.startsWith(ROOT)) {
    res.writeHead(403).end('forbidden');
    return;
  }
  fs.readFile(file, (err, body) => {
    if (err) {
      res.writeHead(404, { 'content-type': 'text/plain' }).end('not found: ' + rel);
      return;
    }
    res.writeHead(200, {
      'content-type': TYPES[path.extname(file)] || 'application/octet-stream',
      'cache-control': 'no-store',
    }).end(body);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[harness] serving ${ROOT} at http://localhost:${PORT}/`);
});
