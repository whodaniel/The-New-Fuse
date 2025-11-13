import { UnifiedRedisService } from './UnifiedRedisService';
export interface LegacyRedisService {
    get?: (key: string) => Promise<string | null>;
    set?: (key: string, value: string, ttl?: number) => Promise<void>;
    del?: (key: string) => Promise<number>;
    exists?: (key: string) => Promise<boolean>;
    publish?: (channel: string, message: string) => Promise<void>;
    subscribe?: (channel: string, callback: (message: string) => void) => Promise<void>;
    quit?: () => Promise<void>;
}
export declare class RedisMigrationUtils {
    private readonly unifiedRedisService;
    private readonly logger;
    constructor(unifiedRedisService: UnifiedRedisService);
    /**
     * Create a legacy-compatible wrapper for existing code
     */
    createLegacyWrapper(): LegacyRedisService;
    /**
     * Migrate data from old Redis instances to the unified service
     */
    migrateData(legacyService: LegacyRedisService, keyPatterns?: string[], options?: {
        batchSize?: number;
        preserveTtl?: boolean;
        dryRun?: boolean;
    }): Promise<{
        migrated: number;
        failed: string[];
    }>;
    /**
     * Validate that migration was successful
     */
    validateMigration(legacyService: LegacyRedisService, sampleKeys?: string[]): Promise<{
        valid: number;
        invalid: string[];
    }>;
    private scanKeysFromLegacy;
}
//# sourceMappingURL=MigrationUtils.d.ts.map