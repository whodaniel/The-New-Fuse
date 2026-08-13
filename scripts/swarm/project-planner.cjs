#!/usr/bin/env node

const { singleInstanceGuard } = require('../lib/tnf-single-instance-guard.cjs');
const _guard = singleInstanceGuard({ lockName: 'project-planner', staleMs: 10 * 60 * 1000 });
if (!_guard.acquired) {
  console.log(JSON.stringify({ ok: true, skipped: 'already-running', lock: _guard.existingLock }));
  process.exit(0);
}

const fs = require('fs');
const path = require('path');
const { RedisAgentClient } = require('../../packages/tnf-cli/dist/index');
const crypto = require('crypto');

/**
 * Project Planner Agent (v2.0 - Recursive Edition)
 * 
 * Role: MANAGING_PLANNER
 * Goal: Consume High-Level tasks from 'tnf:master:tasks:planning', decompose them,
 * and auction the sub-tasks to the swarm.
 * 
 * New Capability: RECURSIVE TASK SPLITTING
 * If a sub-task is still too large, it is re-queued for further planning.
 */

const PLANNING_QUEUE = 'tnf:master:tasks:planning';
const REALTIME_QUEUE = 'tnf:master:tasks:realtime';
const MAX_DECOMPOSITION_DEPTH = 3;
const DEFAULT_TENANT_ID = process.env.TNF_TENANT_ID || 'tnf-prod';
const REQUIRED_FEDERATION_GATES = [
  'TENANT_SCOPE_GATE',
  'TRACE_CONTINUITY_GATE',
  'TERMINAL_BINDING_GATE',
  'HIGH_RISK_RUNTIME_GATE',
  'CHANNEL_MEMBERSHIP_GATE',
];

async function startPlanner() {
  const planner = new RedisAgentClient();
  await planner.initialize();
  await planner.register('Project-Planner', 'coordinator', 'antigravity', ['planning', 'decomposition', 'auctioneer', 'recursive-splitting']);

  console.log('🏗️ Project Planner: Online and listening for strategic objectives...');

  // Processing Loop
  while (true) {
    try {
      // 1. Fetch Task
      const result = await planner.publisher.brpop(PLANNING_QUEUE, 5);
      
      if (!result) continue;

      const [queue, rawTask] = result;
      const task = JSON.parse(rawTask);
      const currentDepth = task.metadata?.depth || 0;
      
      console.log(`\n📋 [Planner] Picked up task: "${task.title}" (Depth: ${currentDepth})`);

      // 2. Decompose
      console.log('   🤔 Decomposing strategy...');
      await new Promise(r => setTimeout(r, 1000)); 

      const subTasks = decomposeTask(task, currentDepth);
      console.log(`   ⚡ Generated ${subTasks.length} sub-tasks.`);

      // 3. Auction Sub-Tasks
      for (const sub of subTasks) {
        await auctionTask(planner, sub, task.id);
      }

    } catch (error) {
      console.error('❌ Planner Loop Error:', error.message);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

/**
 * Simulates LLM Decomposition Logic with Recursion Support
 */
function decomposeTask(parentTask, depth) {
  const subTasks = [];
  const baseId = parentTask.id;

  if (depth >= MAX_DECOMPOSITION_DEPTH) {
    console.log(`   ⚠️ Max depth reached for ${baseId}. Forcing atomic execution.`);
    subTasks.push({
      id: `${baseId}_atomic`,
      type: 'general',
      title: `Final Execution: ${parentTask.title}`,
      description: parentTask.description || parentTask.content || parentTask.title,
      acceptanceCriteria: normalizeCriteria(parentTask),
      requirements: ['general'],
      priority: parentTask.priority,
      metadata: { depth: depth + 1 }
    });
    return subTasks;
  }

  // RECURSIVE LOGIC: WarpOS Analysis often needs deep split
  if (parentTask.title.includes('WarpOS') || parentTask.title.includes('Assimilation')) {
    subTasks.push({
      id: `${baseId}_research_phase`,
      type: 'planning', // This triggers RECURSION
      title: `Strategy: Research Phase for ${parentTask.title}`,
      description: parentTask.description || parentTask.content || parentTask.title,
      acceptanceCriteria: normalizeCriteria(parentTask),
      requirements: ['planning'],
      priority: 'high',
      metadata: { depth: depth + 1, isComplex: true }
    });
    subTasks.push({
      id: `${baseId}_exec_phase`,
      type: 'general',
      title: `Action: Execute findings from ${parentTask.title}`,
      description: parentTask.description || parentTask.content || parentTask.title,
      acceptanceCriteria: normalizeCriteria(parentTask),
      requirements: ['general'],
      priority: 'normal',
      metadata: { depth: depth + 1 }
    });
  } 
  // Standard Decomposition
  else if (parentTask.title.includes('Codebase') || parentTask.title.includes('Tech Debt')) {
    subTasks.push({
      id: `${baseId}_audit`,
      type: 'code-audit',
      title: 'Detailed Code Audit',
      description: parentTask.description || parentTask.content || parentTask.title,
      acceptanceCriteria: normalizeCriteria(parentTask),
      requirements: ['file-system', 'analysis'],
      priority: 'high',
      metadata: { depth: depth + 1 }
    });
    subTasks.push({
      id: `${baseId}_fix`,
      type: 'coding',
      title: 'Apply Fixes',
      description: parentTask.description || parentTask.content || parentTask.title,
      acceptanceCriteria: normalizeCriteria(parentTask),
      requirements: ['coding', 'git'],
      priority: 'normal',
      metadata: { depth: depth + 1 }
    });
  } else {
    // Default fallback
    subTasks.push({
      id: `${baseId}_general`,
      type: 'general',
      title: `Execute: ${parentTask.title}`,
      description: parentTask.description || parentTask.content || parentTask.title,
      acceptanceCriteria: normalizeCriteria(parentTask),
      requirements: ['general'],
      priority: 'normal',
      metadata: { depth: depth + 1 }
    });
  }

  return subTasks;
}

/**
 * Runs the Auction Protocol for a single sub-task
 */
async function auctionTask(planner, subTask, parentId) {
  console.log(`   📢 Dispatching: ${subTask.title}`);
  
  // If the sub-task is a 'planning' type, we put it back in the planning queue for recursion
  if (subTask.type === 'planning') {
    console.log(`   🔄 Recursive Trigger: Re-queuing ${subTask.id} for further decomposition.`);
    await planner.publisher.lpush(PLANNING_QUEUE, JSON.stringify({
      ...subTask,
      source: 'project-planner-recursive'
    }));
    return;
  }

  const nowIso = new Date().toISOString();
  const taskId = subTask.id || crypto.randomUUID();
  const gateDecisions = buildGateDecisions(nowIso);
  const queueTask = {
    id: taskId,
    title: subTask.title,
    description: subTask.description || subTask.title,
    acceptanceCriteria: normalizeCriteria(subTask),
    priority: subTask.priority || 'normal',
    status: 'queued',
    source: 'project-planner',
    parentTaskId: parentId,
    requiredCapabilities: capabilitiesForSubTask(subTask),
    scope: {
      tenantId: DEFAULT_TENANT_ID,
      tenant_id: DEFAULT_TENANT_ID,
    },
    gateDecisions,
    cumulativeId: {
      spec: 'tnf/mcid/0.1',
      id: taskId,
      tenantId: DEFAULT_TENANT_ID,
      scope: {
        tenant_id: DEFAULT_TENANT_ID,
        task_id: taskId,
      },
      lineage: {
        trace_id: crypto.randomUUID(),
        correlation_id: parentId || taskId,
        causation_id: parentId || taskId,
        task_id: taskId,
        parent_task_id: parentId || null,
      },
      federation: {
        domain: 'tnf-local',
        route: ['project-planner', 'runtime-broker'],
        hop_count: 1,
        gate_decisions: gateDecisions,
      },
      issued_at: nowIso,
    },
    itinerary: {
      lane: 'realtime_broker_routing',
      horizon: 'short_term',
      coordinationMode: 'brokered',
      signalSources: ['project-planner'],
      sequencingKey: parentId,
      clockSource: 'project-planner',
    },
    metadata: {
      ...(subTask.metadata || {}),
      parentTaskId: parentId,
      taskType: subTask.type,
      requirements: subTask.requirements || [],
    },
    createdAt: nowIso,
  };

  await planner.publisher.lpush(REALTIME_QUEUE, JSON.stringify(queueTask));
  console.log(`   ✅ Queued for broker: ${queueTask.id} -> ${REALTIME_QUEUE}`);
}

function buildGateDecisions(atIso) {
  return REQUIRED_FEDERATION_GATES.map((gate) => ({
    gate,
    decision: 'allow',
    at: atIso,
    reason: 'project-planner generated broker task within local TNF runtime',
  }));
}

function capabilitiesForSubTask(subTask) {
  const type = String(subTask.type || '').toLowerCase();
  const requirements = Array.isArray(subTask.requirements)
    ? subTask.requirements.map((item) => String(item).toLowerCase())
    : [];

  if (type.includes('code-audit') || requirements.includes('analysis')) {
    return ['code_analysis'];
  }
  if (type.includes('coding') || requirements.includes('coding')) {
    return ['implementation'];
  }
  return ['task_execution'];
}

function normalizeCriteria(task) {
  const direct = Array.isArray(task?.acceptanceCriteria)
    ? task.acceptanceCriteria
    : Array.isArray(task?.acceptance_criteria)
      ? task.acceptance_criteria
      : [];
  return direct
    .map((item) => String(item || '').trim())
    .filter(Boolean);
}

startPlanner().catch(err => {
  console.error('❌ Planner failed:', err);
  process.exit(1);
});
