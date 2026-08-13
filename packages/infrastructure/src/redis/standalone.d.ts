import { Cluster, Redis } from 'ioredis';
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
export declare function createStandaloneRedisClient(config?: Partial<StandaloneRedisConfig>): Redis | Cluster;
/**
 * Create an Upstash REST client using standalone configuration
 */
export declare function createUpstashRestClient(config?: {
    restUrl?: string;
    restToken?: string;
}): any;
//# sourceMappingURL=standalone.d.ts.map