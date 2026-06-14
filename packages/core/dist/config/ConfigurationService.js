var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ConfigurationService_1;
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'events';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';
let ConfigurationService = ConfigurationService_1 = class ConfigurationService extends EventEmitter {
    constructor(configService, options = {}) {
        super();
        this.configService = configService;
        this.logger = new Logger(ConfigurationService_1.name);
        this.schemas = new Map();
        this.cache = new Map();
        this.cachePrefix = 'config:';
        this.watcherIntervals = [];
        this.options = {
            autoReload: true,
            watchInterval: 5000,
            cacheEnabled: true,
            validateOnLoad: true,
            ...options,
        };
        this.configPath = this.options.configPath || process.cwd();
    }
    async onModuleInit() {
        try {
            await this.loadSchemas();
            await this.loadConfigurations();
            if (this.options.autoReload) {
                this.startConfigWatcher();
            }
            this.logger.log('Configuration service initialized successfully');
        }
        catch (error) {
            this.logger.error('Failed to initialize configuration service', error);
            throw error;
        }
    }
    async loadSchemas() {
        try {
            const schemaDir = path.join(this.configPath, 'schemas');
            try {
                const files = await fs.readdir(schemaDir);
                for (const file of files) {
                    if (file.endsWith('.yaml') || file.endsWith('.yml')) {
                        const filePath = path.join(schemaDir, file);
                        const content = await fs.readFile(filePath, 'utf8');
                        const schema = yaml.load(content);
                        if (schema && schema.name) {
                            this.schemas.set(schema.name, schema);
                            this.logger.debug(`Loaded schema: ${schema.name}`);
                        }
                    }
                }
            }
            catch (dirError) {
                this.logger.warn(`Schema directory not found: ${schemaDir}`);
            }
        }
        catch (error) {
            const errorMessage = 'Failed to load configuration schemas';
            this.logger.error(errorMessage, error);
            throw new Error(errorMessage);
        }
    }
    async loadConfigurations() {
        try {
            const files = await fs.readdir(this.configPath);
            for (const file of files) {
                if (file.endsWith('.yaml') || file.endsWith('.yml')) {
                    const filePath = path.join(this.configPath, file);
                    await this.loadConfigFile(filePath);
                }
            }
        }
        catch (error) {
            let errorMessage = 'Failed to load configuration files';
            if (error.code === 'ENOENT') {
                errorMessage = `Configuration directory not found: ${this.configPath}`;
            }
            else if (typeof error === 'string') {
                errorMessage = error;
            }
            this.logger.error(errorMessage, error);
            // Don't throw if config dir doesn't exist, just warn
            // throw new Error(errorMessage);
        }
    }
    async loadConfigFile(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const config = yaml.load(content);
            if (config) {
                for (const [key, value] of Object.entries(config)) {
                    const processedValue = this.processConfigValue(key, value);
                    this.setConfig(key, processedValue);
                }
                this.logger.debug(`Loaded config file: ${filePath}`);
            }
        }
        catch (error) {
            this.logger.error(`Failed to load config file: ${filePath}`, error);
            throw error;
        }
    }
    processConfigValue(key, value) {
        const schema = this.schemas.get(key);
        if (!schema) {
            return value;
        }
        // Handle environment variable substitution
        if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
            const envVar = value.slice(2, -1);
            // Try primary key, then Stripe Projects CLI fallbacks
            let envValue = process.env[envVar];
            if (envValue === undefined) {
                // Fallback mapping matching ConfigService
                const mapping = {
                    'DATABASE_URL': 'STRIPE_PROJECT_POSTGRES_URL',
                    'REDIS_HOST': 'STRIPE_PROJECT_REDIS_HOST',
                    'REDIS_PORT': 'STRIPE_PROJECT_REDIS_PORT',
                    'REDIS_PASSWORD': 'STRIPE_PROJECT_REDIS_PASSWORD',
                    'OPENAI_API_KEY': 'STRIPE_PROJECT_OPENAI_API_KEY',
                };
                const stripeKey = mapping[envVar] || `STRIPE_PROJECT_${envVar}`;
                envValue = process.env[stripeKey];
            }
            if (envValue !== undefined) {
                let parsedValue = envValue;
                // Type conversion based on schema
                if (schema.type === 'number') {
                    parsedValue = parseFloat(envValue);
                }
                else if (schema.type === 'boolean') {
                    parsedValue = envValue.toLowerCase() === 'true';
                }
                return parsedValue;
            }
        }
        // Apply default value if not provided
        if (value === undefined && schema.default !== undefined) {
            return schema.default;
        }
        // Validate if validation schema is provided
        if (schema.validation) {
            try {
                return schema.validation.parse(value);
            }
            catch (error) {
                this.logger.warn(`Validation failed for config ${key}:`, error);
                return value;
            }
        }
        return value;
    }
    startConfigWatcher() {
        const watcherInterval = setInterval(async () => {
            try {
                await this.reloadConfigurations();
            }
            catch (error) {
                this.logger.error('Error during config reload:', error);
            }
        }, this.options.watchInterval);
        this.watcherIntervals.push(watcherInterval);
    }
    async reloadConfigurations() {
        try {
            const oldConfig = new Map(this.cache);
            this.cache.clear();
            await this.loadConfigurations();
            // Check for changes and emit events
            for (const [key, value] of this.cache.entries()) {
                const oldValue = oldConfig.get(key);
                if (JSON.stringify(oldValue) !== JSON.stringify(value)) {
                    this.emit('configChanged', { key, oldValue, newValue: value });
                }
            }
            this.logger.debug('Configuration reloaded successfully');
        }
        catch (error) {
            this.logger.error('Failed to reload configurations', error);
            throw error;
        }
    }
    setConfig(key, value) {
        const cacheKey = `${this.cachePrefix}${key}`;
        this.cache.set(cacheKey, value);
        this.emit('configSet', { key, value });
    }
    getConfig(key, defaultValue) {
        const cacheKey = `${this.cachePrefix}${key}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        // Fallback to NestJS ConfigService
        const value = this.configService.get(key);
        if (value !== undefined) {
            this.cache.set(cacheKey, value);
            return value;
        }
        return defaultValue;
    }
    hasConfig(key) {
        const cacheKey = `${this.cachePrefix}${key}`;
        return this.cache.has(cacheKey) || this.configService.get(key) !== undefined;
    }
    deleteConfig(key) {
        const cacheKey = `${this.cachePrefix}${key}`;
        const deleted = this.cache.delete(cacheKey);
        if (deleted) {
            this.emit('configDeleted', { key });
        }
        return deleted;
    }
    getAllConfigs() {
        const configs = {};
        for (const [cacheKey, value] of this.cache.entries()) {
            if (cacheKey.startsWith(this.cachePrefix)) {
                const key = cacheKey.slice(this.cachePrefix.length);
                configs[key] = value;
            }
        }
        return configs;
    }
    getSchema(name) {
        return this.schemas.get(name);
    }
    getAllSchemas() {
        return Array.from(this.schemas.values());
    }
    validateConfig(key, value) {
        const schema = this.schemas.get(key);
        if (!schema) {
            return true;
        }
        if (schema.validation) {
            try {
                schema.validation.parse(value);
                return true;
            }
            catch {
                return false;
            }
        }
        return true;
    }
    async saveConfig(key, value) {
        try {
            // Validate before saving
            if (!this.validateConfig(key, value)) {
                throw new Error(`Invalid value for config ${key}`);
            }
            this.setConfig(key, value);
            // Optionally persist to file system
            const configFile = path.join(this.configPath, 'runtime.config.yaml');
            const existingConfig = await this.loadYamlFile(configFile).catch(() => ({}));
            existingConfig[key] = value;
            await fs.writeFile(configFile, yaml.dump(existingConfig), 'utf8');
            this.logger.debug(`Saved config ${key} to file`);
        }
        catch (error) {
            this.logger.error(`Failed to save config ${key}:`, error);
            throw error;
        }
    }
    async loadYamlFile(filePath) {
        const content = await fs.readFile(filePath, 'utf8');
        return yaml.load(content);
    }
    onModuleDestroy() {
        // Clear all watchers
        for (const interval of this.watcherIntervals) {
            clearInterval(interval);
        }
        this.watcherIntervals = [];
        this.logger.log('Configuration service destroyed');
    }
};
ConfigurationService = ConfigurationService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService, Object])
], ConfigurationService);
export { ConfigurationService };
//# sourceMappingURL=ConfigurationService.js.map