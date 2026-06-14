"use strict";
/**
 * Start the TNF Orchestrator Router
 */
Object.defineProperty(exports, "__esModule", { value: true });
const tnf_router_js_1 = require("./tnf-router.js");
const config_1 = require("@nestjs/config");
const infrastructure_1 = require("@the-new-fuse/infrastructure");
// Load env vars
const REDIS_URL = process.env.REDIS_URL ||
    process.env.CLOUD_RUNTIME_REDIS_URL ||
    process.env.LIVE_REDIS_URL ||
    process.env.REDIS_PRIVATE_URL ||
    process.env.REDIS_TLS_URL ||
    'redis://localhost:6379';
async function main() {
    console.log('🚀 Starting TNF Orchestrator Router...');
    console.log(`Connecting to Redis at ${REDIS_URL}`);
    process.env.REDIS_URL = REDIS_URL;
    const configService = new config_1.ConfigService({ REDIS_URL });
    const redisConfig = new infrastructure_1.RedisConfig(configService);
    const redisService = new infrastructure_1.UnifiedRedisService(redisConfig);
    await redisService.onModuleInit();
    const router = new tnf_router_js_1.TNFRouter(redisService, {
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
//# sourceMappingURL=start.js.map