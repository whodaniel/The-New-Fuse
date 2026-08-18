#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Generate per-client MCP configs from the canonical repo SOT.
 * Source: data/mcp_config.json
 * Output: data/mcp.clients/<client>.mcp.json
 *
 * Also invoked by `pnpm run tnf:mcp:generate` / `tnf mcp generate`.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, 'data/mcp_config.json');
const OUT_DIR = path.join(ROOT, 'data/mcp.clients');

const CLIENTS = [
  'codex',
  'claude',
  'gemini',
  'agy',
  'cursor',
  'openclaw',
  'hermes',
  'pi',
];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, obj) {
  fs.writeFileSync(file, `${JSON.stringify(obj, null, 2)}\n`, 'utf8');
}

function withCwd(servers, cwd) {
  const out = {};
  for (const [name, cfg] of Object.entries(servers || {})) {
    const next = { ...cfg };
    if (!next.cwd) next.cwd = cwd;
    out[name] = next;
  }
  return out;
}

function buildClientConfig(base, client) {
  return {
    $schema: 'https://json.schemastore.org/mcp-config.json',
    generatedBy: 'scripts/tnf-generate-mcp-clients.cjs',
    generatedAt: new Date().toISOString(),
    source: 'data/mcp_config.json',
    client,
    mcpServers: withCwd(base.mcpServers || {}, ROOT),
  };
}

function main() {
  if (!fs.existsSync(SOURCE)) {
    console.error('Missing source config:', SOURCE);
    process.exit(1);
  }

  const base = readJson(SOURCE);
  if (!base || typeof base !== 'object' || !base.mcpServers) {
    console.error('Invalid data/mcp_config.json (missing mcpServers)');
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const client of CLIENTS) {
    const fullPath = path.join(OUT_DIR, `${client}.mcp.json`);
    writeJson(fullPath, buildClientConfig(base, client));
    console.log(`Generated ${path.relative(ROOT, fullPath)}`);
  }

  console.log('Done.');
}

main();
