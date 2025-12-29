import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { EventEmitter } from 'events';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { z } from 'zod';

export interface ConfigSchema {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required?: boolean;
  default?: any;
  description?: string;
  validation?: z.ZodSchema;
}

export interface ConfigurationOptions {
  autoReload?: boolean;
  watchInterval?: number;
  cacheEnabled?: boolean;
  validateOnLoad?: boolean;
  configPath?: string;
}

@Injectable()
export class ConfigurationService extends EventEmitter implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ConfigurationService.name);
  private readonly configPath: string;
  private readonly schemas = new Map<string, ConfigSchema>();
  private readonly cache = new Map<string, any>();
  private readonly cachePrefix: string = 'config:';
  private watcherIntervals: NodeJS.Timeout[] = [];
  private readonly options: ConfigurationOptions;

  constructor(
    private readonly configService: ConfigService,
    options: ConfigurationOptions = {},
  ) {
    super();
    this.options = {
      autoReload: true,
      watchInterval: 5000,
      cacheEnabled: true,
      validateOnLoad: true,
      ...options,
    };
    this.configPath = this.options.configPath || process.cwd();
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.loadSchemas();
      await this.loadConfigurations();

      if (this.options.autoReload) {
        this.startConfigWatcher();
      }

      this.logger.log('Configuration service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize configuration service', error);
      throw error;
    }
  }

  private async loadSchemas(): Promise<void> {
    try {
      const schemaDir = path.join(this.configPath, 'schemas');
      try {
        const files = await fs.readdir(schemaDir);
        for (const file of files) {
          if (file.endsWith('.yaml') || file.endsWith('.yml')) {
            const filePath = path.join(schemaDir, file);
            const content = await fs.readFile(filePath, 'utf8');
            const schema = yaml.load(content) as ConfigSchema;
            if (schema && schema.name) {
              this.schemas.set(schema.name, schema);
              this.logger.debug(`Loaded schema: ${schema.name}`);
            }
          }
        }
      } catch (dirError) {
        this.logger.warn(`Schema directory not found: ${schemaDir}`);
      }
    } catch (error) {
      const errorMessage = 'Failed to load configuration schemas';
      this.logger.error(errorMessage, error);
      throw new Error(errorMessage);
    }
  }

  private async loadConfigurations(): Promise<void> {
    try {
      const files = await fs.readdir(this.configPath);
      for (const file of files) {
        if (file.endsWith('.yaml') || file.endsWith('.yml')) {
          const filePath = path.join(this.configPath, file);
          await this.loadConfigFile(filePath);
        }
      }
    } catch (error) {
      let errorMessage = 'Failed to load configuration files';
      if ((error as any).code === 'ENOENT') {
        errorMessage = `Configuration directory not found: ${this.configPath}`;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      this.logger.error(errorMessage, error);
      // Don't throw if config dir doesn't exist, just warn
      // throw new Error(errorMessage);
    }
  }

  private async loadConfigFile(filePath: string): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const config = yaml.load(content) as Record<string, any>;
      if (config) {
        for (const [key, value] of Object.entries(config)) {
          const processedValue = this.processConfigValue(key, value);
          this.setConfig(key, processedValue);
        }

        this.logger.debug(`Loaded config file: ${filePath}`);
      }
    } catch (error) {
      this.logger.error(`Failed to load config file: ${filePath}`, error);
      throw error;
    }
  }

  private processConfigValue(key: string, value: any): any {
    const schema = this.schemas.get(key);
    if (!schema) {
      return value;
    }

    // Handle environment variable substitution
    if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
      const envVar = value.slice(2, -1);
      const envValue = process.env[envVar];
      if (envValue !== undefined) {
        let parsedValue: any = envValue;
        // Type conversion based on schema
        if (schema.type === 'number') {
          parsedValue = parseFloat(envValue);
        } else if (schema.type === 'boolean') {
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
      } catch (error) {
        this.logger.warn(`Validation failed for config ${key}:`, error);
        return value;
      }
    }

    return value;
  }

  private startConfigWatcher(): void {
    const watcherInterval = setInterval(async () => {
      try {
        await this.reloadConfigurations();
      } catch (error) {
        this.logger.error('Error during config reload:', error);
      }
    }, this.options.watchInterval);
    this.watcherIntervals.push(watcherInterval);
  }

  async reloadConfigurations(): Promise<void> {
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
    } catch (error) {
      this.logger.error('Failed to reload configurations', error);
      throw error;
    }
  }

  setConfig(key: string, value: any): void {
    const cacheKey = `${this.cachePrefix}${key}`;
    this.cache.set(cacheKey, value);
    this.emit('configSet', { key, value });
  }

  getConfig<T = any>(key: string, defaultValue?: T): T {
    const cacheKey = `${this.cachePrefix}${key}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Fallback to NestJS ConfigService
    const value = this.configService.get<T>(key);
    if (value !== undefined) {
      this.cache.set(cacheKey, value);
      return value;
    }

    return defaultValue as T;
  }

  hasConfig(key: string): boolean {
    const cacheKey = `${this.cachePrefix}${key}`;
    return this.cache.has(cacheKey) || this.configService.get(key) !== undefined;
  }

  deleteConfig(key: string): boolean {
    const cacheKey = `${this.cachePrefix}${key}`;
    const deleted = this.cache.delete(cacheKey);
    if (deleted) {
      this.emit('configDeleted', { key });
    }

    return deleted;
  }

  getAllConfigs(): Record<string, any> {
    const configs: Record<string, any> = {};
    for (const [cacheKey, value] of this.cache.entries()) {
      if (cacheKey.startsWith(this.cachePrefix)) {
        const key = cacheKey.slice(this.cachePrefix.length);
        configs[key] = value;
      }
    }

    return configs;
  }

  getSchema(name: string): ConfigSchema | undefined {
    return this.schemas.get(name);
  }

  getAllSchemas(): ConfigSchema[] {
    return Array.from(this.schemas.values());
  }

  validateConfig(key: string, value: any): boolean {
    const schema = this.schemas.get(key);
    if (!schema) {
      return true;
    }

    if (schema.validation) {
      try {
        schema.validation.parse(value);
        return true;
      } catch {
        return false;
      }
    }
    return true;
  }

  async saveConfig(key: string, value: any): Promise<void> {
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
    } catch (error) {
      this.logger.error(`Failed to save config ${key}:`, error);
      throw error;
    }
  }

  private async loadYamlFile(filePath: string): Promise<any> {
    const content = await fs.readFile(filePath, 'utf8');
    return yaml.load(content);
  }

  onModuleDestroy(): void {
    // Clear all watchers
    for (const interval of this.watcherIntervals) {
      clearInterval(interval);
    }
    this.watcherIntervals = [];
    this.logger.log('Configuration service destroyed');
  }
}
