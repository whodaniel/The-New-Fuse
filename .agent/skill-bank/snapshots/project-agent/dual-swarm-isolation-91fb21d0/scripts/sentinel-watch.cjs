#!/usr/bin/env node

/**
 * TNF SENTINEL WATCHER (Dual-Swarm Succession)
 * 
 * Purpose: Run in Plane B (Understudy) to monitor Plane A (Lead).
 * Logic: If Plane A heartbeat vanishes for > 30s, trigger TAKEOVER.
 */

const { RedisAgentClient } = require('../lib/redis-agent-client.cjs');
const fs = require('fs');
const { execSync } = require('child_process');

const config = {
  watchChannel: 'tnf:heartbeat:plane:A',
  myPlane: process.env.TNF_PLANE || 'B',
  thresholdMs: 30000,
};

let lastHeartbeat = Date.now();

async function main() {
  console.log(`SENTINEL: Starting watch on ${config.watchChannel} (My Plane: ${config.myPlane})`);
  
  const client = new RedisAgentClient();
  await client.initialize();

  // Subscribe to Lead Heartbeat
  client.subscriber.subscribe(config.watchChannel, (message) => {
    lastHeartbeat = Date.now();
    // console.log('SENTINEL: Lead Heartbeat detected');
  });

  // Check for Stalls
  setInterval(() => {
    const drift = Date.now() - lastHeartbeat;
    if (drift > config.thresholdMs) {
      console.error(`!!! SENTINEL ALERT !!! Lead Heartbeat lost for ${drift}ms. TRIGGERING TAKEOVER.`);
      triggerTakeover();
    }
  }, 5000);
}

function triggerTakeover() {
  console.log('SENTINEL: Promoting this swarm to LEAD status.');
  try {
    // 1. Mark this process as Lead in env
    process.env.TNF_PLANE = 'A';
    // 2. Trigger the Director Loop to start running here
    execSync('pnpm run tnf:director:resume', { stdio: 'inherit' });
    // 3. Exit watch (mission accomplished)
    process.exit(0);
  } catch (e) {
    console.error('TAKEOVER FAILED:', e.message);
  }
}

main().catch(err => {
  console.error('Sentinel Error:', err.message);
  process.exit(1);
});
