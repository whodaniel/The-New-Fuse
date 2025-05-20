import { Result } from '../../domain/core/types.js';
export interface AppConfig {
    apiUrl: string;
    wsUrl: string;
    environment: 'development' | 'staging' | 'production';
    version: string;
    features: Record<string, boolean>;
    settings: Record<string, any>;
}
export declare class ConfigService {
    private static instance;
    private readonly eventBus;
    private readonly stateManager;
    private readonly logger;
    private config;
    private constructor();
    static getInstance(): ConfigService;
    initialize(): Promise<Result<void>>;
    private validateConfig;
    getConfig(): AppConfig;
    isFeatureEnabled(featureKey: string): boolean;
    getSetting<T>(key: string, defaultValue?: T): T | undefined;
    updateSetting(key: string, value: any): Promise<Result<void>>;
    isDevelopment(): boolean;
    isStaging(): boolean;
    isProduction(): boolean;
    getVersion(): string;
    subscribeToConfig(callback: (config: AppConfig) => void): () => void;
    subscribeToSetting<T>(key: string, callback: (value: T) => void): () => void;
}
