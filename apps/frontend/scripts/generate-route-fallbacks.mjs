#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, '..');
const distDir = path.join(appRoot, 'dist');
const routerPath = path.join(appRoot, 'src', 'ComprehensiveRouter.tsx');

function isStaticAppRoute(routePath) {
  if (!routePath.startsWith('/')) return false;
  if (routePath === '/') return false;
  if (routePath.includes(':') || routePath.includes('*')) return false;
  if (routePath.includes('.')) return false;
  if (routePath.startsWith('/api') || routePath.startsWith('/v1') || routePath.startsWith('/ws')) {
    return false;
  }
  return true;
}

function toDistRouteDir(routePath) {
  const normalized = routePath.replace(/^\/+/, '').replace(/\/+$/, '');
  return path.join(distDir, normalized);
}

async function main() {
  const [routerSource, appShell] = await Promise.all([
    readFile(routerPath, 'utf8'),
    readFile(path.join(distDir, 'app.html'), 'utf8').catch(async () =>
      readFile(path.join(distDir, 'index.html'), 'utf8')
    ),
  ]);

  const matches = [...routerSource.matchAll(/path="([^"]+)"/g)].map((match) => match[1]);
  const routePaths = [...new Set(matches)].filter(isStaticAppRoute);

  let created = 0;
  for (const routePath of routePaths) {
    const targetDir = toDistRouteDir(routePath);
    const targetFile = path.join(targetDir, 'index.html');
    await mkdir(targetDir, { recursive: true });
    await writeFile(targetFile, appShell, 'utf8');
    created += 1;
  }

  console.log(`Generated SPA route fallbacks for ${created} routes`);
}

main().catch((error) => {
  console.error('Failed to generate route fallbacks:', error);
  process.exit(1);
});
