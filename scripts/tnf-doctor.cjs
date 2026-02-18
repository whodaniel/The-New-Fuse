#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("node:fs");
const path = require("node:path");
const net = require("node:net");

const ROOT = process.cwd();

function abs(rel) {
  return path.join(ROOT, rel);
}

function exists(rel) {
  return fs.existsSync(abs(rel));
}

function loadJson(rel) {
  try {
    return JSON.parse(fs.readFileSync(abs(rel), "utf8"));
  } catch {
    return null;
  }
}

function checkPort(port, host = "127.0.0.1", timeoutMs = 500) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let done = false;

    const finish = (open) => {
      if (done) return;
      done = true;
      socket.destroy();
      resolve(open);
    };

    socket.setTimeout(timeoutMs);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
    socket.connect(port, host);
  });
}

async function main() {
  if (!exists(".agent")) {
    console.error("FAIL: run this from TNF repo root (missing .agent/).");
    process.exit(1);
  }

  let hardFail = false;

  console.log("TNF Doctor");
  console.log(`Workspace: ${ROOT}`);

  console.log("\n[1] Required Frontload Files");
  const requiredFiles = [
    ".agent/SYSTEM_PROMPT.md",
    ".agent/context/resource-map.md",
    ".agent/context/agent-onboarding.md",
    ".agent/workflows/frontload.md",
    "AGENTS.md",
    "data/mcp_config.json",
  ];
  for (const file of requiredFiles) {
    const ok = exists(file);
    if (!ok) hardFail = true;
    console.log(`- ${ok ? "OK" : "MISSING"} ${file}`);
  }

  console.log("\n[2] MCP Config Integrity");
  const mcpConfig = loadJson("data/mcp_config.json");
  if (!mcpConfig || typeof mcpConfig !== "object" || !mcpConfig.mcpServers) {
    hardFail = true;
    console.log("- MISSING/INVALID data/mcp_config.json");
  } else {
    const names = Object.keys(mcpConfig.mcpServers);
    console.log(`- OK mcpServers found: ${names.length}`);
    if (names.length === 0) hardFail = true;
  }

  console.log("\n[3] MCP Code Entrypoints");
  const codePaths = [
    "src/mcp/server.ts",
    "src/mcp/enhanced-tnf-mcp-server.ts",
    "src/mcp/complete-api-mcp-server.ts",
    "apps/backend/src/modules/mcp/mcp-server.service.ts",
    "tools/relay-mcp-server/index.js",
  ];
  for (const p of codePaths) {
    const ok = exists(p);
    if (!ok) hardFail = true;
    console.log(`- ${ok ? "OK" : "MISSING"} ${p}`);
  }

  console.log("\n[4] Local Service Ports (informational)");
  const ports = [
    ["Frontend", 3000],
    ["API", 3001],
    ["Backend", 3004],
    ["Gateway", 3005],
    ["Postgres", 5433],
    ["Redis", 6380],
  ];
  for (const [name, port] of ports) {
    const open = await checkPort(port);
    console.log(`- ${open ? "OPEN " : "CLOSED"} ${name} :${port}`);
  }

  console.log("\n[5] Client MCP Generated Configs");
  const generated = [
    "data/mcp.clients/codex.mcp.json",
    "data/mcp.clients/claude.mcp.json",
    "data/mcp.clients/gemini.mcp.json",
  ];
  for (const p of generated) {
    console.log(`- ${exists(p) ? "OK" : "MISSING"} ${p}`);
  }

  console.log(`\nDoctor result: ${hardFail ? "FAIL" : "PASS"}`);
  if (hardFail) process.exit(1);
}

main().catch((err) => {
  console.error("Doctor crashed:", err.message);
  process.exit(1);
});
