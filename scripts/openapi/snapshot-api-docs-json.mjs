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
  const outputPath = path.resolve(repoRoot, parseArg('--out') || defaultSnapshotPath);
  const sourceUrl = parseArg('--url') || process.env.OPENAPI_SOURCE_URL || '';

  const { document, source } = await loadSourceDocument({
    yamlPath,
    sourceUrl: sourceUrl || null,
  });
  const normalized = sortDeep(document);
  const rendered = `${JSON.stringify(normalized, null, 2)}\n`;

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, rendered, 'utf8');

  console.log(`[openapi:snapshot] source=${source}`);
  console.log(`[openapi:snapshot] wrote ${path.relative(repoRoot, outputPath)}`);
}

main().catch((error) => {
  console.error(`[openapi:snapshot] failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
