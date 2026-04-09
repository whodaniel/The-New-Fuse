#!/usr/bin/env node
const { spawnSync } = require("node:child_process");

const passthroughArgs = process.argv.slice(2).filter((arg) => arg !== "--passWithNoTests");
const result = spawnSync("hardhat", ["test", ...passthroughArgs], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

if (typeof result.status === "number") {
  process.exit(result.status);
}

process.exit(1);
