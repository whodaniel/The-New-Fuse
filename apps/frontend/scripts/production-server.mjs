import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { createServer } from 'node:http';

const DIST_DIR = join(process.cwd(), 'dist');
const PORT = Number(process.env.PORT || 3000);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
};

const STATIC_ROOT_FILES = new Set([
  '/favicon.ico',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/apple-touch-icon.png',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/manifest.json',
  '/sitemap.html',
  '/robots.txt',
]);

function isMarketplaceHost(hostHeader = '') {
  return hostHeader.split(':')[0].toLowerCase() === 'marketplace.thenewfuse.com';
}

function safeJoinDist(urlPathname) {
  const normalized = normalize(urlPathname).replace(/^(\.\.(\/|\\|$))+/, '');
  const filePath = join(DIST_DIR, normalized);
  if (!filePath.startsWith(DIST_DIR)) {
    return null;
  }
  return filePath;
}

function serveFile(res, filePath) {
  const ext = extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': contentType });
  createReadStream(filePath).pipe(res);
}

function notFound(res) {
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not Found');
}

createServer((req, res) => {
  const url = new URL(req.url || '/', 'http://localhost');
  const pathname = decodeURIComponent(url.pathname);
  const hostHeader = req.headers.host || '';

  // Root path is host-aware: marketplace domain gets standalone marketplace app, others get static landing.
  if (pathname === '/') {
    const rootFile = isMarketplaceHost(hostHeader) ? 'app.html' : 'index.html';
    const filePath = join(DIST_DIR, rootFile);
    if (existsSync(filePath)) {
      return serveFile(res, filePath);
    }
    return notFound(res);
  }

  // Serve known root static files when present.
  if (STATIC_ROOT_FILES.has(pathname)) {
    const filePath = safeJoinDist(pathname);
    if (filePath && existsSync(filePath) && statSync(filePath).isFile()) {
      return serveFile(res, filePath);
    }
    return notFound(res);
  }

  // Serve direct static assets/files as-is.
  const directFile = safeJoinDist(pathname);
  if (directFile && existsSync(directFile) && statSync(directFile).isFile()) {
    return serveFile(res, directFile);
  }

  // Any unknown extension path is a real 404, not an SPA route.
  if (extname(pathname)) {
    return notFound(res);
  }

  // SPA fallback: all application routes resolve through app.html.
  const appShell = join(DIST_DIR, 'app.html');
  if (existsSync(appShell)) {
    return serveFile(res, appShell);
  }

  notFound(res);
}).listen(PORT, () => {
  console.log(`[frontend] serving dist on :${PORT}`);
});
