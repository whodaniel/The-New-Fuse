const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const SCRIPT_PATH = path.join(__dirname, "tnf-doctor.cjs");

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "tnf-doctor-"));
}

function writeFile(root, relPath, contents = "x") {
  const absPath = path.join(root, relPath);
  fs.mkdirSync(path.dirname(absPath), { recursive: true });
  fs.writeFileSync(absPath, contents);
}

function seedDoctorRequiredFiles(root) {
  const requiredFiles = [
    ".agent/SYSTEM_PROMPT.md",
    ".agent/context/resource-map.md",
    ".agent/context/agent-onboarding.md",
    ".agent/workflows/frontload.md",
    "AGENTS.md",
    "data/mcp_config.json",
    "src/mcp/server.ts",
    "src/mcp/enhanced-tnf-mcp-server.ts",
    "src/mcp/complete-api-mcp-server.ts",
    "apps/backend/src/modules/mcp/mcp-server.service.ts",
    "tools/relay-mcp-server/index.js",
    "data/mcp.clients/codex.mcp.json",
    "data/mcp.clients/claude.mcp.json",
    "data/mcp.clients/gemini.mcp.json",
  ];

  for (const relPath of requiredFiles) {
    if (relPath.endsWith(".json")) {
      const json =
        relPath === "data/mcp_config.json"
          ? JSON.stringify({ mcpServers: { example: { command: "node" } } }, null, 2)
          : "{}";
      writeFile(root, relPath, json);
    } else {
      writeFile(root, relPath);
    }
  }
}

function runDoctor(cwd, extraEnv = {}, args = []) {
  return spawnSync(process.execPath, [SCRIPT_PATH, ...args], {
    cwd,
    env: {
      ...process.env,
      TNF_REQUIRE_CLOUD_DB: "1",
      TNF_ALLOW_LOCAL_DB: "0",
      ...extraEnv,
    },
    encoding: "utf8",
  });
}

test("loads DATABASE_URL from .env.local and passes DB policy check", () => {
  const root = makeTempDir();
  seedDoctorRequiredFiles(root);
  writeFile(root, ".env.local", "DATABASE_URL=postgres://cloud-host:5432/tnf\n");

  const result = runDoctor(root);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /\[6\] Cloud-Rooted DB Policy/);
  assert.match(result.stdout, /- OK DATABASE_URL policy check passed/);
  assert.match(result.stdout, /Doctor result: PASS/);
});

test("prefers .env.local over .env when both define DATABASE_URL", () => {
  const root = makeTempDir();
  seedDoctorRequiredFiles(root);
  writeFile(root, ".env.local", "DATABASE_URL=postgres://cloud-host:5432/tnf\n");
  writeFile(root, ".env", "DATABASE_URL=postgres://localhost:5432/tnf\n");

  const result = runDoctor(root);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /- OK DATABASE_URL policy check passed/);
  assert.match(result.stdout, /Doctor result: PASS/);
});

test("allows local DATABASE_URL when --allow-local-db is provided", () => {
  const root = makeTempDir();
  seedDoctorRequiredFiles(root);

  const result = runDoctor(
    root,
    { DATABASE_URL: "postgres://localhost:5432/tnf" },
    ["--allow-local-db"]
  );

  assert.equal(result.status, 0);
  assert.match(result.stdout, /- OK DATABASE_URL policy check passed/);
  assert.match(result.stdout, /Doctor result: PASS/);
});

test("accepts pnpm-style '--' argument separator", () => {
  const root = makeTempDir();
  seedDoctorRequiredFiles(root);

  const result = runDoctor(
    root,
    { DATABASE_URL: "postgres://localhost:5432/tnf" },
    ["--", "--allow-local-db"]
  );

  assert.equal(result.status, 0);
  assert.match(result.stdout, /- OK DATABASE_URL policy check passed/);
  assert.match(result.stdout, /Doctor result: PASS/);
});

test("supports --mode local to bypass cloud-rooted DB requirement", () => {
  const root = makeTempDir();
  seedDoctorRequiredFiles(root);

  const result = runDoctor(root, { DATABASE_URL: "postgres://localhost:5432/tnf" }, ["--mode", "local"]);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /- OK DATABASE_URL policy check passed/);
  assert.match(result.stdout, /Doctor result: PASS/);
});

test("allows missing DATABASE_URL in --mode local", () => {
  const root = makeTempDir();
  seedDoctorRequiredFiles(root);

  const result = runDoctor(root, {}, ["--mode", "local"]);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /WARN DATABASE_URL is not set \(allowed in local mode\)/);
  assert.match(result.stdout, /Doctor result: PASS/);
});
