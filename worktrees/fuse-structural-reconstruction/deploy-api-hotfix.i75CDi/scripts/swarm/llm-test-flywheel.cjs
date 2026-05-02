#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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

const { RedisAgentClient } = require('../../packages/tnf-cli/dist/index');

/**
 * LLM Viability & Opportunity Flywheel (v2.0 - NO MOCKS)
 * 
 * Orchestrates the full-time testing loop:
 * 1. Reads the latest landscape report from News Scout.
 * 2. Extracts mentioned models/providers.
 * 3. Auctions viability and benchmarking tasks for the PicoClaw fleet.
 */

const REPORT_PATH = path.resolve(__dirname, '../../.agent/landscape/DAILY_NEWS.md');
const MODEL_KEYWORDS = [
  'gpt',
  'claude',
  'llama',
  'deepseek',
  'qwen',
  'gemini',
  'mistral',
  'mixtral',
  'command-r',
  'phi',
];

async function runLLMTestCycle() {
  console.log('🧪 [LLM-Flywheel] Initiating Testing Super-Cycle...');
  
  const client = new RedisAgentClient();
  try {
    await client.initialize();
    await client.register('LLM-Orchestrator', 'coordinator', 'antigravity', ['llm-testing', 'benchmarking']);
  } catch (e) {
    console.error('❌ Redis unavailable. Cannot proceed with real-time auctions.');
    process.exit(1);
  }

  // 1. READ REAL DATA from News Scout output
  if (!fs.existsSync(REPORT_PATH)) {
    console.warn(`⚠️ No landscape report found at ${REPORT_PATH}. Run scout:scan first.`);
    await client.cleanup();
    return;
  }

  const report = fs.readFileSync(REPORT_PATH, 'utf-8');
  const lines = report.split('\n');
  const opportunities = [];

  // Simple parser to find model names in headers (### Model Name)
  lines.forEach(line => {
    if (line.startsWith('### ')) {
      const modelName = line.replace('### ', '').trim();
      const normalized = modelName.toLowerCase();
      const looksLikeModel = MODEL_KEYWORDS.some((keyword) => normalized.includes(keyword));
      if (looksLikeModel) {
        opportunities.push({ model: modelName, source: 'News-Scout-Report' });
      }
    }
  });

  if (opportunities.length === 0) {
    console.log('ℹ️ No new LLM opportunities found in the latest report.');
    await client.cleanup();
    return;
  }

  for (const opp of opportunities) {
    console.log(`\n🔔 [Scout-Verified] Found Opportunity: ${opp.model}`);
    
    const taskId = `llm_test_${Date.now()}_${opp.model.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    // 2. Dispatch Viability Auction (PicoClaw A)
    const viabilityAuction = {
      id: crypto.randomUUID(),
      type: 'auction',
      from: { agentId: 'LLM-Orchestrator', role: 'coordinator' },
      to: { broadcast: true },
      payload: {
        taskId: `${taskId}_viability`,
        taskType: 'viability-tester',
        requirements: ['endpoint-probing', 'latency-analysis'],
        priority: 'high',
        expiresAt: Date.now() + 10000,
        description: `Test viability of ${opp.model} (Extracted from Market Intel)`
      },
      timestamp: new Date().toISOString()
    };

    console.log(`   📢 Auctioning Viability Test for ${opp.model}...`);
    await client.publisher.publish('tnf:bus:ingress', JSON.stringify(viabilityAuction));
    await client.publisher.lpush(
      'tnf:master:logs',
      JSON.stringify({
        timestamp: new Date().toISOString(),
        eventType: 'auction.viability.created',
        content: `Viability auction created for ${opp.model}`,
        metadata: {
          source: 'LLM-Orchestrator',
          taskType: 'viability-tester',
          model: opp.model,
          taskId: viabilityAuction.payload.taskId,
        },
      })
    );

    // 3. Dispatch Benchmarking Auction (PicoClaw B)
    const benchmarkAuction = {
      id: crypto.randomUUID(),
      type: 'auction',
      from: { agentId: 'LLM-Orchestrator', role: 'coordinator' },
      to: { broadcast: true },
      payload: {
        taskId: `${taskId}_benchmark`,
        taskType: 'benchmarker',
        requirements: ['cross-evaluation', 'fidelity-testing'],
        priority: 'normal',
        expiresAt: Date.now() + 15000,
        description: `Benchmark ${opp.model} against current TNF production baselines.`
      },
      timestamp: new Date().toISOString()
    };

    console.log(`   📢 Auctioning Benchmarking Task for ${opp.model}...`);
    await client.publisher.publish('tnf:bus:ingress', JSON.stringify(benchmarkAuction));
    await client.publisher.lpush(
      'tnf:master:logs',
      JSON.stringify({
        timestamp: new Date().toISOString(),
        eventType: 'auction.benchmark.created',
        content: `Benchmark auction created for ${opp.model}`,
        metadata: {
          source: 'LLM-Orchestrator',
          taskType: 'benchmarker',
          model: opp.model,
          taskId: benchmarkAuction.payload.taskId,
        },
      })
    );
    await client.publisher.ltrim('tnf:master:logs', 0, 99);
  }

  console.log('\n✅ [LLM-Flywheel] Cycle complete. All tasks auctioned to real specialized agents.');
  await client.cleanup();
}

runLLMTestCycle().catch(err => {
  console.error(`❌ LLM Flywheel failed: ${err.message}`);
  process.exit(1);
});
