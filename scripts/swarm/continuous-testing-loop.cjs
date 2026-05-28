#!/usr/bin/env node
/**
 * TNF CONTINUOUS TESTING LOOP
 *
 * This is the master orchestrator for continuous testing.
 * It runs multiple specialized agents in a constant loop:
 *
 * 1. Website Testing Agent - Frontend/Backend testing
 * 2. Improver Agent - System health and tech debt
 * 3. Integration Agent - API and database testing
 * 4. UI/UX Agent - Accessibility and design consistency
 *
 * The loop runs continuously until the system is production-ready.
 */

const { singleInstanceGuard } = require('../lib/tnf-single-instance-guard.cjs');
const _guard = singleInstanceGuard({ lockName: 'continuous-testing-loop', staleMs: 10 * 60 * 1000 });
if (!_guard.acquired) {
  console.log(JSON.stringify({ ok: true, skipped: 'already-running', lock: _guard.existingLock }));
  process.exit(0);
}

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Load environment
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

const ROOT_DIR = path.resolve(__dirname, '../..');
loadEnvFile(path.join(ROOT_DIR, '.env.local'));
loadEnvFile(path.join(ROOT_DIR, '.env'));

// Configuration
const CONFIG = {
  loopIntervalMs: parseInt(process.env.TEST_LOOP_INTERVAL || '300000', 10), // 5 min default
  maxIterations: parseInt(process.env.TEST_MAX_ITERATIONS || '0', 10), // 0 = infinite
  targetScore: parseInt(process.env.TEST_TARGET_SCORE || '95', 10),
  continueAfterTarget: process.env.TEST_CONTINUE_AFTER_TARGET === '1',
  agentTimeoutMs: parseInt(process.env.TEST_AGENT_TIMEOUT_MS || '900000', 10),
  enableImprover: process.env.TEST_ENABLE_IMPROVER !== '0',
  reportDir: path.join(ROOT_DIR, '.agent/test-reports'),
  statusFile: path.join(ROOT_DIR, '.agent/testing-status.json'),
};

// Agent scripts
const AGENTS = {
  website: path.join(ROOT_DIR, 'scripts/swarm/website-testing-agent.cjs'),
  improver: path.join(ROOT_DIR, 'scripts/improver/scan.cjs'),
  integration: path.join(ROOT_DIR, 'scripts/swarm/integration-test-agent.cjs'),
  uiux: path.join(ROOT_DIR, 'scripts/swarm/uiux-testing-agent.cjs'),
};

// State tracking
let state = {
  iteration: 0,
  startTime: Date.now(),
  lastRun: null,
  bestScore: 0,
  currentScore: 0,
  status: 'running',
  issues: [],
  fixes: [],
};

// Load previous state if exists
function loadState() {
  if (fs.existsSync(CONFIG.statusFile)) {
    try {
      const saved = JSON.parse(fs.readFileSync(CONFIG.statusFile, 'utf8'));
      state = { ...state, ...saved };
      console.log('📂 Loaded previous state from', CONFIG.statusFile);
    } catch (e) {
      console.log('⚠️ Could not load previous state, starting fresh');
    }
  }
}

// Save state
function saveState() {
  if (!fs.existsSync(path.dirname(CONFIG.statusFile))) {
    fs.mkdirSync(path.dirname(CONFIG.statusFile), { recursive: true });
  }
  fs.writeFileSync(CONFIG.statusFile, JSON.stringify(state, null, 2));
}

// Run a single agent
function runAgent(name, scriptPath) {
  console.log(`\n🤖 Running ${name} agent...`);
  const start = Date.now();

  if (!fs.existsSync(scriptPath)) {
    console.log(`⚠️ Agent script not found: ${scriptPath}`);
    return { success: false, output: 'Script not found' };
  }

  try {
    const output = execSync(`node "${scriptPath}"`, {
      cwd: ROOT_DIR,
      encoding: 'utf8',
      timeout: CONFIG.agentTimeoutMs,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const duration = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`✅ ${name} completed in ${duration}s`);
    return { success: true, output, duration };
  } catch (error) {
    const duration = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`❌ ${name} failed after ${duration}s`);
    const stderr = error.stderr?.toString().trim();
    const stdout = error.stdout?.toString().trim();
    const reason = stderr || stdout || error.message;
    if (reason) {
      console.log(`   ↳ ${reason.slice(0, 400)}`);
    }
    state.issues.push({
      agent: name,
      timestamp: new Date().toISOString(),
      error: reason ? reason.slice(0, 1000) : 'Unknown error',
    });
    return {
      success: false,
      output: stdout || '',
      error: stderr || error.message,
      duration,
    };
  }
}

// Parse test results from report files
function parseLatestResults() {
  if (!fs.existsSync(CONFIG.reportDir)) return null;

  const reports = fs
    .readdirSync(CONFIG.reportDir)
    .filter((f) => f.startsWith('test-report-') && f.endsWith('.json'))
    .sort()
    .reverse();

  if (reports.length === 0) return null;

  try {
    const latest = path.join(CONFIG.reportDir, reports[0]);
    return JSON.parse(fs.readFileSync(latest, 'utf8'));
  } catch (e) {
    return null;
  }
}

// Check if target is reached
function checkTarget() {
  return state.currentScore >= CONFIG.targetScore;
}

// Generate iteration report
function generateIterationReport() {
  const elapsed = ((Date.now() - state.startTime) / 1000 / 60).toFixed(1);

  console.log('\n' + '='.repeat(60));
  console.log('  ITERATION REPORT');
  console.log('='.repeat(60));
  console.log(`  Iteration: ${state.iteration}`);
  console.log(`  Elapsed: ${elapsed} minutes`);
  console.log(`  Current Score: ${state.currentScore}%`);
  console.log(`  Best Score: ${state.bestScore}%`);
  console.log(`  Target Score: ${CONFIG.targetScore}%`);
  console.log(`  Status: ${state.status}`);
  console.log('='.repeat(60));

  if (checkTarget()) {
    console.log('\n🎉 TARGET SCORE REACHED! System is production-ready!');
    return true;
  }

  return false;
}

// Main loop
async function main() {
  console.log('\n🔄 TNF CONTINUOUS TESTING LOOP');
  console.log(`   Started: ${new Date().toISOString()}`);
  console.log(`   Target Score: ${CONFIG.targetScore}%`);
  console.log(`   Continue After Target: ${CONFIG.continueAfterTarget ? 'yes' : 'no'}`);
  console.log(`   Loop Interval: ${CONFIG.loopIntervalMs / 1000}s`);
  console.log(`   Max Iterations: ${CONFIG.maxIterations || 'infinite'}`);
  console.log(`   Agent Timeout: ${CONFIG.agentTimeoutMs / 1000}s`);
  console.log(`   Improver Agent: ${CONFIG.enableImprover ? 'enabled' : 'disabled'}`);

  loadState();

  // Ensure report directory exists
  if (!fs.existsSync(CONFIG.reportDir)) {
    fs.mkdirSync(CONFIG.reportDir, { recursive: true });
  }

  let shouldContinue = true;

  while (shouldContinue) {
    state.iteration++;
    state.lastRun = new Date().toISOString();
    state.status = 'running';

    console.log(`\n${'='.repeat(60)}`);
    console.log(`  ITERATION ${state.iteration}`);
    console.log(`${'='.repeat(60)}`);

    // Run all agents
    const results = {};

    // 1. Website Testing Agent
    results.website = runAgent('Website Testing', AGENTS.website);

    // 2. Improver Agent
    if (CONFIG.enableImprover && fs.existsSync(AGENTS.improver)) {
      results.improver = runAgent('Continuous Improver', AGENTS.improver);
    } else {
      console.log('\n⏭️ Skipping Continuous Improver agent');
    }

    // 3. Integration Agent (if exists)
    if (fs.existsSync(AGENTS.integration)) {
      results.integration = runAgent('Integration Testing', AGENTS.integration);
    }

    // 4. UI/UX Agent (if exists)
    if (fs.existsSync(AGENTS.uiux)) {
      results.uiux = runAgent('UI/UX Testing', AGENTS.uiux);
    }

    // Parse results
    const testResults = parseLatestResults();
    if (testResults?.overall?.score) {
      state.currentScore = testResults.overall.score;
      if (state.currentScore > state.bestScore) {
        state.bestScore = state.currentScore;
      }
    }

    // Save state
    saveState();

    // Check if target reached
    if (generateIterationReport()) {
      if (CONFIG.continueAfterTarget) {
        state.status = 'running';
        saveState();
      } else {
      state.status = 'production-ready';
      saveState();
      process.exit(0);
      }
    }

    // Check max iterations
    if (CONFIG.maxIterations > 0 && state.iteration >= CONFIG.maxIterations) {
      console.log('\n⏹️ Max iterations reached. Pausing.');
      state.status = 'paused';
      saveState();
      process.exit(0);
    }

    // Wait for next iteration
    console.log(`\n⏳ Waiting ${CONFIG.loopIntervalMs / 1000}s before next iteration...`);
    console.log('   (Press Ctrl+C to stop)');

    await new Promise((resolve) => setTimeout(resolve, CONFIG.loopIntervalMs));
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⏹️ Stopping continuous testing loop...');
  state.status = 'stopped';
  saveState();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n⏹️ Stopping continuous testing loop...');
  state.status = 'stopped';
  saveState();
  process.exit(0);
});

main().catch((err) => {
  console.error('\n❌ Continuous testing loop failed:', err);
  state.status = 'error';
  state.issues.push(err.message);
  saveState();
  process.exit(1);
});
