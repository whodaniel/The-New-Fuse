#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();

function read(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), "utf8");
}

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

function ok(message) {
  console.log(`OK: ${message}`);
}

function ensureContains(content, needle, label) {
  if (!content.includes(needle)) {
    fail(`${label} missing: ${needle}`);
    return false;
  }
  ok(`${label} contains expected entry`);
  return true;
}

function ensureRegex(content, regex, label) {
  if (!regex.test(content)) {
    fail(`${label} missing regex: ${regex}`);
    return false;
  }
  ok(`${label} matches expected pattern`);
  return true;
}

function main() {
  const rootPkg = JSON.parse(read("package.json"));
  const boot = read("scripts/orchestrator/factory-boot.sh");
  const supervisor = read("scripts/orchestrator/factory-supervisor.sh");

  const workflowCmd =
    "pnpm --filter @the-new-fuse/workflow-engine exec ts-node --compiler-options '{\"module\":\"CommonJS\"}' src/orchestrator/start.ts";

  const rootWorkflow = rootPkg.scripts?.["workflow-router:dev"];
  if (rootWorkflow !== workflowCmd) {
    fail(
      `package.json script workflow-router:dev mismatch.\nExpected: ${workflowCmd}\nActual:   ${rootWorkflow}`
    );
  } else {
    ok("package.json workflow-router:dev is aligned");
  }

  ensureContains(
    boot,
    "pgrep -f \"ts-node --compiler-options.*src/orchestrator/start.ts\"",
    "factory-boot workflow pgrep"
  );
  ensureContains(
    boot,
    "pnpm --filter @the-new-fuse/workflow-engine exec ts-node --compiler-options '{\\\"module\\\":\\\"CommonJS\\\"}' src/orchestrator/start.ts",
    "factory-boot workflow launch"
  );

  ensureContains(boot, "pgrep -f \"ts-node src/master-clock.ts\"", "factory-boot master pgrep");
  ensureContains(boot, "pgrep -f \"ts-node src/broker-agent.ts\"", "factory-boot broker pgrep");
  ensureContains(
    boot,
    "pgrep -f \"ts-node src/director-agent.ts\"",
    "factory-boot director pgrep"
  );

  ensureContains(
    supervisor,
    "process_running \"ts-node src/master-clock.ts\"",
    "factory-supervisor master check"
  );
  ensureContains(
    supervisor,
    "process_running \"ts-node src/broker-agent.ts\"",
    "factory-supervisor broker check"
  );
  ensureContains(
    supervisor,
    "process_running \"ts-node src/director-agent.ts\"",
    "factory-supervisor director check"
  );
  ensureContains(
    supervisor,
    "process_running \"ts-node --compiler-options.*src/orchestrator/start.ts\"",
    "factory-supervisor workflow check"
  );

  ensureRegex(
    boot,
    /REDIS_URL="\$\{REDIS_URL:-\$\{CLOUD_RUNTIME_REDIS_URL:-\$\{LIVE_REDIS_URL:-\$\{REDIS_PRIVATE_URL:-\$\{REDIS_TLS_URL:-redis:\/\/localhost:6379\}\}\}\}\}"/,
    "factory-boot redis fallback chain"
  );

  const redisCliLines = boot
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("redis-cli "));
  const badRedisCli = redisCliLines.filter(
    (line) => !line.startsWith("redis-cli -u \"${REDIS_URL}\" ") && !line.startsWith("redis-cli -u")
  );
  if (badRedisCli.length > 0) {
    fail(`factory-boot has redis-cli calls without explicit -u REDIS_URL:\n${badRedisCli.join("\n")}`);
  } else {
    ok("factory-boot redis-cli calls are consistently targeted");
  }

  if (process.exitCode) {
    console.error("\nOrchestration audit result: FAIL");
    process.exit(process.exitCode);
  }
  console.log("\nOrchestration audit result: PASS");
}

main();
