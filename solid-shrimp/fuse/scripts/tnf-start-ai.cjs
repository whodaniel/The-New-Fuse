#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const ROOT = process.cwd();

function run(cmd, args, extraEnv = {}) {
  const result = spawnSync(cmd, args, {
    cwd: ROOT,
    stdio: "inherit",
    env: { ...process.env, ...extraEnv },
  });
  if (result.error) {
    return { code: 1, error: result.error };
  }
  return { code: result.status ?? 0 };
}

function commandExists(cmd) {
  const check = spawnSync("sh", ["-lc", `command -v ${cmd}`], { cwd: ROOT });
  return check.status === 0;
}

function usage() {
  console.log(
    "Usage: pnpm run tnf:start -- <codex|claude|gemini> [--skip-doctor] [--no-launch] [-- ...client args]"
  );
}

let argv = process.argv.slice(2);
if (argv[0] === "--") {
  argv = argv.slice(1);
}
if (argv.length === 0 || argv.includes("-h") || argv.includes("--help")) {
  usage();
  process.exit(0);
}

if (!fs.existsSync(path.join(ROOT, ".agent"))) {
  console.error("Run from TNF repo root (missing .agent/).");
  process.exit(1);
}

const splitIndex = argv.indexOf("--");
const baseArgs = splitIndex >= 0 ? argv.slice(0, splitIndex) : argv;
const clientArgs = splitIndex >= 0 ? argv.slice(splitIndex + 1) : [];

const client = baseArgs[0];
const flags = new Set(baseArgs.slice(1));
const skipDoctor = flags.has("--skip-doctor");
const noLaunch = flags.has("--no-launch");

const clientCommandMap = {
  codex: "codex",
  claude: "claude",
  gemini: "gemini",
};

const cmd = clientCommandMap[client];
if (!cmd) {
  console.error(`Unsupported client: ${client}`);
  usage();
  process.exit(1);
}

console.log("== TNF start-ai ==");
console.log(`Client: ${client}`);

let step = run("pnpm", ["run", "-s", "tnf:onboard"]);
if (step.code !== 0) process.exit(step.code);

step = run("pnpm", ["run", "-s", "tnf:mcp:generate"]);
if (step.code !== 0) process.exit(step.code);

if (!skipDoctor) {
  step = run("pnpm", ["run", "-s", "tnf:doctor"]);
  if (step.code !== 0) {
    console.error("Doctor failed. Use --skip-doctor to bypass.");
    process.exit(step.code);
  }
}

const clientConfigPath = path.join(ROOT, "data/mcp.clients", `${client}.mcp.json`);
if (!fs.existsSync(clientConfigPath)) {
  console.error(`Missing generated config: ${clientConfigPath}`);
  process.exit(1);
}

console.log(`Client MCP config: ${clientConfigPath}`);
console.log("Exported env vars: TNF_MCP_CONFIG_PATH, MCP_CONFIG_PATH");

if (noLaunch) {
  console.log("No launch requested (--no-launch).");
  process.exit(0);
}

if (!commandExists(cmd)) {
  console.error(`Command not found in PATH: ${cmd}`);
  console.error(`Run manually after installing ${client} CLI.`);
  process.exit(1);
}

const env = {
  TNF_MCP_CONFIG_PATH: clientConfigPath,
  MCP_CONFIG_PATH: clientConfigPath,
};

step = run(cmd, clientArgs, env);
process.exit(step.code);
