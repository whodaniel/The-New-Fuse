import { Injectable, OnModuleInit } from '@nestjs/common';
import { Logger } from '@the-new-fuse/utils';
import { DatabaseService } from '@the-new-fuse/database'; // Assuming this provides the Prisma client or similar
import { Redis } from 'ioredis';
import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { z } from 'zod';

interface ConfigValue {
  key: string;
  value: unknown;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  environment: string;
  version: number;
  description?: string;
  tags: string[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

interface ConfigSchema {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  default?: unknown;
  description?: string;
  validation?: z.ZodType<any, any, any>; // Corrected ZodType
}

interface ConfigHistory {
  key: string;
  value: string; // Stored as JSON string in DB
  version: number;
  environment: string;
  changedBy: string;
  changedAt: Date;
  reason?: string;
}

@Injectable()
export class ConfigurationService extends EventEmitter implements OnModuleInit {
  private logger: Logger;
  private redis: Redis; // Assume injected by NestJS
  private db: DatabaseService; // Assume injected by NestJS
  private config: Map<string, ConfigValue>;
  private schemas: Map<string, ConfigSchema>;
  private readonly cachePrefix: string = 'config:';
  private readonly configPath: string;

  constructor(
    db: DatabaseService,
    redis: Redis,
  ) {
    super();
    this.logger = new Logger(ConfigurationService.name);
    this.db = db;
    this.redis = redis;
    this.config = new Map<string, ConfigValue>();
    this.schemas = new Map<string, ConfigSchema>();
    this.configPath = process.env.CONFIG_PATH || path.join(process.cwd(), 'config');
    this.logger.info(`Configuration path set to: ${this.configPath}`);
  }

  async onModuleInit(): Promise<void> {
    if (!this.db || !this.redis) {
      const errorMessage = 'DatabaseService or Redis client is not initialized. Check dependency injection setup.';
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }
    await this.loadSchemas();
    await this.loadConfigs();
    this.watchChanges();
  }

  private async loadSchemas(): Promise<void> {
    try {
      await fs.access(this.configPath); // Check if directory exists
      const schemaFiles = await fs.readdir(this.configPath);
      for (const file of schemaFiles) {
        if (file.endsWith('.schema.yaml') || file.endsWith('.schema.yml')) {
          const filePath = path.join(this.configPath, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const schema = yaml.load(content) as Record<string, ConfigSchema>;
          for (const [key, value] of Object.entries(schema)) {
            // Potentially validate schema structure here
            this.schemas.set(key, value);
          }
        }
      }
      this.logger.info(`Loaded ${this.schemas.size} configuration schemas`);
    } catch (e: unknown) {
      let errorMessage = 'Failed to load configuration schemas';
      if (e instanceof Error) {
        errorMessage = e.message;
        // Check for specific error code if available on the error object
        if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
          this.logger.warn(`Schema directory not found: ${this.configPath}. No schemas loaded.`);
          return; // Exit if directory not found, no need to log generic error
        }
      } else if (typeof e === 'string') {
        errorMessage = e;
      }
      this.logger.error(errorMessage, e);
    }
  }

  private async loadConfigs(): Promise<void> {
    try {
      // Load from database
      const dbConfigs = await this.db.configurations.findMany({
        where: { environment: process.env.NODE_ENV || 'development' },
      });

      for (const dbConfig of dbConfigs) {
        try {
          this.config.set(dbConfig.key, {
            ...dbConfig,
            value: JSON.parse(dbConfig.value as string), 
          });
          await this.cacheConfig(dbConfig.key);
        } catch(err) {
          this.logger.error(`Failed to parse or cache DB config for key ${dbConfig.key}:`, err);
        }
      }

      // Load from environment variables (override if schema exists)
      for (const [key, value] of Object.entries(process.env)) {
        if (this.schemas.has(key) && value !== undefined) {
          // Env vars are strings, attempt to parse if schema suggests other type
          let parsedValue: unknown = value;
          const schema = this.schemas.get(key);
          try {
            if (schema?.type === 'number') parsedValue = parseFloat(value);
            else if (schema?.type === 'boolean') parsedValue = value.toLowerCase() === 'true';
            else if (schema?.type === 'object' || schema?.type === 'array') parsedValue = JSON.parse(value);
          } catch (e) {
            this.logger.warn(`Failed to parse env var ${key} based on schema type ${schema?.type}. Using as string.`);
            parsedValue = value; // Fallback to string
          }
          await this.set(key, parsedValue, { reason: 'Loaded from environment variable' });
        }
      }
      
      // Load from .config.yaml files (can override previous)
      try {
        await fs.access(this.configPath); // Check if directory exists
        const configFiles = await fs.readdir(this.configPath);
        for (const file of configFiles) {
          if (file.endsWith('.config.yaml') || file.endsWith('.config.yml')) {
            const filePath = path.join(this.configPath, file);
            const content = await fs.readFile(filePath, 'utf-8');
            const fileConfigs = yaml.load(content) as Record<string, unknown>;
            for (const [key, value] of Object.entries(fileConfigs)) {
              if (this.schemas.has(key)) { // Only load if a schema exists
                await this.set(key, value, { reason: `Loaded from ${file}` });
              } else {
                this.logger.warn(`Skipping config key "${key}" from ${file} as no schema is defined.`);
              }
            }
          }
        }
      } catch (e: unknown) {
        let errorMessage = 'Failed to load .config.yaml files';
        if (e instanceof Error) {
          errorMessage = e.message;
          if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
            this.logger.warn(`Config file directory not found: ${this.configPath}. No file configs loaded.`);
            return;
          }
        } else if (typeof e === 'string') {
          errorMessage = e;
        }
        this.logger.error(errorMessage, e);
      }


      this.logger.info(`Loaded ${this.config.size} configuration values`);
    } catch (e: unknown) {
      let errorMessage = 'Failed to load configurations';
       if (e instanceof Error) {
           errorMessage = e.message;
       } else if (typeof e === 'string') {
           errorMessage = e;
       }
      this.logger.error(errorMessage, e);
    }
  }

  private watchChanges(): void {
    try {
      fs.access(this.configPath).then(() => {
        fs.watch(this.configPath, async (eventType, filename) => {
          if (filename && eventType === 'change') {
            if (filename.endsWith('.config.yaml') || filename.endsWith('.config.yml') || filename.endsWith('.schema.yaml') || filename.endsWith('.schema.yml')) {
              this.logger.info(`Detected change in ${filename}, reloading configurations...`);
              try {
                if (filename.includes('.schema.')) {
                  await this.loadSchemas();
                }
                await this.loadConfigs(); // Reload all configs for simplicity
                this.logger.info(`Configurations reloaded due to change in ${filename}.`);
              } catch (err) { // Changed error to err to avoid conflict
                this.logger.error(`Failed to reload configurations after change in ${filename}:`, err);
              }
            }
          }
        });
      }).catch(err => { // Changed error to err
        if (err && typeof err === 'object' && 'code' in err && err.code === 'ENOENT') {
          this.logger.warn(`Directory ${this.configPath} not found. File watching disabled.`);
        } else {
          this.logger.error(`Error setting up watch on ${this.configPath}:`, err);
        }
      });
    } catch (error) {
        this.logger.error('Failed to initialize configuration file watcher:', error);
    }
  }

  async get<T = any>(key: string): Promise<T | undefined> {
    try {
      const cached = await this.redis.get(`${this.cachePrefix}${key}`);
      if (cached) {
        return JSON.parse(cached) as T;
      }

      const configValue = this.config.get(key);
      if (configValue) {
        await this.cacheConfig(key); // Cache if found in memory but not in Redis
        return configValue.value as T;
      }
      
      // If not in cache or memory, try to load from DB as a last resort for this specific key
      const dbConfig = await this.db.configurations.findUnique({
        where: { 
          key_environment: { 
            key, 
            environment: process.env.NODE_ENV || 'development' 
          } 
        }
      });

      if (dbConfig) {
        const parsedValue = JSON.parse(dbConfig.value as string);
        // Manually construct a ConfigValue-like object to store in memory map and cache
        const valueToStore: ConfigValue = {
            key: dbConfig.key,
            value: parsedValue,
            type: dbConfig.type as ConfigValue['type'], // Ensure type compatibility
            environment: dbConfig.environment,
            version: dbConfig.version,
            description: dbConfig.description || undefined,
            tags: dbConfig.tags as string[], // Ensure type compatibility
            metadata: dbConfig.metadata as Record<string, unknown>, // Ensure type compatibility
            createdAt: dbConfig.createdAt,
            updatedAt: dbConfig.updatedAt,
        };
        this.config.set(key, valueToStore);
        await this.cacheConfig(key);
        return parsedValue as T;
      }

      this.logger.warn(`Configuration ${key} not found.`);
      return undefined; // Explicitly return undefined if not found
    } catch (error) {
      this.logger.error(`Failed to get configuration ${key}:`, error);
      return undefined; // Return undefined on error
    }
  }

  async set(
    key: string,
    value: unknown,
    options: {
      description?: string;
      tags?: string[];
      metadata?: Record<string, unknown>;
      reason?: string;
    } = {},
  ): Promise<void> {
    try {
      const schema = this.schemas.get(key);
      if (!schema) {
        this.logger.warn(`No schema defined for ${key}. Configuration not set.`);
        // Optionally throw an error or handle as per requirements
        // throw new Error(`No schema defined for ${key}`);
        return;
      }

      if (schema.validation) {
        try {
          schema.validation.parse(value);
        } catch (validationError: unknown) {
          if (validationError instanceof z.ZodError) {
            this.logger.error(`Validation failed for ${key}:`, validationError.errors);
          } else {
            this.logger.error(`Validation failed for ${key} with an unknown error:`, validationError);
          }
          throw validationError; // Re-throw validation error
        }
      }

      const current = this.config.get(key);
      const version = current ? current.version + 1 : 1;
      const environment = process.env.NODE_ENV || 'development';

      const newConfig: ConfigValue = {
        key,
        value,
        type: schema.type,
        environment,
        version,
        description: options.description || current?.description || schema.description,
        tags: options.tags || current?.tags || [],
        metadata: options.metadata || current?.metadata || {},
        createdAt: current?.createdAt || new Date(),
        updatedAt: new Date(),
      };

      this.config.set(key, newConfig);

      await this.db.configurations.upsert({
        where: { key_environment: { key, environment } },
        update: {
          value: JSON.stringify(value),
          type: newConfig.type,
          version: newConfig.version,
          description: newConfig.description,
          tags: newConfig.tags,
          metadata: newConfig.metadata as any, // Prisma might need 'any' for JSON fields
          updatedAt: newConfig.updatedAt,
        },
        create: {
          key,
          value: JSON.stringify(value),
          type: newConfig.type,
          environment,
          version: newConfig.version,
          description: newConfig.description,
          tags: newConfig.tags,
          metadata: newConfig.metadata as any, // Prisma might need 'any' for JSON fields
          createdAt: newConfig.createdAt,
          updatedAt: newConfig.updatedAt,
        },
      });

      await this.db.configurationHistory.create({
        data: {
          key,
          value: JSON.stringify(value), // Store value as JSON string
          version: newConfig.version,
          environment,
          changedBy: process.env.USER || process.env.USERNAME || 'system', // Added USERNAME as a fallback
          changedAt: new Date(),
          reason: options.reason,
        },
      });

      await this.cacheConfig(key);
      this.emit('configUpdated', { key, value, version, environment });
    } catch (error) {
      this.logger.error(`Failed to set configuration ${key}:`, error);
      throw error; // Re-throw to allow upstream handling
    }
  }

  private async cacheConfig(key: string): Promise<void> {
    const config = this.config.get(key);
    if (config) {
      await this.redis.set(
        `${this.cachePrefix}${key}`,
        JSON.stringify(config.value), // Cache only the value
        'EX', 3600, // Example: cache for 1 hour
      );
    } else {
      this.logger.warn(`Attempted to cache non-existent config key: ${key}`);
    }
  }

  async delete(key: string, reason?: string): Promise<void> {
    try {
      const configToDelete = this.config.get(key);
      if (!configToDelete) {
        this.logger.warn(`Configuration ${key} not found for deletion.`);
        return;
      }

      const environment = configToDelete.environment;
      this.config.delete(key);

      await this.db.configurations.delete({
        where: { key_environment: { key, environment } },
      });

      await this.db.configurationHistory.create({
        data: {
          key,
          value: null, // Indicate deletion
          version: configToDelete.version + 1,
          environment,
          changedBy: process.env.USER || process.env.USERNAME || 'system', // Added USERNAME as a fallback
          changedAt: new Date(),
          reason: reason || 'Deleted',
        },
      });

      await this.redis.del(`${this.cachePrefix}${key}`);
      this.emit('configDeleted', { key, environment });
    } catch (error) {
      this.logger.error(`Failed to delete configuration ${key}:`, error);
      throw error;
    }
  }

  async getHistory(
    key: string,
    options: {
      startTime?: Date;
      endTime?: Date;
      limit?: number;
    } = {},
  ): Promise<ConfigHistory[]> {
    // Assuming db.configurationHistory.findMany exists and returns typed data
    const historyEntries = await this.db.configurationHistory.findMany({
      where: {
        key,
        environment: process.env.NODE_ENV || 'development',
        changedAt: {
          gte: options.startTime,
          lte: options.endTime,
        },
      },
      orderBy: { changedAt: 'desc' },
      take: options.limit || 100, // Default limit
    });
    // Parse 'value' from JSON string if it's stored that way
    return historyEntries.map(entry => ({
        ...entry,
        value: entry.value !== null ? JSON.parse(entry.value as string) : null,
    }));
  }

  async find(
    options: {
      pattern?: string;
      type?: 'string' | 'number' | 'boolean' | 'object' | 'array';
      environment?: string;
      tags?: string[];
      metadata?: Record<string, unknown>;
    } = {},
  ): Promise<ConfigValue[]> {
    const allConfigs = Array.from(this.config.values());
    return allConfigs.filter(config => {
      if (options.pattern && !config.key.includes(options.pattern)) {
        return false;
      }
      if (options.type && config.type !== options.type) {
        return false;
      }
      if (options.environment && config.environment !== options.environment) {
        return false;
      }
      if (options.tags && !options.tags.every(tag => config.tags.includes(tag))) {
        return false;
      }
      if (options.metadata) {
        if (!Object.entries(options.metadata).every(
            ([metaKey, metaValue]) => config.metadata[metaKey] === metaValue,
        )) {
            return false;
        }
      }
      return true;
    });
  }

  async validateAll(): Promise<boolean> {
    let allValid = true;
    for (const [key, config] of this.config.entries()) {
      const schema = this.schemas.get(key);
      if (schema && schema.validation) {
        try {
          schema.validation.parse(config.value);
        } catch (error: unknown) {
          if (error instanceof z.ZodError) {
            this.logger.error(`Validation failed for ${key}:`, error.errors);
          } else {
            this.logger.error(`Validation failed for ${key} with an unknown error:`, error);
          }
          allValid = false;
        }
      } else if (schema && !schema.validation) {
        this.logger.info(`No validation rule defined in schema for ${key}. Skipping validation.`);
      } else {
        this.logger.warn(`No schema defined for ${key}. Skipping validation.`);
        // Depending on strictness, you might set allValid = false here
      }
    }
    return allValid;
  }

  async exportConfigs(
    options: {
      format?: 'json' | 'yaml';
      environment?: string;
      includeMetadata?: boolean;
    } = {},
  ): Promise<string> {
    const filteredConfigs = Array.from(this.config.values()).filter(
      config => !options.environment || config.environment === options.environment,
    );

    const configsToExport = filteredConfigs.reduce(
      (acc, config) => {
        acc[config.key] = options.includeMetadata ? config : config.value;
        return acc;
      },
      {} as Record<string, unknown>,
    );

    if (options.format === 'yaml') {
      return yaml.dump(configsToExport);
    }
    return JSON.stringify(configsToExport, null, 2);
  }

  async importConfigs(
    content: string,
    options: {
      format?: 'json' | 'yaml';
      overwrite?: boolean;
    } = {},
  ): Promise<void> {
    try {
      const configsToImport: Record<string, unknown> =
        options.format === 'yaml'
          ? (yaml.load(content) as Record<string, unknown>)
          : JSON.parse(content);

      for (const [key, value] of Object.entries(configsToImport)) {
        if (!this.schemas.has(key)) {
            this.logger.warn(`Skipping import for key "${key}": No schema defined.`);
            continue;
        }
        if (this.config.has(key) && !options.overwrite) {
          this.logger.warn(`Skipping existing configuration ${key} (overwrite is false).`);
          continue;
        }
        // If value is a full ConfigValue object (e.g. from an export with metadata)
        // extract the actual value, otherwise use the value directly.
        let actualValue = value;
        let importOptions: any = { reason: 'Imported configuration' };

        if (typeof value === 'object' && value !== null && 'value' in value && 'type' in value) {
            const configObject = value as ConfigValue;
            actualValue = configObject.value;
            importOptions = {
                ...importOptions,
                description: configObject.description,
                tags: configObject.tags,
                metadata: configObject.metadata,
            };
        }
        
        await this.set(key, actualValue, importOptions);
      }
      this.logger.info('Configurations imported successfully.');
    } catch (error) {
      this.logger.error('Failed to import configurations:', error);
      throw error;
    }
  }

  async cleanupHistory(
    options: {
      olderThan?: Date;
      environment?: string;
    } = {},
  ): Promise<void> {
    try {
      const whereClause: any = {};
      if (options.olderThan) {
        whereClause.changedAt = { lt: options.olderThan };
      }
      whereClause.environment = options.environment || process.env.NODE_ENV || 'development';
      
      const deleteResult = await this.db.configurationHistory.deleteMany({ where: whereClause });
      this.logger.info(`Cleaned up ${deleteResult.count} history entries.`);

    } catch (error) {
      this.logger.error('Failed to cleanup configuration history:', error);
      throw error;
    }
  }
   async clearRedisCache(): Promise<void> {
    try {
      const stream = this.redis.scanStream({ match: `${this.cachePrefix}*`, count: 100 });
      const keysFound: string[] = [];
      stream.on('data', (keysChunk: string[]) => {
        keysFound.push(...keysChunk);
      });
      await new Promise<void>((resolve, reject) => {
        stream.on('end', () => resolve());
        stream.on('error', (err) => reject(err));
      });

      if (keysFound.length > 0) {
        await this.redis.del(...keysFound);
        this.logger.info(`Cleared ${keysFound.length} keys from Redis cache with prefix "${this.cachePrefix}".`);
      } else {
        this.logger.info('No keys found in Redis cache with the specified prefix to clear.');
      }
    } catch (error) {
      this.logger.error('Failed to clear Redis cache:', error);
      throw error;
    }
  }
}
