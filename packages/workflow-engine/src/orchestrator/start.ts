/**
 * Start the TNF Orchestrator Router
 */

import { TNFRouter } from './tnf-router.js';
import { ConfigService } from '@nestjs/config';
import { RedisConfig, UnifiedRedisService } from '@the-new-fuse/infrastructure';

// Load env vars
const REDIS_URL =
  process.env.REDIS_URL ||
  process.env.CLOUD_RUNTIME_REDIS_URL ||
  process.env.LIVE_REDIS_URL ||
  process.env.REDIS_PRIVATE_URL ||
  process.env.REDIS_TLS_URL ||
  'redis://localhost:6379';

async function main() {
  console.log('🚀 Starting TNF Orchestrator Router...');
  console.log(`Connecting to Redis at ${REDIS_URL}`);

  process.env.REDIS_URL = REDIS_URL;

  const configService = new ConfigService({ REDIS_URL });
  const redisConfig = new RedisConfig(configService);
  const redisService = new UnifiedRedisService(redisConfig);
  await redisService.onModuleInit();

  const router = new TNFRouter(redisService, {
    redisUrl: REDIS_URL,
  });

  await router.start();

  console.log('✅ Router active and listening for TNF Envelopes');

  // Handle shutdown
  process.on('SIGINT', async () => {
    console.log('\nStopping router...');
    await router.stop();
    await redisService.onModuleDestroy();
    console.log('Router stopped');
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
