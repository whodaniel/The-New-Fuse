#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();

function exists(relPath) {
  return fs.existsSync(path.join(ROOT, relPath));
}

function readJson(relPath) {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, relPath), "utf8"));
  } catch {
    return null;
  }
}

function listFiles(relDir, matcher) {
  const out = [];

  function walk(absDir, relPrefix = "") {
    if (!fs.existsSync(absDir)) return;
    const entries = fs.readdirSync(absDir, { withFileTypes: true });
    for (const entry of entries) {
      const rel = path.join(relPrefix, entry.name);
      const abs = path.join(absDir, entry.name);
      if (entry.isDirectory()) {
        walk(abs, rel);
      } else if (!matcher || matcher(rel)) {
        out.push(rel);
      }
    }
  }

  walk(path.join(ROOT, relDir));
  return out.sort();
}

function printHeader(title) {
  console.log(`\n=== ${title} ===`);
}

function printMcpConfig(relPath) {
  const json = readJson(relPath);
  if (!json || !json.mcpServers) {
    console.log(`- ${relPath}: missing or invalid`);
    return;
  }

  const names = Object.keys(json.mcpServers);
  console.log(`- ${relPath}: ${names.length} servers`);
  for (const name of names) {
    const def = json.mcpServers[name] || {};
    const cmd = def.command || "<none>";
    const args = Array.isArray(def.args) ? def.args.join(" ") : "";
    console.log(`  - ${name}: ${cmd}${args ? ` ${args}` : ""}`);
  }
}

if (!exists(".agent")) {
  console.error("This command must run from TNF repo root (missing .agent/).");
  process.exit(1);
}

console.log("TNF Session Bootstrap");
console.log(`Workspace: ${ROOT}`);

printHeader("Frontload Checklist");
[
  ".agent/SYSTEM_PROMPT.md",
  ".agent/context/resource-map.md",
  ".agent/context/agent-onboarding.md",
  ".agent/workflows/frontload.md",
  ".agent/handoff_notes.txt",
].forEach((p) => console.log(`- ${p}: ${exists(p) ? "present" : "missing"}`));

printHeader("Specialized Agent Files");
const tnfAgents = listFiles(".agent/agents", (f) => f.endsWith(".md"));
const claudeAgents = listFiles(".claude/agents", (f) => f.endsWith(".md"));
console.log(`- .agent/agents: ${tnfAgents.length}`);
console.log(`- .claude/agents: ${claudeAgents.length}`);
console.log(`- .claude/commands: ${listFiles(".claude/commands", (f) => f.endsWith(".md")).length}`);
console.log(`- .gemini files: ${listFiles(".gemini", () => true).length}`);

printHeader("Skills");
const tnfSkills = listFiles(".agent/skills", (f) => path.basename(f) === "SKILL.md");
const claudeSkills = listFiles(".claude/skills", (f) => f.endsWith(".md"));
console.log(`- .agent/skills SKILL.md count: ${tnfSkills.length}`);
console.log(`- .claude/skills count: ${claudeSkills.length}`);
console.log("- Sample TNF skills:");
tnfSkills.slice(0, 15).forEach((p) => console.log(`  - ${path.dirname(p)}`));

printHeader("MCP Config Inventory");
[
  "data/mcp_config.json",
  "tools/config-files/mcp_config.json",
  "tools/config-files/enhanced_mcp_config.json",
  "packages/jules-skill/mcp-config.example.json",
].forEach(printMcpConfig);

printHeader("MCP Server Code Paths");
[
  "src/mcp/server.ts",
  "src/mcp/enhanced-tnf-mcp-server.ts",
  "src/mcp/complete-api-mcp-server.ts",
  "tools/relay-mcp-server/index.js",
  "apps/backend/src/modules/mcp/mcp-server.service.ts",
  "apps/mcp-servers/tnf-network-mcp/src/index.ts",
  "apps/mcp-servers/devops-bridge/src/index.ts",
].forEach((p) => console.log(`- ${p}: ${exists(p) ? "present" : "missing"}`));

printHeader("How To Start New Sessions");
console.log("- Run: pnpm run tnf:onboard");
console.log("- Read: AGENTS.md");
console.log("- Optional shell auto-bootstrap: docs/TNF_SESSION_ONBOARDING.md");
