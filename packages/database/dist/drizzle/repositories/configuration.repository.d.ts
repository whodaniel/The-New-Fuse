import { systemConfigurations } from '../schema/configuration.js';
export declare class DrizzleConfigurationRepository {
    findAllConfigs(): Promise<{
        key: string;
        value: string;
        category: string;
        description: string | null;
        sensitive: boolean;
        updatedAt: Date;
        updatedBy: string | null;
    }[]>;
    findConfigByKey(key: string): Promise<{
        key: string;
        value: string;
        category: string;
        description: string | null;
        sensitive: boolean;
        updatedAt: Date;
        updatedBy: string | null;
    }>;
    updateConfig(key: string, value: string, updatedBy?: string): Promise<{
        description: string | null;
        updatedAt: Date;
        key: string;
        value: string;
        category: string;
        sensitive: boolean;
        updatedBy: string | null;
    }>;
    createConfig(data: typeof systemConfigurations.$inferInsert): Promise<{
        description: string | null;
        updatedAt: Date;
        key: string;
        value: string;
        category: string;
        sensitive: boolean;
        updatedBy: string | null;
    }>;
    getSystemSettings(): Promise<any>;
    updateSystemSettings(newSettings: any, updatedBy?: string): Promise<any>;
}
export declare const drizzleConfigurationRepository: DrizzleConfigurationRepository;
//# sourceMappingURL=configuration.repository.d.ts.map