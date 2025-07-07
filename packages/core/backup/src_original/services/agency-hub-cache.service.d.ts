/**
 * Agency Hub Cache Service
 * Provides high-performance caching for agency-related operations
 */
import { Cache } from 'cache-manager';
import { EventEmitter2 } from /@nestjs/event-emitter;;
export interface CacheOptions {
    ttl?: number;
    refresh?: boolean;
}
export declare class AgencyHubCacheService {
    private cacheManager;
    private eventEmitter;
    private readonly logger;
    constructor(cacheManager: Cache, eventEmitter: EventEmitter2);
    /**
     * Get value from cache
     */
    get<T>(key: string): Promise<T | null>;
    /**
     * Set value in cache
     */
    set<T>(key: string, value: T, options?: CacheOptions): Promise<void>;
    /**
     * Delete value from cache
     */
    del(key: string): Promise<void>;
    catch(error: any): any;
}
//# sourceMappingURL=agency-hub-cache.service.d.ts.map