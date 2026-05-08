#!/usr/bin/env node
/**
 * director.mjs
 * The Audit Director: Orchestrates systematic review of the entire codebase.
 * 
 * Usage modes:
 *   node director.mjs --mode full                (review all 15,707 nodes)
 *   node director.mjs --mode sample --size 100   (review random sample)
 *   node director.mjs --mode sector --name PROTO  (review sector by ID prefix)
 *   node director.mjs --mode resume              (resume interrupted review)
 *   node director.mjs --mode review --id <ID>   (review single node through all cycles)
 *   node director.mjs --mode status              (show current status)
 * 
 * The Director manages:
 * - Sector assignment (parallel work streams)
 * - Batch processing (chunks of nodes)
 * - Cycle progression (discovery → adversarial → synthesis → reconciliation)
 * - Checkpointing (pause/resume)
 * - Human gate checkpoints (reconciliation requires human)
 * - Contradiction routing (flagged items go to human queue)
 * - Progress reporting
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');
const reviewDir = path.join(root, 'data/reviews');
const logPath = path.join(reviewDir, 'review_log.jsonl');
const statusPath = path.join(reviewDir, 'node_status.json');
const directorStatePath = path.join(reviewDir, 'director_state.json');

const AGENTS = ['claude-discovery', 'claude-adversarial', 'claude-synthesis'];
const SECTORS = {
  PROTO: { prefix: 'PROTO_', name: 'Protocol Documents', description: 'Governance, rules, and operational protocols' },
  DOMAIN: { prefix: 'DOMAIN_', name: 'Domain Roots', description: 'High-level domain containers' },
  AGENT: { prefix: 'AGENT_SKILL', name: 'Agent Skills', description: 'Agent capability definitions' },
  CODE: { prefix: 'N', name: 'Code Nodes', description: 'Files, classes, methods, and implementations' },
  OTHER: { prefix: null, name: 'Other Nodes', description: 'Miscellaneous nodes' }
};

function loadStatus() {
  return JSON.parse(fs.readFileSync(statusPath, 'utf-8'));
}

function saveStatus(status) {
  fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));
}

function loadDirectorState() {
  if (fs.existsSync(directorStatePath)) {
    return JSON.parse(fs.readFileSync(directorStatePath, 'utf-8'));
  }
  return {
    version: '1.0.0',
    started_at: new Date().toISOString(),
    mode: null,
    current_sector: null,
    current_batch: 0,
    batch_size: 50,
    checkpoint_interval: 10,
    nodes_reviewed: 0,
    total_nodes: 0,
    paused: false,
    pause_reason: null,
    human_gate_queue: [],
    completed_sectors: [],
    log: []
  };
}

function saveDirectorState(state) {
  fs.writeFileSync(directorStatePath, JSON.stringify(state, null, 2));
}

function logDirector(state, message) {
  const entry = {
    timestamp: new Date().toISOString(),
    message,
    sector: state.current_sector,
    batch: state.current_batch,
    nodes_reviewed: state.nodes_reviewed
  };
  state.log.push(entry);
  console.log(`[AUDIT DIRECTOR] ${entry.timestamp} - ${message}`);
}

function getSectorForNode(nodeId) {
  if (nodeId.startsWith('PROTO_')) return 'PROTO';
  if (nodeId.startsWith('DOMAIN_')) return 'DOMAIN';
  if (nodeId.startsWith('AGENT_SKILL')) return 'AGENT';
  if (nodeId.match(/^N\d+$/)) return 'CODE';
  return 'OTHER';
}

function assignSectors(status) {
  const sectors = {};
  Object.keys(SECTORS).forEach(key => {
    sectors[key] = {
      ...SECTORS[key],
      nodes: [],
      reviewed: 0,
      total: 0
    };
  });

  Object.keys(status.nodes).forEach(nodeId => {
    const sector = getSectorForNode(nodeId);
    if (sectors[sector]) {
      sectors[sector].nodes.push(nodeId);
      sectors[sector].total++;
    }
  });

  return sectors;
}

function pause(state, reason) {
  state.paused = true;
  state.pause_reason = reason;
  saveDirectorState(state);
  logDirector(state, `PAUSED: ${reason}`);
}

function resume(state) {
  state.paused = false;
  state.pause_reason = null;
  saveDirectorState(state);
  logDirector(state, 'RESUMED');
}

async function reviewNodeBatch(state, nodeIds, cycle, agent) {
  const results = {
    reviewed: [],
    contradictions: [],
    flags: [],
    errors: []
  };

  for (const nodeId of nodeIds) {
    try {
      // Simulate review process (in production, this would invoke actual AI agents)
      const result = await simulateReview(nodeId, cycle, agent);
      results.reviewed.push({ nodeId, cycle, agent, ...result });
      
      if (result.contradictions && result.contradictions.length > 0) {
        results.contradictions.push({ nodeId, contradictions: result.contradictions });
      }
      
      if (result.flags && result.flags.length > 0) {
        results.flags.push({ nodeId, flags: result.flags });
      }
    } catch (error) {
      results.errors.push({ nodeId, error: error.message });
      logDirector(state, `ERROR reviewing ${nodeId}: ${error.message}`);
    }
  }

  return results;
}

function simulateReview(nodeId, cycle, agent) {
  // Simulated review logic
  const result = {
    confidence: 0.8 + Math.random() * 0.2,
    flags: [],
    contradictions: []
  };

  // Simulate finding contradictions in adversarial phase
  if (cycle === 'adversarial') {
    const rand = Math.random();
    if (rand < 0.02) { // 2% chance of contradiction
      result.flags.push('contradiction');
      result.contradictions.push(`PROTO_${Math.floor(Math.random() * 36)}`);
    }
    if (rand < 0.05) {
      result.flags.push('sensitive');
    }
  }

  return result;
}

async function processBatch(state, status, cycle) {
  const sector = SECTORS[state.current_sector];
  const startIdx = state.current_batch * state.batch_size;
  const endIdx = startIdx + state.batch_size;
  const nodeIds = sector.nodes.slice(startIdx, endIdx);

  if (nodeIds.length === 0) {
    return false; // No more nodes in this sector
  }

  const agent = AGENTS[['discovery', 'adversarial', 'synthesis'].indexOf(cycle)] || AGENTS[0];
  
  logDirector(state, `Processing batch ${state.current_batch}: ${nodeIds.length} nodes (${cycle} cycle)`);
  
  const results = await reviewNodeBatch(state, nodeIds, cycle, agent);
  
  // Update status for reviewed nodes
  results.reviewed.forEach(({ nodeId, cycle: reviewCycle }) => {
    const nodeStatus = status.nodes[nodeId];
    if (nodeStatus) {
      nodeStatus.cycles_completed.push({
        cycle: reviewCycle,
        reviewer: agent,
        reviewed_at: new Date().toISOString()
      });
    }
  });

  // Handle contradictions
  if (results.contradictions.length > 0) {
    results.contradictions.forEach(({ nodeId, contradictions }) => {
      state.human_gate_queue.push({
        nodeId,
        type: 'contradiction',
        cycle,
        timestamp: new Date().toISOString()
      });
      logDirector(state, `CONTRADICTION flagged: ${nodeId}`);
    });
  }

  // Handle sensitive flags
  if (results.flags.length > 0) {
    results.flags.forEach(({ nodeId, flags }) => {
      if (flags.includes('sensitive')) {
        state.human_gate_queue.push({
          nodeId,
          type: 'sensitive',
          cycle,
          timestamp: new Date().toISOString()
        });
      }
    });
  }

  state.current_batch++;
  state.nodes_reviewed += nodeIds.length;

  // Checkpoint every N batches
  if (state.current_batch % state.checkpoint_interval === 0) {
    saveDirectorState(state);
    saveStatus(status);
    logDirector(state, `Checkpoint saved: batch ${state.current_batch}`);
  }

  return true;
}

async function runCycle(state, status, cycle) {
  const sector = SECTORS[state.current_sector];
  logDirector(state, `Starting ${cycle} cycle for ${sector.name} sector`);

  while (!state.paused) {
    const hasMore = await processBatch(state, status, cycle);
    
    if (!hasMore) {
      logDirector(state, `Completed ${cycle} cycle for ${sector.name}`);
      break;
    }

    // Check for human gate pause
    if (state.human_gate_queue.length > 0 && state.human_gate_queue.length % 50 === 0) {
      pause(state, `${state.human_gate_queue.length} items in human gate queue`);
      break;
    }
  }
}

async function runSector(state, status) {
  const sector = SECTORS[state.current_sector];
  logDirector(state, `ENTERING SECTOR: ${sector.name} (${sector.total} nodes)`);

  // Discovery cycle
  await runCycle(state, status, 'discovery');
  if (state.paused) return;

  // Adversarial cycle
  await runCycle(state, status, 'adversarial');
  if (state.paused) return;

  // Synthesis cycle
  await runCycle(state, status, 'synthesis');
  if (state.paused) return;

  // Mark sector as complete
  state.completed_sectors.push(state.current_sector);
  logDirector(state, `SECTOR COMPLETE: ${sector.name}`);
}

async function runFullReview(state, status) {
  logDirector(state, 'INITIATING FULL CODEBASE AUDIT');
  logDirector(state, `Total nodes: ${state.total_nodes}`);
  logDirector(state, `Batch size: ${state.batch_size}`);
  logDirector(state, `Checkpoint interval: ${state.checkpoint_interval} batches`);

  const sectorKeys = Object.keys(SECTORS);

  for (const sectorKey of sectorKeys) {
    if (state.completed_sectors.includes(sectorKey)) {
      logDirector(state, `Skipping completed sector: ${sectorKey}`);
      continue;
    }

    state.current_sector = sectorKey;
    state.current_batch = 0;
    SECTORS[sectorKey].nodes = assignSectors(status)[sectorKey].nodes;

    await runSector(state, status);

    if (state.paused) {
      logDirector(state, `Review paused at sector: ${state.current_sector}, batch: ${state.current_batch}`);
      break;
    }
  }

  if (!state.paused) {
    logDirector(state, 'FULL AUDIT COMPLETE');
  }

  saveDirectorState(state);
  saveStatus(status);
}

function showStatus(state) {
  const status = loadStatus();
  const unreviewed = Object.values(status.nodes).filter(n => n.status === 'UNREVIEWED').length;
  const reconciled = Object.values(status.nodes).filter(n => n.status === 'RECONCILED').length;
  const discovered = Object.values(status.nodes).filter(n => n.status === 'DISCOVERED').length;
  const challenged = Object.values(status.nodes).filter(n => n.status === 'CHALLENGED').length;
  const synthesized = Object.values(status.nodes).filter(n => n.status === 'SYNTHESIZED').length;

  console.log('='.repeat(60));
  console.log('  AUDIT DIRECTOR STATUS REPORT');
  console.log(`  Generated: ${new Date().toISOString()}`);
  console.log('='.repeat(60));
  console.log(`\n  Mode:              ${state.mode || 'N/A'}`);
  console.log(`  Status:            ${state.paused ? 'PAUSED' : 'ACTIVE'}`);
  if (state.paused) {
    console.log(`  Pause Reason:        ${state.pause_reason}`);
  }
  console.log(`  Current Sector:    ${state.current_sector || 'N/A'}`);
  console.log(`  Current Batch:        ${state.current_batch}`);
  console.log(`  Nodes Reviewed:      ${state.nodes_reviewed} / ${state.total_nodes}`);
  console.log(`  Progress:            ${((state.nodes_reviewed / state.total_nodes) * 100).toFixed(2)}%`);
  console.log(`  Human Gate Queue:    ${state.human_gate_queue.length} items`);
  console.log(`  Completed Sectors:   ${state.completed_sectors.join(', ') || 'None'}`);
  console.log(`\n  BY CYCLE:`);
  console.log(`    UNREVIEWED:        ${unreviewed.toLocaleString()}`);
  console.log(`    DISCOVERED:        ${discovered.toLocaleString()}`);
  console.log(`    CHALLENGED:        ${challenged.toLocaleString()}`);
  console.log(`    SYNTHESIZED:       ${synthesized.toLocaleString()}`);
  console.log(`    RECONCILED:        ${reconciled.toLocaleString()}`);
  console.log('='.repeat(60));
}

// Main
async function main() {
  const args = process.argv.slice(2);
  const mode = args.find(a => a.startsWith('--mode'))?.split('=')[1] || 'status';

  const state = loadDirectorState();
  const status = loadStatus();

  // Initialize sector data if not already done
  if (!state.total_nodes) {
    state.total_nodes = status.total_nodes;
    const sectors = assignSectors(status);
    Object.keys(SECTORS).forEach(key => {
      SECTORS[key].nodes = sectors[key].nodes;
      SECTORS[key].total = sectors[key].total;
    });
  }

  switch (mode) {
    case 'full':
      state.mode = 'full';
      await runFullReview(state, status);
      break;

    case 'sample':
      const sampleSize = parseInt(args.find(a => a.startsWith('--size'))?.split('=')[1] || '100');
      state.mode = 'sample';
      state.total_nodes = sampleSize;
      logDirector(state, `Running sample review: ${sampleSize} nodes`);
      // For sample, we'd randomize and run a subset
      console.log('Sample mode not yet implemented. Use --mode full.');
      break;

    case 'sector':
      const sectorName = args.find(a => a.startsWith('--name'))?.split('=')[1];
      if (!sectorName || !SECTORS[sectorName]) {
        console.error('Invalid sector. Available:', Object.keys(SECTORS).join(', '));
        process.exit(1);
      }
      state.mode = 'sector';
      state.current_sector = sectorName;
      SECTORS[sectorName].nodes = assignSectors(status)[sectorName].nodes;
      await runSector(state, status);
      break;

    case 'resume':
      if (!state.paused) {
        console.log('No paused review to resume.');
      } else {
        resume(state);
        await runFullReview(state, status);
      }
      break;

    case 'review':
      const nodeId = args.find(a => a.startsWith('--id'))?.split('=')[1];
      if (!nodeId) {
        console.error('Missing --id parameter');
        process.exit(1);
      }
      console.log(`Review single node: ${nodeId}`);
      // Single node review logic would go here
      break;

    case 'status':
    default:
      showStatus(state);
      break;
  }

  saveDirectorState(state);
  saveStatus(status);
}

main().catch(console.error);
