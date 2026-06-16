#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("node:fs");
const path = require("node:path");
const net = require("node:net");
const { spawnSync } = require("node:child_process");
const dotenv = require("dotenv");
const WebSocket = require("ws");
const postgres = require("postgres");

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

function loadText(rel) {
  try {
    return fs.readFileSync(abs(rel), "utf8").trim();
  } catch {
    return "";
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
  console.log("      --live-api-url <url>  Override live API base URL for checks");
  console.log("      --skip-live-checks    Skip live web/API checks");
}

function parseArgs(argv) {
  const envOverrides = {};
  const options = {
    liveApiUrl: "",
    skipLiveChecks: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === "--") {
      continue;
    }

    if (arg === "-h" || arg === "--help") {
      return { help: true, envOverrides, options };
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

    if (arg === "--live-api-url") {
      const next = argv[i + 1];
      if (!next) {
        throw new Error("Missing value for --live-api-url");
      }
      options.liveApiUrl = next;
      i += 1;
      continue;
    }

    if (arg.startsWith("--live-api-url=")) {
      options.liveApiUrl = arg.slice("--live-api-url=".length);
      continue;
    }

    if (arg === "--skip-live-checks") {
      options.skipLiveChecks = true;
      continue;
    }

    throw new Error(`Unknown option: ${arg}`);
  }

  return { help: false, envOverrides, options };
}

function runShellCommand(command) {
  const result = spawnSync("/bin/zsh", ["-lc", command], { encoding: "utf8" });
  return {
    ok: result.status === 0,
    stdout: String(result.stdout || ""),
    stderr: String(result.stderr || ""),
    status: result.status,
  };
}

function runNodeScript(args) {
  const result = spawnSync("node", args, {
    encoding: "utf8",
    cwd: ROOT,
    env: process.env,
  });
  return {
    ok: result.status === 0,
    stdout: String(result.stdout || ""),
    stderr: String(result.stderr || ""),
    status: result.status,
  };
}

function detectCloudflareApiBaseUrl() {
  const envUrl = process.env.API_BASE_URL || process.env.TNF_API_BASE || process.env.LIVE_API_BASE_URL;
  if (envUrl && envUrl.includes("thenewfuse.com")) return envUrl;
  
  // Default production URL for the new stack
  return "https://api.thenewfuse.com";
}

async function checkHttp(url, timeoutMs = 2500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: { accept: "application/json,text/plain,*/*" },
    });
    return { ok: response.ok, status: response.status, error: "" };
  } catch (error) {
    return { ok: false, status: 0, error: error?.message || String(error) };
  } finally {
    clearTimeout(timer);
  }
}

async function checkRelayPing(port = 3000) {
  return new Promise((resolve) => {
    const url = `ws://127.0.0.1:${port}/ws`;
    const ws = new WebSocket(url);
    let done = false;

    const finish = (ok) => {
      if (done) return;
      done = true;
      ws.terminate();
      resolve(ok);
    };

    const timer = setTimeout(() => finish(false), 2000);

    ws.on("open", () => {
      ws.send(
        JSON.stringify({
          type: "AGENT_REGISTER",
          source: "doctor-ping",
          payload: { agent: { id: "doctor-ping", name: "Doctor Ping" } },
        })
      );
      setTimeout(() => {
        ws.send(
          JSON.stringify({
            type: "MESSAGE_SEND",
            source: "doctor-ping",
            payload: {
              to: "broadcast",
              content: "DOCTOR PING " + Date.now(),
              messageType: "text",
            },
          })
        );
        clearTimeout(timer);
        finish(true);
      }, 500);
    });

    ws.on("error", () => finish(false));
  });
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
    { path: "src/mcp/server.ts", critical: true },
    { path: "src/mcp/enhanced-tnf-mcp-server.ts", critical: true },
    { path: "src/mcp/complete-api-mcp-server.ts", critical: true },
    { path: "apps/backend/src/modules/mcp/mcp-server.service.ts", critical: true },
    { path: "tools/relay-mcp-server/index.js", critical: false },
  ];
  for (const entry of codePaths) {
    const ok = exists(entry.path);
    if (!ok && entry.critical) hardFail = true;
    console.log(`- ${ok ? "OK" : entry.critical ? "MISSING" : "WARN (OPTIONAL)"} ${entry.path}`);
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
    "data/mcp.clients/cursor.mcp.json",
  ];
  for (const p of generated) {
    console.log(`- ${exists(p) ? "OK" : "MISSING"} ${p}`);
  }

  console.log("\n[6] Cloud-Rooted DB Policy");
  const dbUrl = process.env.DATABASE_URL || "";
  const allowLocal = process.env.TNF_ALLOW_LOCAL_DB === "1";
  const cloudRequired = process.env.TNF_REQUIRE_CLOUD_DB !== "0";
  if (!dbUrl) {
    if (cloudRequired && !parsed.options.skipLiveChecks) {
      // B1: cross-check cloud API health before hard-failing on missing
      // DATABASE_URL. A healthy cloud API lets us relax to WARN because
      // authoritative platform state lives in the cloud regardless of
      // local DB presence.
      const cloudApiBase = detectCloudflareApiBaseUrl();
      let cloudOk = false;
      if (cloudApiBase) {
        const primary = await checkHttp(`${cloudApiBase}/api/health`, 2500);
        if (primary.ok) {
          cloudOk = true;
        } else {
          const root = await checkHttp(`${cloudApiBase}/health`, 2500);
          cloudOk = root.ok;
        }
      }
      if (cloudOk) {
        console.log(`- INFO DATABASE_URL not set; cloud API verified at ${cloudApiBase}`);
        console.log("- WARN local DB unavailable but cloud-routed execution healthy (relaxed)");
      } else {
        hardFail = true;
        console.log("- FAIL DATABASE_URL is not set AND cloud API unreachable");
      }
    } else if (cloudRequired) {
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
    
    // Check for pgvector extension
    try {
      const sql = postgres(dbUrl, { connect_timeout: 5, max: 1 });
      const result = await sql`SELECT 1 FROM pg_extension WHERE extname = 'vector'`;
      if (result.length > 0) {
        console.log("- OK pgvector extension detected");
      } else {
        hardFail = true;
        console.log("- FAIL pgvector extension not found in database");
      }
      await sql.end();
    } catch (err) {
      console.log(`- WARN database connection failed during pgvector check: ${err.message}`);
    }
  }

  console.log("\n[7] Live Web/API Checks");
  if (parsed.options.skipLiveChecks) {
    console.log("- SKIPPED (--skip-live-checks)");
  } else {
    const configuredLiveApi = (
      parsed.options.liveApiUrl ||
      process.env.LEDGER_API_BASE ||
      process.env.LIVE_API_BASE_URL ||
      process.env.API_BASE_URL ||
      process.env.TNF_API_BASE ||
      loadText(".agent/runtime-state/live-api-url.txt") ||
      ""
    )
      .trim()
      .replace(/\/$/, "");

    let liveApiBase = configuredLiveApi;
    if (!liveApiBase || (isLocalDatabaseUrl(liveApiBase) && cloudRequired) || liveApiBase.includes("cloud_runtime.app")) {
      const detected = detectCloudflareApiBaseUrl();
      if (detected) liveApiBase = detected;
    }

    if (!liveApiBase) {
      if (cloudRequired) {
        hardFail = true;
        console.log("- FAIL no live API URL configured/detected");
      } else {
        console.log("- WARN no live API URL configured/detected");
      }
    } else {
      console.log(`- API base: ${liveApiBase}`);
      const healthApi = await checkHttp(`${liveApiBase}/api/health`);
      const healthRoot = await checkHttp(`${liveApiBase}/health`);
      if (healthApi.ok) {
        console.log(`- OK ${liveApiBase}/api/health (${healthApi.status})`);
      } else if (healthRoot.ok) {
        console.log(`- OK ${liveApiBase}/health (${healthRoot.status})`);
      } else if (healthApi.status === 0 && healthRoot.status === 0) {
        console.log("- WARN live API unreachable from current shell/network");
      } else {
        hardFail = true;
        console.log("- FAIL live API health endpoint unreachable");
      }
    }
  }

  console.log("\n[8] Deployment CLI Readiness");
  const gcloud = runShellCommand("gcloud auth list --format='value(account)' --filter=status:ACTIVE");
  if (gcloud.ok && gcloud.stdout.trim()) {
    console.log(`- OK gcloud auth status: ${gcloud.stdout.trim()}`);
  } else {
    console.log("- WARN gcloud CLI not authenticated or unavailable");
  }

  const wrangler = runShellCommand("wrangler whoami");
  if (wrangler.ok) {
    console.log("- OK wrangler (Cloudflare) authenticated");
  } else {
    console.log("- WARN wrangler CLI unavailable or not authenticated");
  }

  const gh = runShellCommand("gh auth status");
  if (gh.ok) {
    console.log("- OK gh auth status");
  } else {
    console.log("- WARN gh auth not ready");
  }

  console.log("\n[9] Orchestration Runtime Scripts");
  const runtimeScripts = [
    "scripts/orchestrator/factory-boot.sh",
    "scripts/orchestrator/factory-supervisor.sh",
    "scripts/orchestrator/supercycle-heartbeat-loop.sh",
  ];
  for (const script of runtimeScripts) {
    const ok = exists(script);
    // These are important but maybe not "doctor-failing" critical for everyone
    console.log(`- ${ok ? "OK" : "WARN"} ${script}`);
  }

  console.log("\n[10] Relay Server WebSocket Ping");
  if (await checkPort(3000)) {
    try {
      const ok = await checkRelayPing(3000);
      if (!ok) {
        console.log("- WARN WebSocket ping failed (ws://127.0.0.1:3000/ws) - may be cloud-routed");
      } else {
        console.log("- OK WebSocket ping success");
      }
    } catch (err) {
      console.log(`- WARN WebSocket ping error: ${err.message}`);
    }
  } else {
    console.log("- SKIP Relay Server is not running on :3000");
  }

  console.log("\n[11] Stripe Projects Compliance");
  const stripeJson = exists("stripe.json");
  const projectsDir = exists(".projects/");
  console.log(`- ${stripeJson ? "OK" : "MISSING"} stripe.json`);
  console.log(`- ${projectsDir ? "OK" : "MISSING"} .projects/ directory`);
  
  if (stripeJson) {
    const config = loadJson("stripe.json");
    if (config && config.env_mapping) {
      console.log("- OK stripe.json env_mapping defined");
    } else {
      console.log("- WARN stripe.json missing env_mapping");
    }
  }

  console.log("\n[12] WhatsApp Bridge Health");
  const whatsappHealth = runNodeScript([
    "scripts/protocols/whatsapp-bridge-health-check.cjs",
    "--json",
  ]);
  const whatsappPayload = (() => {
    try {
      return JSON.parse(whatsappHealth.stdout || "{}");
    } catch {
      return null;
    }
  })();

  if (!whatsappPayload || typeof whatsappPayload !== "object") {
    console.log("- WARN unable to parse WhatsApp bridge verifier output");
    if (whatsappHealth.stderr.trim()) {
      console.log(`- Detail: ${whatsappHealth.stderr.trim()}`);
    }
  } else {
    const bridge = whatsappPayload.bridge || {};
    const checks = whatsappPayload.checks || {};
    const runtime = whatsappPayload.runtime || {};
    const filesystem = whatsappPayload.filesystem || {};
    const lifecycle = whatsappPayload.lifecycle || "unknown";
    const httpReachable = checks.httpReachable === true;
    const connected = checks.connected === true;
    const sessionPresent = checks.sessionPresent === true;
    const processPresent = checks.processPresent === true;
    const queueLength = Number.isFinite(Number(bridge.queueLength)) ? Number(bridge.queueLength) : -1;
    const status = bridge.status || "unknown";
    const httpStatusCode = bridge.httpStatusCode || 0;
    const processCount = Array.isArray(runtime.processMatches) ? runtime.processMatches.length : 0;
    const logPath = filesystem.logPath || "~/.hermes/whatsapp/bridge.log";

    console.log(
      `- ${httpReachable ? "OK" : "WARN"} HTTP ${httpStatusCode || "n/a"} status=${status} queue=${queueLength}`
    );
    console.log(`- INFO lifecycle=${lifecycle}`);
    console.log(
      `- ${connected ? "OK" : "WARN"} connected=${connected ? "yes" : "no"} session=${
        sessionPresent ? "present" : "missing"
      } processes=${processCount}`
    );
    if (!processPresent) {
      console.log("- WARN no WhatsApp bridge/gateway processes detected");
    }
    console.log(`- Log: ${logPath}`);
  }

  console.log(`\nDoctor result: ${hardFail ? "FAIL" : "PASS"}`);
  if (hardFail) process.exit(1);
}

main().catch((err) => {
  console.error("Doctor crashed:", err.message);
  process.exit(1);
});
