#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("node:fs");
const path = require("node:path");
const net = require("node:net");
const dotenv = require("dotenv");

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

function isLocalDatabaseUrl(url) {
  if (!url) return true;
  const lower = String(url).toLowerCase();
  return (
    lower.includes("localhost") ||
    lower.includes("127.0.0.1") ||
    lower.includes("::1") ||
    lower.startsWith("sqlite:")
  );
}

function printUsage() {
  console.log("Usage: node scripts/tnf-doctor.cjs [options]");
  console.log("");
  console.log("Options:");
  console.log("  -h, --help                Show this help");
  console.log("      --mode <mode>         Execution mode: cloud (default) or local");
  console.log("      --allow-local-db      Set TNF_ALLOW_LOCAL_DB=1 for this run");
  console.log("      --require-cloud-db    Set TNF_REQUIRE_CLOUD_DB=1 for this run");
  console.log("      --no-require-cloud-db Set TNF_REQUIRE_CLOUD_DB=0 for this run");
  console.log("      --database-url <url>  Override DATABASE_URL for this run");
}

function parseArgs(argv) {
  const envOverrides = {};

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === "--") {
      continue;
    }

    if (arg === "-h" || arg === "--help") {
      return { help: true, envOverrides };
    }

    if (arg === "--allow-local-db") {
      envOverrides.TNF_ALLOW_LOCAL_DB = "1";
      continue;
    }

    if (arg === "--mode") {
      const next = argv[i + 1];
      if (!next) {
        throw new Error("Missing value for --mode");
      }
      if (next === "local") {
        envOverrides.TNF_ALLOW_LOCAL_DB = "1";
        envOverrides.TNF_REQUIRE_CLOUD_DB = "0";
      } else if (next === "cloud") {
        envOverrides.TNF_REQUIRE_CLOUD_DB = "1";
      } else {
        throw new Error(`Invalid --mode value: ${next}. Expected 'cloud' or 'local'`);
      }
      i += 1;
      continue;
    }

    if (arg.startsWith("--mode=")) {
      const mode = arg.slice("--mode=".length);
      if (mode === "local") {
        envOverrides.TNF_ALLOW_LOCAL_DB = "1";
        envOverrides.TNF_REQUIRE_CLOUD_DB = "0";
      } else if (mode === "cloud") {
        envOverrides.TNF_REQUIRE_CLOUD_DB = "1";
      } else {
        throw new Error(`Invalid --mode value: ${mode}. Expected 'cloud' or 'local'`);
      }
      continue;
    }

    if (arg === "--require-cloud-db") {
      envOverrides.TNF_REQUIRE_CLOUD_DB = "1";
      continue;
    }

    if (arg === "--no-require-cloud-db") {
      envOverrides.TNF_REQUIRE_CLOUD_DB = "0";
      continue;
    }

    if (arg === "--database-url") {
      const next = argv[i + 1];
      if (!next) {
        throw new Error("Missing value for --database-url");
      }
      envOverrides.DATABASE_URL = next;
      i += 1;
      continue;
    }

    if (arg.startsWith("--database-url=")) {
      envOverrides.DATABASE_URL = arg.slice("--database-url=".length);
      continue;
    }

    throw new Error(`Unknown option: ${arg}`);
  }

  return { help: false, envOverrides };
}

async function main() {
  let parsed;
  try {
    parsed = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`FAIL: ${error.message}`);
    printUsage();
    process.exit(2);
  }

  if (parsed.help) {
    printUsage();
    process.exit(0);
  }

  Object.assign(process.env, parsed.envOverrides);

  if (!exists(".agent")) {
    console.error("FAIL: run this from TNF repo root (missing .agent/).");
    process.exit(1);
  }

  dotenv.config({ path: abs(".env.local") });
  dotenv.config({ path: abs(".env") });

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

  console.log("\n[6] Cloud-Rooted DB Policy");
  const dbUrl = process.env.DATABASE_URL || "";
  const allowLocal = process.env.TNF_ALLOW_LOCAL_DB === "1";
  const cloudRequired = process.env.TNF_REQUIRE_CLOUD_DB !== "0";
  if (!dbUrl) {
    if (cloudRequired) {
      hardFail = true;
      console.log("- FAIL DATABASE_URL is not set");
    } else {
      console.log("- WARN DATABASE_URL is not set (allowed in local mode)");
    }
  } else if (cloudRequired && !allowLocal && isLocalDatabaseUrl(dbUrl)) {
    hardFail = true;
    console.log("- FAIL DATABASE_URL is local while TNF requires cloud-rooted execution");
    console.log("- Hint: use cloud DATABASE_URL or set TNF_ALLOW_LOCAL_DB=1 for temporary override");
  } else {
    console.log("- OK DATABASE_URL policy check passed");
  }

  console.log(`\nDoctor result: ${hardFail ? "FAIL" : "PASS"}`);
  if (hardFail) process.exit(1);
}

main().catch((err) => {
  console.error("Doctor crashed:", err.message);
  process.exit(1);
});
