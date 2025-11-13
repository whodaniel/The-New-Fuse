var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { ServiceState } from '../types';
import { logger } from '../utils/logger';
import { ConfigurationError } from '../utils/errors';
export const ENVIRONMENTS = {
    DEVELOPMENT: 'development',
    PRODUCTION: 'production',
    STAGING: 'staging',
    TEST: 'test',
};
let ConfigService = class ConfigService {
    state = ServiceState.UNINITIALIZED;
    config;
    requiredEnvVars = [
        'NODE_ENV',
        'DATABASE_URL',
        'REDIS_HOST',
        'REDIS_PORT',
    ];
    constructor() {
        logger.setContext('ConfigService');
        this.config = this.loadConfiguration();
    }
    async start() {
        if (this.state === ServiceState.RUNNING) {
            logger.warn('ConfigService is already running');
            return;
        }
        try {
            this.state = ServiceState.INITIALIZING;
            logger.info('Starting ConfigService');
            // Validate configuration
            this.validateConfiguration();
            this.state = ServiceState.RUNNING;
            logger.info('ConfigService started successfully', {
                environment: this.config.environment
            });
        }
        catch (error) {
            this.state = ServiceState.ERROR;
            logger.error('Failed to start ConfigService', error);
            throw error;
        }
    }
    async stop() {
        if (this.state === ServiceState.STOPPED) {
            logger.warn('ConfigService is already stopped');
            return;
        }
        try {
            this.state = ServiceState.STOPPING;
            logger.info('Stopping ConfigService');
            this.state = ServiceState.STOPPED;
            logger.info('ConfigService stopped successfully');
        }
        catch (error) {
            this.state = ServiceState.ERROR;
            logger.error('Failed to stop ConfigService', error);
            throw error;
        }
    }
    getState() {
        return this.state;
    }
    // Configuration getters
    get(key, defaultValue) {
        const keys = key.split('.');
        let value = this.config;
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            }
            else {
                return defaultValue;
            }
        }
        return value;
    }
    getEnvironment() {
        return this.config.environment;
    }
    isDevelopment() {
        return this.config.environment === ENVIRONMENTS.DEVELOPMENT;
    }
    isProduction() {
        return this.config.environment === ENVIRONMENTS.PRODUCTION;
    }
    isStaging() {
        return this.config.environment === ENVIRONMENTS.STAGING;
    }
    isTest() {
        return this.config.environment === ENVIRONMENTS.TEST;
    }
    getDatabaseConfig() {
        return this.config.database;
    }
    getRedisConfig() {
        return this.config.redis;
    }
    getRedisHost() {
        return this.config.redis.host;
    }
    getRedisPort() {
        return this.config.redis.port;
    }
    getRedisPassword() {
        return this.config.redis.password;
    }
    getRedisDb() {
        return this.config.redis.db || 0;
    }
    getMonitoringConfig() {
        return this.config.monitoring;
    }
    getAIConfig() {
        return this.config.ai;
    }
    // Environment variable helpers
    getEnv(key, defaultValue) {
        return process.env[key] || defaultValue || '';
    }
    getEnvNumber(key, defaultValue) {
        const value = process.env[key];
        if (!value)
            return defaultValue || 0;
        const parsed = parseInt(value, 10);
        if (isNaN(parsed)) {
            logger.warn('Invalid number in environment variable', { key, value });
            return defaultValue || 0;
        }
        return parsed;
    }
    getEnvBoolean(key, defaultValue) {
        const value = process.env[key];
        if (!value)
            return defaultValue || false;
        return value.toLowerCase() === 'true' || value === '1';
    }
    getEnvArray(key, separator = ',', defaultValue) {
        const value = process.env[key];
        if (!value)
            return defaultValue || [];
        return value.split(separator).map(item => item.trim()).filter(Boolean);
    }
    // Configuration validation
    validateConfiguration() {
        logger.info('Validating configuration');
        // Check required environment variables
        const missing = this.requiredEnvVars.filter(key => !process.env[key]);
        if (missing.length > 0) {
            throw new ConfigurationError(`Missing required environment variables: ${missing.join(', ')}`, { missing });
        }
        // Validate environment
        const validEnvironments = Object.values(ENVIRONMENTS);
        if (!validEnvironments.includes(this.config.environment)) {
            throw new ConfigurationError(`Invalid environment: ${this.config.environment}. Must be one of: ${validEnvironments.join(', ')}`, { environment: this.config.environment, validEnvironments });
        }
        // Validate database URL
        if (!this.isValidUrl(this.config.database.url)) {
            throw new ConfigurationError('Invalid database URL format', { url: this.config.database.url });
        }
        // Validate Redis configuration
        if (!this.config.redis.host || this.config.redis.port <= 0 || this.config.redis.port > 65535) {
            throw new ConfigurationError('Invalid Redis configuration', { host: this.config.redis.host, port: this.config.redis.port });
        }
        logger.info('Configuration validation completed successfully');
    }
    loadConfiguration() {
        logger.info('Loading configuration from environment');
        const environment = (process.env.NODE_ENV || ENVIRONMENTS.DEVELOPMENT);
        const config = {
            environment,
            database: this.loadDatabaseConfig(),
            redis: this.loadRedisConfig(),
            monitoring: this.loadMonitoringConfig(),
            ai: this.loadAIConfig(),
        };
        logger.info('Configuration loaded', {
            environment: config.environment,
            databaseConfigured: !!config.database.url,
            redisConfigured: !!config.redis.host,
            monitoringEnabled: config.monitoring.enabled,
            aiProvidersCount: config.ai.providers.length,
        });
        return config;
    }
    loadDatabaseConfig() {
        return {
            url: this.getEnv('DATABASE_URL'),
            maxConnections: this.getEnvNumber('DATABASE_MAX_CONNECTIONS', 10),
            connectionTimeout: this.getEnvNumber('DATABASE_CONNECTION_TIMEOUT', 30000),
            queryTimeout: this.getEnvNumber('DATABASE_QUERY_TIMEOUT', 60000),
        };
    }
    loadRedisConfig() {
        return {
            host: this.getEnv('REDIS_HOST', 'localhost'),
            port: this.getEnvNumber('REDIS_PORT', 6379),
            password: this.getEnv('REDIS_PASSWORD'),
            db: this.getEnvNumber('REDIS_DB', 0),
            maxRetries: this.getEnvNumber('REDIS_MAX_RETRIES', 3),
        };
    }
    loadMonitoringConfig() {
        return {
            enabled: this.getEnvBoolean('MONITORING_ENABLED', true),
            metricsInterval: this.getEnvNumber('METRICS_INTERVAL', 30000),
            logLevel: this.getEnv('LOG_LEVEL', 'info'),
            enablePerformanceTracking: this.getEnvBoolean('ENABLE_PERFORMANCE_TRACKING', true),
        };
    }
    loadAIConfig() {
        const providers = this.getEnvArray('AI_PROVIDERS', ',', ['ollama', 'lmstudio']);
        return {
            providers: providers.map(name => ({
                name,
                type: name,
                endpoint: this.getEnv(`${name.toUpperCase()}_ENDPOINT`, `http://localhost:${this.getDefaultPort(name)}`),
                command: this.getEnv(`${name.toUpperCase()}_COMMAND`, name),
                checkCommand: this.getEnv(`${name.toUpperCase()}_CHECK_COMMAND`),
                models: this.getEnvArray(`${name.toUpperCase()}_MODELS`, ',', []),
            })),
            defaultProvider: this.getEnv('DEFAULT_AI_PROVIDER', providers[0]),
            maxConcurrentRequests: this.getEnvNumber('AI_MAX_CONCURRENT_REQUESTS', 5),
            requestTimeout: this.getEnvNumber('AI_REQUEST_TIMEOUT', 30000),
        };
    }
    getDefaultPort(providerName) {
        const defaultPorts = {
            ollama: 11434,
            lmstudio: 1234,
            localai: 8080,
        };
        return defaultPorts[providerName] || 8080;
    }
    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        }
        catch {
            return false;
        }
    }
    // Configuration updates (for runtime configuration changes)
    updateConfig(path, value) {
        const keys = path.split('.');
        let target = this.config;
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!(key in target) || typeof target[key] !== 'object') {
                target[key] = {};
            }
            target = target[key];
        }
        const finalKey = keys[keys.length - 1];
        const oldValue = target[finalKey];
        target[finalKey] = value;
        logger.info('Configuration updated', {
            path,
            oldValue,
            newValue: value
        });
    }
    // Configuration export/import for debugging
    exportConfig() {
        return {
            ...this.config,
            // Mask sensitive information
            database: {
                ...this.config.database,
                url: this.maskSensitiveUrl(this.config.database.url),
            },
            redis: {
                ...this.config.redis,
                password: this.config.redis.password ? '***masked***' : undefined,
            },
        };
    }
    maskSensitiveUrl(url) {
        try {
            const parsed = new URL(url);
            if (parsed.password) {
                parsed.password = '***masked***';
            }
            return parsed.toString();
        }
        catch {
            return '***invalid-url***';
        }
    }
    // Health check
    async healthCheck() {
        try {
            const details = {
                state: this.state,
                environment: this.config.environment,
                configurationValid: true,
                requiredEnvVarsPresent: this.requiredEnvVars.every(key => !!process.env[key]),
            };
            const status = this.state === ServiceState.RUNNING && details.requiredEnvVarsPresent
                ? 'healthy'
                : 'unhealthy';
            return { status, details };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                details: {
                    error: error.message,
                    state: this.state,
                },
            };
        }
    }
};
ConfigService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [])
], ConfigService);
export { ConfigService };
//# sourceMappingURL=ConfigService.js.map