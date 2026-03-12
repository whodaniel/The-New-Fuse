/**
 * Start the TNF Orchestrator Router
 */

import { TNFRouter } from './tnf-router';

// Load env vars
const REDIS_URL =
  process.env.REDIS_URL ||
  process.env.RAILWAY_REDIS_URL ||
  process.env.LIVE_REDIS_URL ||
  process.env.REDIS_PRIVATE_URL ||
  process.env.REDIS_TLS_URL ||
  'redis://localhost:6379';

async function main() {
  console.log('🚀 Starting TNF Orchestrator Router...');
  console.log(`Connecting to Redis at ${REDIS_URL}`);

  const router = new TNFRouter({
    redisUrl: REDIS_URL,
  });

  await router.start();

  console.log('✅ Router active and listening for TNF Envelopes');

  // Handle shutdown
  process.on('SIGINT', async () => {
    console.log('\nStopping router...');
    await router.stop();
    console.log('Router stopped');
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
