import { RedisService } from '../cache/redis.service;';
export declare class ServiceRegistryService {
    private redis;
    constructor(redis: RedisService);
    registerService(): Promise<void>;
}
