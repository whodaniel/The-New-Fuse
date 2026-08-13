#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.MARKETPLACE_API_PORT || 4567;
const DATA_FILE = path.resolve(__dirname, '../../data/marketplace/catalog-items.json');

function loadCatalog() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch {
    return { items: [], total: 0, generated_at: '' };
  }
}

function parseQuery(url) {
  const idx = url.indexOf('?');
  if (idx === -1) return {};
  const qs = url.slice(idx + 1);
  const params = {};
  for (const part of qs.split('&')) {
    const [k, v] = part.split('=').map(x => decodeURIComponent(x || ''));
    if (k) params[k] = v;
  }
  return params;
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = req.url || '/';
  const params = parseQuery(url);
  const pathname = url.split('?')[0];

  if (pathname === '/api/marketplace/catalog' || pathname === '/marketplace/catalog') {
    const catalog = loadCatalog();
    let items = catalog.items;
    
    if (params.kind && params.kind !== 'all' && params.kind !== 'undefined') {
      items = items.filter(i => i.kind === params.kind);
    }
    if (params.status) {
      items = items.filter(i => i.publicationStatus === params.status);
    }
    if (params.q) {
      const q = params.q.toLowerCase();
      items = items.filter(i => 
        i.name.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        (i.tags || []).some(t => t.toLowerCase().includes(q))
      );
    }
    if (params.category && params.category !== 'all') {
      items = items.filter(i => i.category.toLowerCase() === params.category.toLowerCase());
    }
    
    const limit = parseInt(params.limit) || 200;
    const offset = parseInt(params.offset) || 0;
    const total = items.length;
    items = items.slice(offset, offset + limit);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ items, total }));
    return;
  }

  if (pathname === '/api/marketplace/experiences' || pathname === '/marketplace/experiences') {
    const catalog = loadCatalog();
    const items = catalog.items.filter(i => i.kind === 'experience');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ items, total: items.length }));
    return;
  }

  if (pathname === '/health' || pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy', items: loadCatalog().total }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found', path: pathname }));
});

server.listen(PORT, () => {
  const catalog = loadCatalog();
  console.log(`Marketplace API server running on http://localhost:${PORT}`);
  console.log(`Catalog has ${catalog.total} items`);
});