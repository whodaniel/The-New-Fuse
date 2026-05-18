#!/usr/bin/env node
/**
 * TNF Self-Improvement Cycle Cron Job
 * ====================================
 * Runs hourly to process improvement tasks and coordinate agents.
 */

const fs = require('fs').promises;
const path = require('path');
const WebSocket = require('ws');
const { createClient } = require('redis');

const RELAY_WS_URL =
  process.env.RELAY_URL ||
  process.env.TNF_RELAY_URL ||
  process.env.RELAY_WS_URL ||
  'ws://127.0.0.1:3000/ws';
const REDIS_URL = process.env.REDIS_URL;
const PROJECT_ROOT = process.env.PROJECT_ROOT || path.join(__dirname, '../../../..');
const IMPROVEMENT_FILE = path.join(PROJECT_ROOT, '.agent/SELF_IMPROVEMENT_CYCLE.md');

async function readImprovementCycle() {
  try {
    const content = await fs.readFile(IMPROVEMENT_FILE, 'utf-8');
    return content;
  } catch (err) {
    console.log('Improvement cycle file not found, creating...');
    return null;
  }
}

async function getActiveImprovementTasks(content) {
  // Parse markdown for unchecked items
  const unchecked = [];
  const lines = content.split('\n');

  for (const line of lines) {
    if (line.includes('[ ]')) {
      unchecked.push(line.replace('- [ ]', '').trim());
    }
  }

  return unchecked.slice(0, 5); // Return top 5 tasks
}

async function publishTasksToRedis(tasks) {
  if (!REDIS_URL || tasks.length === 0) return;

  try {
    const client = createClient({ url: REDIS_URL });
    await client.connect();

    for (let i = 0; i < tasks.length; i++) {
      const task = {
        id: `task-${Date.now()}-${i}`,
        type: 'improvement',
        content: tasks[i],
        priority: i === 0 ? 'high' : 'medium',
        createdAt: new Date().toISOString(),
        status: 'pending',
      };

      await client.xAdd('tnf:tasks:pending', '*', {
        data: JSON.stringify(task),
      });

      console.log(`Queued task: ${task.id}`);
    }

    await client.quit();
  } catch (err) {
    console.error('Failed to publish tasks:', err.message);
  }
}

async function broadcastTasksToAgents(tasks) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(RELAY_WS_URL);
    let completed = false;

    const timeout = setTimeout(() => {
      if (!completed) {
        completed = true;
        ws.close();
        resolve();
      }
    }, 30000);

    ws.on('open', async () => {
      // Register
      ws.send(
        JSON.stringify({
          type: 'AGENT_REGISTER',
          payload: {
            agent: {
              id: `improvement-cron-${Date.now()}`,
              name: 'TNF Improvement Service',
              platform: 'system',
              capabilities: ['task-distribution'],
            },
          },
        })
      );

      await new Promise((r) => setTimeout(r, 1000));

      // Broadcast to Green channel
      ws.send(
        JSON.stringify({
          type: 'CHANNEL_CREATE',
          payload: { name: 'Green' },
        })
      );

      await new Promise((r) => setTimeout(r, 500));

      const taskList = tasks.map((t, i) => `${i + 1}. ${t}`).join('\n');

      ws.send(
        JSON.stringify({
          type: 'MESSAGE_SEND',
          channel: 'Green',
          payload: {
            to: 'broadcast',
            content: `
═══════════════════════════════════════════════════════════════
🔧 SELF-IMPROVEMENT CYCLE - ${new Date().toISOString()}
═══════════════════════════════════════════════════════════════

The following improvement tasks are available:

${taskList}

Agents: Please claim a task by responding with:
[AGENT-XX] CLAIM: [task number]

After completing, respond with:
[AGENT-XX] COMPLETE: [task number] - [summary of work done]
═══════════════════════════════════════════════════════════════`,
            messageType: 'text',
            metadata: { isImprovementCycle: true },
          },
        })
      );

      console.log('Improvement tasks broadcast complete');

      await new Promise((r) => setTimeout(r, 2000));
      clearTimeout(timeout);
      completed = true;
      ws.close();
      resolve();
    });

    ws.on('error', (err) => {
      if (!completed) {
        completed = true;
        clearTimeout(timeout);
        console.error('WebSocket error:', err.message);
        resolve();
      }
    });
  });
}

async function logCycleRun(tasks) {
  const logDir = path.join(PROJECT_ROOT, '.agent/improvement-logs');
  await fs.mkdir(logDir, { recursive: true });

  const logFile = path.join(logDir, `cycle-${new Date().toISOString().split('T')[0]}.log`);
  const entry = `[${new Date().toISOString()}] Processed ${tasks.length} tasks\n${tasks.map((t) => `  - ${t}`).join('\n')}\n\n`;

  await fs.appendFile(logFile, entry);
}

async function main() {
  console.log(`[${new Date().toISOString()}] Running self-improvement cycle...`);

  const content = await readImprovementCycle();
  if (!content) {
    console.log('No improvement cycle content found');
    process.exit(0);
  }

  const tasks = await getActiveImprovementTasks(content);
  console.log(`Found ${tasks.length} pending tasks`);

  if (tasks.length === 0) {
    console.log('No pending tasks');
    process.exit(0);
  }

  // Publish to Redis for cloud agents
  await publishTasksToRedis(tasks);

  // Broadcast to connected agents
  await broadcastTasksToAgents(tasks);

  // Log this cycle
  await logCycleRun(tasks);

  console.log('Self-improvement cycle complete');
  process.exit(0);
}

main().catch((err) => {
  console.error('Self-improvement cycle failed:', err.message);
  process.exit(1);
});
