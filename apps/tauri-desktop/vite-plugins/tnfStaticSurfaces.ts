/**
 * Serve apps/frontend/public/visualizations from the local UI (:1420) during
 * `tnf boot` / `tnf local-ui`. Vite's SPA fallback would otherwise return the
 * desktop index.html for missing public files (HTTP 200, wrong document).
 *
 * Dev-server only — packaged Tauri builds do not include this tree.
 */
import fs from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';

const pluginDir = path.dirname(fileURLToPath(import.meta.url));

export const VISUALIZATIONS_URL_PREFIX = '/visualizations';

export function defaultVisualizationsRoot(): string {
  return path.resolve(pluginDir, '../../frontend/public/visualizations');
}

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.gz': 'application/gzip',
  '.md': 'text/markdown; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.tsv': 'text/tab-separated-values; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.mmd': 'text/plain; charset=utf-8',
  '.cypher': 'text/plain; charset=utf-8',
};

export function contentTypeFor(filePath: string): string {
  return MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

/**
 * Map a request path under /visualizations to a file inside `root`.
 * Returns null on missing files or path traversal.
 */
export function resolveVisualizationFile(root: string, urlPath: string): string | null {
  const raw = String(urlPath || '').split('?')[0];
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return null;
  }
  if (!decoded.startsWith(VISUALIZATIONS_URL_PREFIX)) return null;

  const relative = decoded.slice(VISUALIZATIONS_URL_PREFIX.length).replace(/^\/+/, '');
  const rootResolved = path.resolve(root);
  const candidate = path.resolve(rootResolved, relative);
  if (candidate !== rootResolved && !candidate.startsWith(rootResolved + path.sep)) {
    return null;
  }

  try {
    if (!fs.existsSync(candidate)) return null;
    const stat = fs.statSync(candidate);
    if (stat.isDirectory()) {
      const index = path.join(candidate, 'index.html');
      return fs.existsSync(index) && fs.statSync(index).isFile() ? index : null;
    }
    return stat.isFile() ? candidate : null;
  } catch {
    return null;
  }
}

function sendFile(filePath: string, req: IncomingMessage, res: ServerResponse): void {
  const stat = fs.statSync(filePath);
  res.setHeader('Content-Type', contentTypeFor(filePath));
  res.setHeader('Content-Length', String(stat.size));
  res.setHeader('Cache-Control', 'no-cache');
  if (req.method === 'HEAD') {
    res.statusCode = 200;
    res.end();
    return;
  }
  res.statusCode = 200;
  fs.createReadStream(filePath).pipe(res);
}

export function tnfStaticSurfacesPlugin(options?: { visualizationsRoot?: string }): Plugin {
  const visualizationsRoot = options?.visualizationsRoot || defaultVisualizationsRoot();

  return {
    name: 'tnf-static-surfaces',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || '';
        if (!url.startsWith(VISUALIZATIONS_URL_PREFIX)) {
          next();
          return;
        }
        if (req.method !== 'GET' && req.method !== 'HEAD') {
          next();
          return;
        }
        const filePath = resolveVisualizationFile(visualizationsRoot, url);
        if (!filePath) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.end('Visualization not found');
          return;
        }
        sendFile(filePath, req, res);
      });
    },
  };
}
