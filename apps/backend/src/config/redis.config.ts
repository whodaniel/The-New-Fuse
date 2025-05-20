import { RedisConfig } from '../../../packages/core/src/config/redis_config.js';

export const redisConfig: RedisConfig = {
    host: 'localhost',
    port: 6380,  // Using port 6380 as we configured in our Redis server
    db: 0,
    tls: false
};