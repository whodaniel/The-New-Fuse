"use strict";
/**
 * Configuration service for the agent package
 * Provides centralized configuration management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigService = void 0;
class ConfigService {
    config;
    constructor(initialConfig = {}) {
        this.config = {
            // Default configuration values
            REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379/0',
            REDIS_TTL: parseInt(process.env.REDIS_TTL || '3600', 10),
            AGENT_TIMEOUT: parseInt(process.env.AGENT_TIMEOUT || '30000', 10),
            LOG_LEVEL: process.env.LOG_LEVEL || 'info',
            NODE_ENV: process.env.NODE_ENV || 'development',
            ...initialConfig
        };
    }
    /**
     * Get a configuration value by key
     * @param key Configuration key
     * @param defaultValue Default value if key is not found
     * @returns Configuration value
     */
    get(key, defaultValue) {
        const value = this.config[key];
        if (value === undefined) {
            return defaultValue;
        }
        // Type conversion based on default value type
        if (typeof defaultValue === 'number') {
            return (typeof value === 'number' ? value : parseInt(String(value), 10));
        }
        if (typeof defaultValue === 'boolean') {
            return (typeof value === 'boolean' ? value : String(value).toLowerCase() === 'true');
        }
        return value;
    }
    /**
     * Set a configuration value
     * @param key Configuration key
     * @param value Configuration value
     */
    set(key, value) {
        this.config[key] = value;
    }
    /**
     * Check if a configuration key exists
     * @param key Configuration key
     * @returns True if key exists
     */
    has(key) {
        return key in this.config;
    }
    /**
     * Get all configuration values
     * @returns All configuration as an object
     */
    getAll() {
        return { ...this.config };
    }
    /**
     * Update configuration with new values
     * @param newConfig New configuration values
     */
    update(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
    /**
     * Get Redis configuration
     * @returns Redis configuration object
     */
    getRedisConfig() {
        return {
            url: this.get('REDIS_URL'),
            ttl: this.get('REDIS_TTL', 3600),
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
            lazyConnect: this.get('NODE_ENV') !== 'production'
        };
    }
    /**
     * Get agent configuration
     * @returns Agent configuration object
     */
    getAgentConfig() {
        return {
            timeout: this.get('AGENT_TIMEOUT', 30000),
            maxRetries: this.get('AGENT_MAX_RETRIES', 3),
            enableMetrics: this.get('AGENT_ENABLE_METRICS', true),
            logLevel: this.get('LOG_LEVEL', 'info')
        };
    }
    /**
     * Check if running in development mode
     * @returns True if in development mode
     */
    isDevelopment() {
        return this.get('NODE_ENV') === 'development';
    }
    /**
     * Check if running in production mode
     * @returns True if in production mode
     */
    isProduction() {
        return this.get('NODE_ENV') === 'production';
    }
}
exports.ConfigService = ConfigService;
//# sourceMappingURL=ConfigService.js.map