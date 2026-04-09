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
const MAX_DECOMPOSITION_DEPTH = 3;

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
      requirements: ['planning'],
      priority: 'high',
      metadata: { depth: depth + 1, isComplex: true }
    });
    subTasks.push({
      id: `${baseId}_exec_phase`,
      type: 'general',
      title: `Action: Execute findings from ${parentTask.title}`,
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
      requirements: ['file-system', 'analysis'],
      priority: 'high',
      metadata: { depth: depth + 1 }
    });
    subTasks.push({
      id: `${baseId}_fix`,
      type: 'coding',
      title: 'Apply Fixes',
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
  console.log(`   📢 Auctioning: ${subTask.title}`);
  
  // If the sub-task is a 'planning' type, we put it back in the planning queue for recursion
  if (subTask.type === 'planning') {
    console.log(`   🔄 Recursive Trigger: Re-queuing ${subTask.id} for further decomposition.`);
    await planner.publisher.lpush(PLANNING_QUEUE, JSON.stringify({
      ...subTask,
      source: 'project-planner-recursive'
    }));
    return;
  }

  const auctionEnvelope = {
    id: crypto.randomUUID(),
    type: 'auction',
    from: { agentId: 'Project-Planner', role: 'coordinator' },
    to: { broadcast: true },
    payload: {
      taskId: subTask.id,
      parentTaskId: parentId,
      taskType: subTask.type,
      requirements: subTask.requirements,
      priority: subTask.priority,
      expiresAt: Date.now() + 5000,
      description: subTask.title,
      metadata: subTask.metadata
    },
    timestamp: new Date().toISOString()
  };

  await planner.publisher.publish('tnf:bus:ingress', JSON.stringify(auctionEnvelope));
}

startPlanner().catch(err => {
  console.error('❌ Planner failed:', err);
  process.exit(1);
});
