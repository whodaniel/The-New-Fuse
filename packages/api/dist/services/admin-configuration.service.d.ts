/**
 * Admin Configuration Service
 */
import { ConfigurationRepository } from '../repositories/configuration.repository';
export declare class AdminConfigurationService {
    private readonly configRepository;
    constructor(configRepository: ConfigurationRepository);
    getAllConfigs(): Promise<any>;
    updateConfig(key: string, value: string, userId: string): Promise<any>;
    getSettings(): Promise<any>;
    updateSettings(settings: any, userId: string): Promise<any>;
}
//# sourceMappingURL=admin-configuration.service.d.ts.map