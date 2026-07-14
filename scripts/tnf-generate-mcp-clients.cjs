#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const SOURCE = path.join(ROOT, "data/mcp_config.json");
const OUT_DIR = path.join(ROOT, "data/mcp.clients");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, obj) {
  fs.writeFileSync(file, `${JSON.stringify(obj, null, 2)}\n`, "utf8");
}

function buildClientConfig(base, client) {
  return {
    $schema: "https://json.schemastore.org/mcp-config.json",
    generatedBy: "scripts/tnf-generate-mcp-clients.cjs",
    generatedAt: new Date().toISOString(),
    source: "data/mcp_config.json",
    client,
    mcpServers: base.mcpServers || {},
  };
}

if (!fs.existsSync(SOURCE)) {
  console.error("Missing source config:", SOURCE);
  process.exit(1);
}

const base = readJson(SOURCE);
if (!base || typeof base !== "object" || !base.mcpServers) {
  console.error("Invalid data/mcp_config.json (missing mcpServers)");
  process.exit(1);
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const outputs = [
  ["codex", "codex.mcp.json"],
  ["claude", "claude.mcp.json"],
  ["gemini", "gemini.mcp.json"],
  ["cursor", "cursor.mcp.json"],
  ["openclaw", "openclaw.mcp.json"],
  ["hermes", "hermes.mcp.json"],
  ["pi", "pi.mcp.json"],
];

for (const [client, file] of outputs) {
  const fullPath = path.join(OUT_DIR, file);
  writeJson(fullPath, buildClientConfig(base, client));
  console.log(`Generated ${path.relative(ROOT, fullPath)}`);
}

console.log("Done.");
