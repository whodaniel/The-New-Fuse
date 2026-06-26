#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '../..');

function parseEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const entries = {};
  for (const rawLine of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const normalized = line.startsWith('export ') ? line.slice('export '.length).trim() : line;
    const separatorIndex = normalized.indexOf('=');
    if (separatorIndex <= 0) continue;
    const key = normalized.slice(0, separatorIndex).trim();
    entries[key] = normalized.slice(separatorIndex + 1).trim();
  }
  return entries;
}

function upsertEnvLines(targetPath, additions) {
  const existing = fs.existsSync(targetPath) ? fs.readFileSync(targetPath, 'utf8') : '';
  const present = new Set(
    existing
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => line.split('=')[0].trim()),
  );

  const lines = [];
  for (const [key, value] of Object.entries(additions)) {
    if (!value || present.has(key)) continue;
    lines.push(`${key}=${value}`);
  }

  if (!lines.length) return { targetPath, added: [] };

  const prefix = existing.endsWith('\n') || !existing ? '' : '\n';
  const block = `${existing}${prefix}\n# Added by scripts/library/wire-local-env.mjs\n${lines.join('\n')}\n`;
  fs.writeFileSync(targetPath, block, 'utf8');
  return { targetPath, added: lines.map((line) => line.split('=')[0]) };
}

const sources = [
  path.join(repoRoot, 'apps/api/.env'),
  path.join(repoRoot, 'apps/frontend/.env.local'),
  path.join(repoRoot, 'apps/frontend/.env.production'),
  path.join(repoRoot, 'apps/ai-arcade/.env'),
];

const merged = {};
for (const source of sources) {
  Object.assign(merged, parseEnv(source));
}

const rootAdditions = {};
if (merged.SUPABASE_URL && !merged.VITE_SUPABASE_URL) {
  rootAdditions.SUPABASE_URL = merged.SUPABASE_URL;
}
if (merged.SUPABASE_ANON_KEY && !merged.VITE_SUPABASE_ANON_KEY) {
  rootAdditions.SUPABASE_ANON_KEY = merged.SUPABASE_ANON_KEY;
}
if (merged.VITE_SUPABASE_URL) rootAdditions.SUPABASE_URL = merged.VITE_SUPABASE_URL;
if (merged.VITE_SUPABASE_ANON_KEY) rootAdditions.SUPABASE_ANON_KEY = merged.VITE_SUPABASE_ANON_KEY;
if (merged.SUPABASE_URL && !merged.VITE_SUPABASE_URL) {
  rootAdditions.VITE_SUPABASE_URL = merged.SUPABASE_URL;
}
if (merged.SUPABASE_ANON_KEY && !merged.VITE_SUPABASE_ANON_KEY) {
  rootAdditions.VITE_SUPABASE_ANON_KEY = merged.SUPABASE_ANON_KEY;
}

const libraryAdditions = {};
if (rootAdditions.VITE_SUPABASE_URL || merged.VITE_SUPABASE_URL || merged.SUPABASE_URL) {
  libraryAdditions.VITE_SUPABASE_URL =
    merged.VITE_SUPABASE_URL || rootAdditions.VITE_SUPABASE_URL || merged.SUPABASE_URL;
}
if (rootAdditions.VITE_SUPABASE_ANON_KEY || merged.VITE_SUPABASE_ANON_KEY || merged.SUPABASE_ANON_KEY) {
  libraryAdditions.VITE_SUPABASE_ANON_KEY =
    merged.VITE_SUPABASE_ANON_KEY ||
    rootAdditions.VITE_SUPABASE_ANON_KEY ||
    merged.SUPABASE_ANON_KEY;
}

const results = [
  upsertEnvLines(path.join(repoRoot, '.env'), rootAdditions),
  upsertEnvLines(path.join(repoRoot, 'apps/virtual-library-blueprints/.env'), libraryAdditions),
];

console.log(JSON.stringify({ repoRoot, results }, null, 2));
