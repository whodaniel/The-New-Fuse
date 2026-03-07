#!/usr/bin/env node
/**
 * Orchestrator Recovery Cron Job
 * ===============================
 * Emergency backup script that checks if the Master Clock is running.
 * If Redis shows no active orchestrator, this script attempts restart.
 */

const { createClient } = require('redis');

const REDIS_URL = process.env.REDIS_URL;
const MAX_HEARTBEAT_AGE = 15000; // 15 seconds - Master Clock heartbeats every 3s

async function main() {
  console.log(`[${new Date().toISOString()}] Checking orchestrator status...`);

  if (!REDIS_URL) {
    console.log('No REDIS_URL configured - skipping recovery check');
    process.exit(0);
  }

  let client;
  try {
    client = createClient({ url: REDIS_URL });
    await client.connect();

    // Check orchestrator state in Redis
    const state = await client.hGet('tnf:master:state', 'orchestrator');

    if (!state) {
      console.error('❌ No orchestrator state found in Redis!');
      console.log('🔄 Master Clock may need manual restart');
      // In production, this would trigger an alert or auto-restart
      process.exit(1);
    }

    const orchestratorData = JSON.parse(state);
    const lastHeartbeat = orchestratorData.lastHeartbeat;
    const age = Date.now() - lastHeartbeat;

    console.log(`Orchestrator: ${orchestratorData.sessionId}`);
    console.log(`Last heartbeat: ${new Date(lastHeartbeat).toISOString()}`);
    console.log(`Age: ${Math.round(age / 1000)}s`);

    if (age > MAX_HEARTBEAT_AGE) {
      console.error(`❌ Orchestrator heartbeat is stale (${Math.round(age / 1000)}s old)`);
      console.log('🔄 Master Clock needs restart!');

      // Publish recovery event
      await client.publish(
        'tnf:system:recovery',
        JSON.stringify({
          type: 'ORCHESTRATOR_DOWN',
          lastHeartbeat,
          age,
          timestamp: Date.now(),
          action: 'RESTART_REQUIRED',
        })
      );

      process.exit(1);
    }

    console.log(`✅ Orchestrator is healthy (${orchestratorData.stats.active} active agents)`);
    process.exit(0);
  } catch (error) {
    console.error('Recovery check failed:', error.message);
    process.exit(1);
  } finally {
    if (client) {
      await client.quit();
    }
  }
}

main();
