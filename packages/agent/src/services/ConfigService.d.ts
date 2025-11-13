/**
 * Configuration service for the agent package
 * Provides centralized configuration management
 */
export interface ConfigOptions {
    [key: string]: string | number | boolean | undefined;
}
export declare class ConfigService {
    private config;
    constructor(initialConfig?: ConfigOptions);
    /**
     * Get a configuration value by key
     * @param key Configuration key
     * @param defaultValue Default value if key is not found
     * @returns Configuration value
     */
    get<T = string>(key: string, defaultValue?: T): T;
    /**
     * Set a configuration value
     * @param key Configuration key
     * @param value Configuration value
     */
    set(key: string, value: string | number | boolean): void;
    /**
     * Check if a configuration key exists
     * @param key Configuration key
     * @returns True if key exists
     */
    has(key: string): boolean;
    /**
     * Get all configuration values
     * @returns All configuration as an object
     */
    getAll(): ConfigOptions;
    /**
     * Update configuration with new values
     * @param newConfig New configuration values
     */
    update(newConfig: ConfigOptions): void;
    /**
     * Get Redis configuration
     * @returns Redis configuration object
     */
    getRedisConfig(): {
        url: string;
        ttl: number;
        retryStrategy: (times: number) => number;
        maxRetriesPerRequest: number;
        enableReadyCheck: boolean;
        lazyConnect: boolean;
    };
    /**
     * Get agent configuration
     * @returns Agent configuration object
     */
    getAgentConfig(): {
        timeout: number;
        maxRetries: number;
        enableMetrics: boolean;
        logLevel: string;
    };
    /**
     * Check if running in development mode
     * @returns True if in development mode
     */
    isDevelopment(): boolean;
    /**
     * Check if running in production mode
     * @returns True if in production mode
     */
    isProduction(): boolean;
}
//# sourceMappingURL=ConfigService.d.ts.map