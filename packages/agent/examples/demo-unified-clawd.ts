import { createUnifiedAgent } from '../src/implementations/unified_agent';

async function runDemo() {
  console.log('--- TNF Unified Agent x ClawdEngine Demo ---');

  // 1. Create the Agent
  // This automatically spins up the ClawdEngine internally
  const agent = createUnifiedAgent('demo-agent', 'Demo Assistant', 'worker');

  await agent.start();
  console.log('[Demo] Agent started.');

  // 2. Submit a Clawd Task
  // This uses the new 'clawd' task type we added
  const task = {
    id: 'req-' + Date.now(),
    type: 'clawd',
    priority: 'high' as const,
    requester: 'demo-script',
    payload: {
      skill: 'system-status', // The skill we just created
      args: {},
    },
  };

  console.log(`[Demo] Submitting task: Execute '${task.payload.skill}'`);

  try {
    const result = await agent.executeTask(task);
    console.log('[Demo] Task Result:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('[Demo] Task Failed:', err);
  }

  await agent.stop();
  process.exit(0);
}

runDemo().catch(console.error);
