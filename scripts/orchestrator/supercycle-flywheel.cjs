#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');

/**
 * TNF SUPER-CYCLE FLYWHEEL
 * 
 * This is the master orchestration script that connects:
 * 1. News Scout (Market Intelligence)
 * 2. Continuous Improver (System Health)
 */

const SCOUT_SCRIPT = path.join(__dirname, '../swarm/news-scout.cjs');
const IMPROVER_SCRIPT = path.join(__dirname, '../improver/scan.cjs');
const LLM_TEST_SCRIPT = path.join(__dirname, '../swarm/llm-test-flywheel.cjs');

async function runFlywheel() {
  console.log('\n🌀 [Flywheel] Starting Autonomous Super-Cycle...');
  const start = Date.now();

  try {
    // 1. Run News Scout
    console.log('📡 Phase 1: Market Intelligence (Scout)');
    execSync(`node ${SCOUT_SCRIPT}`, { stdio: 'inherit' });

    // 2. Run Continuous Improver
    console.log('\n🛠️ Phase 2: System Health (Improver)');
    execSync(`node ${IMPROVER_SCRIPT}`, { stdio: 'inherit' });

    // 3. Run LLM Test Flywheel
    console.log('\n🧪 Phase 3: LLM Viability & Benchmarking (PicoClaw)');
    execSync(`node ${LLM_TEST_SCRIPT}`, { stdio: 'inherit' });

    const duration = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`\n✅ [Flywheel] Super-Cycle complete in ${duration}s. Swarm tasks updated.\n`);

  } catch (error) {
    console.error(`❌ [Flywheel] Super-Cycle failed: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  runFlywheel();
}
