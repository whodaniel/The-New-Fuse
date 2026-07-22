import * as fs from 'fs';
import * as path from 'path';

// Resolve repo-root pages/ relative to this file's compiled location.
// When launched from apps/api-gateway/dist/main.js, __dirname = .../dist,
// so resolve(__dirname, '..', '..', '..') lands at repo root.
const PAGES_DIR = path.resolve(__dirname, '..', '..', '..', 'pages');

export async function ensureNextHandler() {
  // Dynamic import avoids requiring `next` at top-level when not used.
  const { default: next } = await import('next');
  const dir = fs.existsSync(PAGES_DIR) ? PAGES_DIR : process.cwd();
  const app = next({ dev: process.env.NODE_ENV !== 'production', dir });
  await app.prepare();
  return app.getRequestHandler();
}
