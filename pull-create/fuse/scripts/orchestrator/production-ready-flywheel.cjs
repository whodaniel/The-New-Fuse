#!/usr/bin/env node
const fs = require('fs');
const { execFileSync } = require('child_process');
const path = require('path');

/**
 * TNF PRODUCTION-READY FLYWHEEL (v3.0)
 *
 * This is the master orchestration script that runs a continuous loop of
 * specialized agents testing and improving the website until production-ready:
 *
 * 1. Website Testing Agent - Frontend/Backend testing
 * 2. Integration Testing Agent - API and database testing
 * 3. UI/UX Testing Agent - Accessibility and design consistency
 * 4. Continuous Improver - System health and tech debt
 * 5. News Scout (Market Intelligence)
 * 6. LLM Test Flywheel - Model viability testing
 */

const WEBSITE_TEST_SCRIPT = path.join(__dirname, '../swarm/website-testing-agent.cjs');
const INTEGRATION_TEST_SCRIPT = path.join(__dirname, '../swarm/integration-test-agent.cjs');
const UIUX_TEST_SCRIPT = path.join(__dirname, '../swarm/uiux-testing-agent.cjs');
const SCOUT_SCRIPT = path.join(__dirname, '../swarm/news-scout.cjs');
const IMPROVER_SCRIPT = path.join(__dirname, '../improver/scan.cjs');
const LLM_TEST_SCRIPT = path.join(__dirname, '../swarm/llm-test-flywheel.cjs');

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
  targetScore: parseInt(process.env.TARGET_SCORE || '95', 10),
  maxIterations: parseInt(process.env.MAX_ITERATIONS || '0', 10), // 0 = infinite
  loopIntervalMs: parseInt(process.env.LOOP_INTERVAL || '300000', 10), // 5 min
  statusFile: path.join(ROOT_DIR, '.agent/flywheel-status.json'),
};

// State
let state = {
  iteration: 0,
  startTime: Date.now(),
  lastRun: null,
  bestScore: 0,
  currentScore: 0,
  status: 'running',
  phases: {},
};

// Load previous state
function loadState() {
  if (fs.existsSync(CONFIG.statusFile)) {
    try {
      const saved = JSON.parse(fs.readFileSync(CONFIG.statusFile, 'utf8'));
      state = { ...state, ...saved };
      console.log('📂 Loaded previous state');
    } catch (e) {
      console.log('⚠️ Starting fresh');
    }
  }
}

// Save state
function saveState() {
  const dir = path.dirname(CONFIG.statusFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(CONFIG.statusFile, JSON.stringify(state, null, 2));
}

// Run a phase
function runPhase(name, scriptPath) {
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`  ${name}`);
  console.log(`${'─'.repeat(50)}`);

  const phaseStart = Date.now();

  if (!fs.existsSync(scriptPath)) {
    console.log(`   ⚠️ Script not found: ${scriptPath}`);
    return { success: false, skipped: true };
  }

  try {
    execFileSync('node', [scriptPath], {
      stdio: 'inherit',
      timeout: 300000, // 5 min timeout
    });
    const duration = ((Date.now() - phaseStart) / 1000).toFixed(1);
    console.log(`   ✅ Complete in ${duration}s`);
    return { success: true, duration };
  } catch (error) {
    const duration = ((Date.now() - phaseStart) / 1000).toFixed(1);
    console.log(`   ❌ Failed after ${duration}s: ${error.message}`);
    return { success: false, error: error.message, duration };
  }
}

// Parse latest test results
function parseLatestScore() {
  const reportDir = path.join(ROOT_DIR, '.agent/test-reports');
  if (!fs.existsSync(reportDir)) return 0;

  const reports = fs
    .readdirSync(reportDir)
    .filter((f) => f.startsWith('test-report-') && f.endsWith('.json'))
    .sort()
    .reverse();

  if (reports.length === 0) return 0;

  try {
    const latest = JSON.parse(fs.readFileSync(path.join(reportDir, reports[0]), 'utf8'));
    return latest.overall?.score || 0;
  } catch (e) {
    return 0;
  }
}

// Main flywheel loop
async function runFlywheel() {
  console.log('\n' + '═'.repeat(60));
  console.log('  TNF PRODUCTION-READY FLYWHEEL v3.0');
  console.log('═'.repeat(60));
  console.log(`  Target Score: ${CONFIG.targetScore}%`);
  console.log(`  Loop Interval: ${CONFIG.loopIntervalMs / 1000}s`);
  console.log(`  Max Iterations: ${CONFIG.maxIterations || 'infinite'}`);
  console.log('═'.repeat(60));

  loadState();

  let shouldContinue = true;

  while (shouldContinue) {
    state.iteration++;
    state.lastRun = new Date().toISOString();

    console.log('\n' + '═'.repeat(60));
    console.log(`  ITERATION ${state.iteration}`);
    console.log(`  ${new Date().toISOString()}`);
    console.log('═'.repeat(60));

    // Phase 1: Website Testing
    state.phases.website = runPhase('🌐 Phase 1: Website Testing', WEBSITE_TEST_SCRIPT);

    // Phase 2: Integration Testing
    state.phases.integration = runPhase('🔌 Phase 2: Integration Testing', INTEGRATION_TEST_SCRIPT);

    // Phase 3: UI/UX Testing
    state.phases.uiux = runPhase('🎨 Phase 3: UI/UX Testing', UIUX_TEST_SCRIPT);

    // Phase 4: System Health
    state.phases.improver = runPhase('🛠️ Phase 4: System Health', IMPROVER_SCRIPT);

    // Phase 5: Market Intelligence
    state.phases.scout = runPhase('📡 Phase 5: Market Intelligence', SCOUT_SCRIPT);

    // Phase 6: LLM Testing
    state.phases.llm = runPhase('🧪 Phase 6: LLM Testing', LLM_TEST_SCRIPT);

    // Update score
    state.currentScore = parseLatestScore();
    if (state.currentScore > state.bestScore) {
      state.bestScore = state.currentScore;
    }

    // Save state
    saveState();

    // Report
    const elapsed = ((Date.now() - state.startTime) / 1000 / 60).toFixed(1);
    console.log('\n' + '═'.repeat(60));
    console.log('  ITERATION SUMMARY');
    console.log('═'.repeat(60));
    console.log(`  Iteration: ${state.iteration}`);
    console.log(`  Elapsed: ${elapsed} minutes`);
    console.log(`  Current Score: ${state.currentScore}%`);
    console.log(`  Best Score: ${state.bestScore}%`);
    console.log(`  Target Score: ${CONFIG.targetScore}%`);
    console.log('═'.repeat(60));

    // Check if target reached
    if (state.currentScore >= CONFIG.targetScore) {
      console.log('\n🎉 TARGET SCORE REACHED! System is production-ready!');
      state.status = 'production-ready';
      saveState();
      process.exit(0);
    }

    // Check max iterations
    if (CONFIG.maxIterations > 0 && state.iteration >= CONFIG.maxIterations) {
      console.log('\n⏹️ Max iterations reached.');
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

// Handle shutdown
process.on('SIGINT', () => {
  console.log('\n\n⏹️ Stopping flywheel...');
  state.status = 'stopped';
  saveState();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n⏹️ Stopping flywheel...');
  state.status = 'stopped';
  saveState();
  process.exit(0);
});

// Run
runFlywheel().catch((err) => {
  console.error('\n❌ Flywheel failed:', err);
  state.status = 'error';
  saveState();
  process.exit(1);
});
