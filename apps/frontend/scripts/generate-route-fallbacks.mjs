#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, '..');
const distDir = path.join(appRoot, 'dist');
const routerPath = path.join(appRoot, 'src', 'ComprehensiveRouter.tsx');

async function readFirstExistingFile(paths) {
  for (const filePath of paths) {
    try {
      return await readFile(filePath, 'utf8');
    } catch (error) {
      if (error && error.code === 'ENOENT') continue;
      throw error;
    }
  }
  throw new Error(`No app shell found. Tried: ${paths.join(', ')}`);
}

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
    readFirstExistingFile([
      path.join(distDir, 'app.html'),
      path.join(distDir, 'index.html'),
      path.join(appRoot, 'app.html'),
      path.join(appRoot, 'index.html'),
    ]),
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
