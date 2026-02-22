#!/usr/bin/env node
const fs = require('fs');
const { execFileSync } = require('child_process');
const path = require('path');

/**
 * TNF SUPER-CYCLE FLYWHEEL
 *
 * Continuous orchestration loop for specialized agents:
 * 1. Website testing (frontend/backend)
 * 2. Integration testing (API/DB/services)
 * 3. UI/UX testing
 * 4. Continuous improver
 * 5. News scout
 * 6. LLM test flywheel
 */

const ROOT_DIR = path.resolve(__dirname, '../..');
const STATE_DIR = path.join(ROOT_DIR, '.agent/runtime-state');
const LOG_DIR = path.join(ROOT_DIR, '.agent/runtime-logs');
const LAST_REPORT_PATH = path.join(STATE_DIR, 'supercycle-last.json');
const HISTORY_LOG_PATH = path.join(LOG_DIR, 'supercycle-history.jsonl');

const CONFIG = {
  continuous: process.env.SUPERCYCLE_CONTINUOUS === 'true',
  intervalMs: parseInt(process.env.SUPERCYCLE_INTERVAL_MS || '300000', 10),
  maxCycles: parseInt(process.env.SUPERCYCLE_MAX_CYCLES || '0', 10),
  failFast: process.env.SUPERCYCLE_FAIL_FAST === 'true',
};

const PHASES = [
  {
    key: 'website',
    label: 'Website Testing (Frontend/Backend)',
    script: path.join(__dirname, '../swarm/website-testing-agent.cjs'),
    required: true,
  },
  {
    key: 'integration',
    label: 'Integration Testing (API/DB/Services)',
    script: path.join(__dirname, '../swarm/integration-test-agent.cjs'),
    required: false,
  },
  {
    key: 'uiux',
    label: 'UI/UX Testing (A11y/Design/Routing)',
    script: path.join(__dirname, '../swarm/uiux-testing-agent.cjs'),
    required: false,
  },
  {
    key: 'improver',
    label: 'System Health (Improver)',
    script: path.join(__dirname, '../improver/scan.cjs'),
    required: true,
  },
  {
    key: 'scout',
    label: 'Market Intelligence (Scout)',
    script: path.join(__dirname, '../swarm/news-scout.cjs'),
    required: false,
  },
  {
    key: 'llm',
    label: 'LLM Viability & Benchmarking (PicoClaw)',
    script: path.join(__dirname, '../swarm/llm-test-flywheel.cjs'),
    required: false,
  },
];

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;

    const separatorIndex = line.indexOf('=');
    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function ensureDirs() {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function runPhase(phase) {
  if (!fs.existsSync(phase.script)) {
    const msg = `script missing: ${phase.script}`;
    if (phase.required) {
      return { key: phase.key, label: phase.label, status: 'failed', error: msg };
    }
    return { key: phase.key, label: phase.label, status: 'skipped', error: msg };
  }

  const start = Date.now();
  try {
    execFileSync('node', [phase.script], { stdio: 'inherit' });
    return {
      key: phase.key,
      label: phase.label,
      status: 'passed',
      durationMs: Date.now() - start,
    };
  } catch (error) {
    return {
      key: phase.key,
      label: phase.label,
      status: 'failed',
      durationMs: Date.now() - start,
      error: error.message,
    };
  }
}

function saveCycleReport(report) {
  fs.writeFileSync(LAST_REPORT_PATH, JSON.stringify(report, null, 2));
  fs.appendFileSync(HISTORY_LOG_PATH, `${JSON.stringify(report)}\n`);
}

async function runCycle(cycleNumber) {
  console.log('\n🌀 [Flywheel] Starting Autonomous Super-Cycle...');
  console.log(`[Flywheel] cycle=${cycleNumber}`);
  const start = Date.now();
  const phaseResults = [];

  for (let index = 0; index < PHASES.length; index += 1) {
    const phase = PHASES[index];
    console.log(`\n🔁 Phase ${index + 1}/${PHASES.length}: ${phase.label}`);
    const result = runPhase(phase);
    phaseResults.push(result);

    if (result.status === 'passed') {
      console.log(`✅ [Flywheel] ${phase.key} passed`);
    } else if (result.status === 'skipped') {
      console.log(`⚠️ [Flywheel] ${phase.key} skipped (${result.error})`);
    } else {
      console.log(`❌ [Flywheel] ${phase.key} failed (${result.error})`);
      if (CONFIG.failFast) {
        break;
      }
    }
  }

  const durationMs = Date.now() - start;
  const hasRequiredFailure = phaseResults.some((result) => {
    const phaseDef = PHASES.find((phase) => phase.key === result.key);
    return Boolean(phaseDef?.required) && result.status === 'failed';
  });
  const hasAnyFailure = phaseResults.some((result) => result.status === 'failed');

  const report = {
    timestamp: new Date().toISOString(),
    cycle: cycleNumber,
    durationMs,
    durationSeconds: Number((durationMs / 1000).toFixed(1)),
    continuous: CONFIG.continuous,
    status: hasRequiredFailure ? 'degraded' : hasAnyFailure ? 'warning' : 'healthy',
    phaseResults,
  };

  saveCycleReport(report);

  console.log(
    `\n✅ [Flywheel] Super-Cycle complete in ${report.durationSeconds}s (status=${report.status}).`
  );
  console.log(`[Flywheel] report=${LAST_REPORT_PATH}\n`);

  return { ok: !hasRequiredFailure, report };
}

async function runFlywheel() {
  loadEnvFile(path.join(ROOT_DIR, '.env.local'));
  loadEnvFile(path.join(ROOT_DIR, '.env'));
  ensureDirs();

  console.log(
    `[Flywheel] mode=${CONFIG.continuous ? 'continuous' : 'single'} intervalMs=${CONFIG.intervalMs} maxCycles=${CONFIG.maxCycles || 'infinite'} failFast=${CONFIG.failFast}`
  );

  let cycle = 0;
  while (true) {
    cycle += 1;
    const { ok } = await runCycle(cycle);

    if (!CONFIG.continuous) {
      process.exit(ok ? 0 : 1);
    }

    if (CONFIG.maxCycles > 0 && cycle >= CONFIG.maxCycles) {
      console.log(`[Flywheel] max cycles reached (${CONFIG.maxCycles}). Exiting.`);
      process.exit(0);
    }

    if (!ok) {
      console.log(
        `[Flywheel] required phase failed; continuing loop to allow autonomous recovery in ${Math.round(
          CONFIG.intervalMs / 1000
        )}s.`
      );
    } else {
      console.log(`[Flywheel] cycle healthy; next run in ${Math.round(CONFIG.intervalMs / 1000)}s.`);
    }

    await sleep(CONFIG.intervalMs);
  }
}

if (require.main === module) {
  runFlywheel().catch((error) => {
    console.error(`❌ [Flywheel] Fatal error: ${error.message}`);
    process.exit(1);
  });
}
