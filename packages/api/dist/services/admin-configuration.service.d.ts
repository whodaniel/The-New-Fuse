/**
 * Admin Configuration Service
 */
import { ConfigurationRepository } from '../repositories/configuration.repository.js';
export declare class AdminConfigurationService {
    private readonly configRepository;
    constructor(configRepository: ConfigurationRepository);
    getAllConfigs(): Promise<{
        key: string;
        value: string;
        category: string;
        description: string;
        sensitive: boolean;
        updatedAt: Date;
        updatedBy: string;
    }[]>;
    updateConfig(key: string, value: string, userId: string): Promise<{
        description: string;
        updatedAt: Date;
        category: string;
        value: string;
        key: string;
        sensitive: boolean;
        updatedBy: string;
    }>;
    getSettings(): Promise<any>;
    updateSettings(settings: any, userId: string): Promise<any>;
}
//# sourceMappingURL=admin-configuration.service.d.ts.map