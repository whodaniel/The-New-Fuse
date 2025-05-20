import { PrismaService } from '../lib/prisma/prisma.service.js';
import { RedisService } from './redis.service.js';
import { CacheService } from '../cache/CacheService.js';
export interface HealthStatus {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: Date;
    components: {
        database: {
            status: 'healthy' | 'unhealthy';
            latency?: number;
            error?: string;
        };
        redis: {
            status: 'healthy' | 'unhealthy';
            latency?: number;
            error?: string;
        };
        cache: {
            status: 'healthy' | 'unhealthy';
            stats?: {
                hits: number;
                misses: number;
                keys: number;
                memoryUsed: number;
            };
            error?: string;
        };
        system: {
            status: 'healthy' | 'unhealthy';
            uptime: number;
            memory: {
                used: number;
                total: number;
                percentage: number;
            };
            cpu: {
                usage: number;
            };
        };
    };
}
export declare class HealthService {
    private readonly prisma;
    private readonly redis;
    private readonly cache;
    private logger;
    constructor(prisma: PrismaService, redis: RedisService, cache: CacheService);
    getStatus(): Promise<HealthStatus>;
    private checkDatabase;
    private checkRedis;
    private checkCache;
    private checkSystem;
}
