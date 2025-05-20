import { RedisService } from '../cache/redis.service.js';
export declare class ServiceRegistryService {
    private redis;
    constructor(redis: RedisService);
    registerService(): Promise<void>;
}
