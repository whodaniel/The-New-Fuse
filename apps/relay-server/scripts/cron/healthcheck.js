#!/usr/bin/env node
/**
 * TNF Orchestration Health Check Cron Job
 * ========================================
 * Runs periodically to ensure the orchestration system is healthy.
 * If issues are detected, attempts automatic recovery.
 */

const http = require('http');
const { createClient } = require('redis');

const RELAY_URL = process.env.RELAY_URL || 'http://localhost:3000';
const REDIS_URL = process.env.REDIS_URL;

async function checkRelayHealth() {
  return new Promise((resolve) => {
    http
      .get(`${RELAY_URL}/health`, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const status = JSON.parse(data);
            resolve({ healthy: status.status === 'ok', data: status });
          } catch (e) {
            resolve({ healthy: false, error: 'Invalid response' });
          }
        });
      })
      .on('error', (err) => {
        resolve({ healthy: false, error: err.message });
      });
  });
}

async function checkRedisHealth() {
  if (!REDIS_URL) {
    return { healthy: false, error: 'REDIS_URL not configured' };
  }

  try {
    const client = createClient({ url: REDIS_URL });
    await client.connect();
    await client.ping();
    await client.quit();
    return { healthy: true };
  } catch (err) {
    return { healthy: false, error: err.message };
  }
}

async function publishHealthEvent(redis, status) {
  try {
    const client = createClient({ url: REDIS_URL });
    await client.connect();
    await client.publish(
      'tnf:system:health',
      JSON.stringify({
        type: 'HEALTH_CHECK',
        timestamp: new Date().toISOString(),
        status,
      })
    );
    await client.quit();
  } catch (err) {
    console.error('Failed to publish health event:', err.message);
  }
}

async function main() {
  console.log(`[${new Date().toISOString()}] Running orchestration health check...`);

  const relayStatus = await checkRelayHealth();
  const redisStatus = await checkRedisHealth();

  const overallHealthy = relayStatus.healthy && redisStatus.healthy;

  console.log('Relay Status:', relayStatus);
  console.log('Redis Status:', redisStatus);
  console.log('Overall Health:', overallHealthy ? 'HEALTHY' : 'DEGRADED');

  // Publish health event to Redis for monitoring
  if (REDIS_URL) {
    await publishHealthEvent(REDIS_URL, {
      relay: relayStatus,
      redis: redisStatus,
      overall: overallHealthy,
    });
  }

  process.exit(overallHealthy ? 0 : 1);
}

main().catch((err) => {
  console.error('Health check failed:', err.message);
  process.exit(1);
});
