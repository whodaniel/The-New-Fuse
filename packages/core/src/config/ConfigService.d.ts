import { DatabaseConfig, RedisConfig, MonitoringConfig, AIConfig } from '../types';
import { ServiceState } from '../types';
export declare const ENVIRONMENTS: {
    readonly DEVELOPMENT: "development";
    readonly PRODUCTION: "production";
    readonly STAGING: "staging";
    readonly TEST: "test";
};
export declare class ConfigService {
    private state;
    private config;
    private readonly requiredEnvVars;
    constructor();
    start(): Promise<void>;
    stop(): Promise<void>;
    getState(): ServiceState;
    get<T = any>(key: string, defaultValue?: T): T;
    getEnvironment(): string;
    isDevelopment(): boolean;
    isProduction(): boolean;
    isStaging(): boolean;
    isTest(): boolean;
    getDatabaseConfig(): DatabaseConfig;
    getRedisConfig(): RedisConfig;
    getRedisHost(): string;
    getRedisPort(): number;
    getRedisPassword(): string | undefined;
    getRedisDb(): number;
    getMonitoringConfig(): MonitoringConfig;
    getAIConfig(): AIConfig;
    getEnv(key: string, defaultValue?: string): string;
    getEnvNumber(key: string, defaultValue?: number): number;
    getEnvBoolean(key: string, defaultValue?: boolean): boolean;
    getEnvArray(key: string, separator?: string, defaultValue?: string[]): string[];
    private validateConfiguration;
    private loadConfiguration;
    private loadDatabaseConfig;
    private loadRedisConfig;
    private loadMonitoringConfig;
    private loadAIConfig;
    private getDefaultPort;
    private isValidUrl;
    updateConfig(path: string, value: any): void;
    exportConfig(): Record<string, any>;
    private maskSensitiveUrl;
    healthCheck(): Promise<{
        status: 'healthy' | 'unhealthy';
        details: Record<string, any>;
    }>;
}
//# sourceMappingURL=ConfigService.d.ts.map