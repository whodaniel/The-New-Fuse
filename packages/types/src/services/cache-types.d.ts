import { BaseServiceConfig } from './service-types.js';
export interface CacheConfig extends BaseServiceConfig {
    defaultTTL?: number;
    host?: string;
    port?: number;
    password?: string;
}
export interface CacheOptions {
    ttl?: number;
    tags?: string[];
}
//# sourceMappingURL=cache-types.d.ts.map