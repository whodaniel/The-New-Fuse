import { Cluster, Redis } from 'ioredis';
export type StandaloneRedisClient = Redis | Cluster;
export interface StandaloneRedisConfig {
    host: string;
    port: number;
    password?: string;
    db: number;
    connectTimeout: number;
    lazyConnect: boolean;
    maxRetriesPerRequest: number | null;
    retryDelay: number;
    keyPrefix: string;
    clusterMode: boolean;
    clusterNodes: string[];
    upstash?: {
        restUrl?: string;
        restToken?: string;
    };
}
/**
 * Load Redis configuration from environment variables without NestJS dependencies
 */
export declare function loadStandaloneRedisConfig(): StandaloneRedisConfig;
/**
 * Create an ioredis client using standalone configuration
 */
export declare function createStandaloneRedisClient(config?: Partial<StandaloneRedisConfig>): StandaloneRedisClient;
export declare function describeStandaloneRedisClient(client: StandaloneRedisClient): 'cluster' | 'standalone';
export declare function connectStandaloneRedisClient(client: StandaloneRedisClient): Promise<void>;
/**
 * Create an Upstash REST client using standalone configuration
 */
export declare function createUpstashRestClient(config?: {
    restUrl?: string;
    restToken?: string;
}): any;
/**
 * Parse a Redis URL string into a Partial<StandaloneRedisConfig>
 */
export declare function parseRedisUrl(redisUrl: string): Partial<StandaloneRedisConfig>;
//# sourceMappingURL=standalone.d.ts.map