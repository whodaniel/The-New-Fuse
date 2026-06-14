/**
 * Configuration Repository - Drizzle ORM Analysis
 *
 * Adapted for NestJS Dependency Injection.
 */
import { type DrizzleClient } from '@the-new-fuse/database';
export declare class ConfigurationRepository {
    private readonly db;
    constructor(db: DrizzleClient);
    findAllConfigs(): Promise<{
        key: string;
        value: string;
        category: string;
        description: string;
        sensitive: boolean;
        updatedAt: Date;
        updatedBy: string;
    }[]>;
    findConfigByKey(key: string): Promise<{
        key: string;
        value: string;
        category: string;
        description: string;
        sensitive: boolean;
        updatedAt: Date;
        updatedBy: string;
    }>;
    updateConfig(key: string, value: string, updatedBy?: string): Promise<{
        description: string;
        updatedAt: Date;
        category: string;
        value: string;
        key: string;
        sensitive: boolean;
        updatedBy: string;
    }>;
    getSystemSettings(): Promise<any>;
    updateSystemSettings(newSettings: any, updatedBy?: string): Promise<any>;
}
//# sourceMappingURL=configuration.repository.d.ts.map