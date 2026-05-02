#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');

const defaultYamlPath = path.join(repoRoot, 'openapi.yaml');
const defaultSnapshotPath = path.join(repoRoot, 'docs/api/api-docs-json.snapshot.json');

function parseArg(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return null;
  return process.argv[index + 1] || null;
}

function sortDeep(value) {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (value && typeof value === 'object') {
    const output = {};
    for (const key of Object.keys(value).sort()) {
      output[key] = sortDeep(value[key]);
    }
    return output;
  }
  return value;
}

async function fetchJsonWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function loadSourceDocument({ yamlPath, sourceUrl }) {
  if (sourceUrl) {
    const json = await fetchJsonWithTimeout(sourceUrl, 3000);
    return { document: json, source: `url:${sourceUrl}` };
  }

  const file = await fs.readFile(yamlPath, 'utf8');
  const parsed = yaml.load(file);
  return { document: parsed, source: `yaml:${yamlPath}` };
}

async function main() {
  const yamlPath = path.resolve(repoRoot, parseArg('--yaml') || defaultYamlPath);
  const snapshotPath = path.resolve(repoRoot, parseArg('--snapshot') || defaultSnapshotPath);
  const sourceUrl = parseArg('--url') || process.env.OPENAPI_SOURCE_URL || '';

  const { document, source } = await loadSourceDocument({
    yamlPath,
    sourceUrl: sourceUrl || null,
  });
  const expected = `${JSON.stringify(sortDeep(document), null, 2)}\n`;

  let actual;
  try {
    const snapshotRaw = await fs.readFile(snapshotPath, 'utf8');
    actual = `${JSON.stringify(sortDeep(JSON.parse(snapshotRaw)), null, 2)}\n`;
  } catch {
    console.error(`[openapi:check] snapshot missing: ${path.relative(repoRoot, snapshotPath)}`);
    console.error('Run: pnpm openapi:snapshot');
    process.exit(1);
  }

  if (actual !== expected) {
    const tempPath = path.join(repoRoot, 'docs/api/api-docs-json.snapshot.current.json');
    await fs.writeFile(tempPath, expected, 'utf8');
    console.error(`[openapi:check] drift detected from ${source}`);
    console.error(`[openapi:check] snapshot: ${path.relative(repoRoot, snapshotPath)}`);
    console.error(
      `[openapi:check] current : ${path.relative(repoRoot, tempPath)} (generated for inspection)`
    );
    console.error('Run: pnpm openapi:snapshot');
    process.exit(1);
  }

  console.log(`[openapi:check] no drift (${source})`);
}

main().catch((error) => {
  console.error(`[openapi:check] failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
