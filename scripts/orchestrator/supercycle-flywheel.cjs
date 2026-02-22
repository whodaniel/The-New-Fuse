#!/usr/bin/env node
const fs = require('fs');
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
