import * as fs from 'node:fs/promises';
import * as path from 'node:path';

// In compiled dist, __dirname = apps/api-gateway/dist
// Public files are copied to dist/public
const PUBLIC_DIR = path.resolve(__dirname, 'public');

const PAGE_MAP: Record<string, string> = {
  '/pricing': 'pricing.html',
  '/features': 'features.html',
  '/docs': 'docs.html',
};

const PAGE_CACHE: Record<string, string> = {};

async function loadPage(filename: string): Promise<string> {
  if (PAGE_CACHE[filename]) return PAGE_CACHE[filename];
  const filePath = path.join(PUBLIC_DIR, filename);
  const content = await fs.readFile(filePath, 'utf-8');
  PAGE_CACHE[filename] = content;
  return content;
}

export async function staticPagesHandler(req: any, res: any): Promise<void> {
  const pathname = req.url?.split('?')[0] || '/';
  
  const filename = PAGE_MAP[pathname];
  if (!filename) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/html');
    res.end('<h1>Not Found</h1><p>Page not found</p>');
    return;
  }

  try {
    const content = await loadPage(filename);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(content);
  } catch (err) {
    console.error('[static-pages] Error loading page:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/html');
    res.end('<h1>Internal Server Error</h1><p>Failed to load page</p>');
  }
}