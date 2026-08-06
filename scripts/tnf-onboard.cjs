#!/usr/bin/env node
// scripts/tnf-onboard.cjs — rebuilt under FULL TOP-LEVEL authorization 2026-08-06
// Canonical mandate: docs/protocols/TURN_ZERO_MANDATE.md
const fs = require('fs');
const path = require('path');

const os = require('os');
const { execSync } = require('child_process');

const START = Date.now();
console.log("[ONBOARDER] START", new Date(START).toISOString());

// 0. System & Environment Context Surface
try {
  const user = os.userInfo().username;
  const hostname = os.hostname();
  const branch = execSync('git rev-parse --abbrev-ref HEAD 2>/dev/null', { encoding: 'utf8' }).trim();
  const commit = execSync('git rev-parse --short HEAD 2>/dev/null', { encoding: 'utf8' }).trim();
  console.log(`[ONBOARDER] context: user=${user} host=${hostname} platform=${os.platform()} branch=${branch} (${commit})`);
} catch (e) {
  /* fallback */
}

// 1. Light startup (interactive mode per mandate)
const swarmCtxPath = path.join(os.homedir(), '.tnf/swarm-context.md');
const alertsPath = path.join(os.homedir(), '.tnf/alerts.json');
console.log("[ONBOARDER] swarm-context:", fs.existsSync(swarmCtxPath) ? "FOUND" : "MISSING");
console.log("[ONBOARDER] alerts:", fs.existsSync(alertsPath) ? "FOUND" : "MISSING");

// 2. Read mandate (INSPECT)
const mandatePath = 'docs/protocols/TURN_ZERO_MANDATE.md';
console.log("[ONBOARDER] mandate:", fs.existsSync(mandatePath) ? "CANONICAL FOUND" : "MISSING");

// 3. Verify core files (measure, don't mutate unconditionally)
const files = [
  '.agent/SYSTEM_PROMPT.md',
  '.agent/workflows/frontload.md',
  'docs/protocols/LIVING_STATE.md',
  'AGENT_STATUS_LEDGER.md',
];
files.forEach(f => console.log("[ONBOARDER] file-check", f, ":", fs.existsSync(f) ? "OK" : "MISSING"));

// 4. ASSIMILATE_CHECK stub: report gaps but don't write to redis directly (autonomous-safe)
console.log("[ONBOARDER] ASSIMILATE_CHECK: audit-2026-08-06-full-tnf.md exists =", fs.existsSync('audit-2026-08-06-full-tnf.md'));

// 5. Report (no mutations beyond this script creation + log)
console.log("[ONBOARDER] ELAPSED_MS", Date.now() - START);
console.log("[ONBOARDER] COMPLETE — authorization: FULL TOP-LEVEL (Daniel). Mutation: this file rebuilt only. No git push made.");
