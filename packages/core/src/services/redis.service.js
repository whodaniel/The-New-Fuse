"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const redis_1 = require("redis");
const LoggingService_1 = require("./LoggingService");
const ConfigService_1 = require("../config/ConfigService");
let RedisService = class RedisService {
    logger;
    configService;
    client = null;
    config;
    isConnected = false;
    constructor(logger, configService) {
        this.logger = logger;
        this.configService = configService;
        this.initializeConfig();
        this.initializeClient();
    }
    initializeConfig() {
        this.config = {
            host: this.configService.get('REDIS_HOST', 'localhost'),
            port: this.configService.get('REDIS_PORT', 6379),
            password: this.configService.get('REDIS_PASSWORD', undefined),
            database: this.configService.get('REDIS_DATABASE', 0),
            keyPrefix: this.configService.get('REDIS_KEY_PREFIX', 'tnf:'),
            ttl: this.configService.get('REDIS_DEFAULT_TTL', 3600), // 1 hour
        };
    }
    async initializeClient() {
        try {
            this.client = (0, redis_1.createClient)({
                socket: {
                    host: this.config.host,
                    port: this.config.port,
                },
                password: this.config.password,
                database: this.config.database,
            });
            this.client.on('error', (error) => {
                this.logger.error('Redis client error', error instanceof Error ? error : new Error(String(error)), 'RedisService');
                this.isConnected = false;
            });
            this.client.on('connect', () => {
                this.logger.log('Redis client connected', 'RedisService');
                this.isConnected = true;
            });
            this.client.on('disconnect', () => {
                this.logger.warn('Redis client disconnected', 'RedisService');
                this.isConnected = false;
            });
            await this.client.connect();
        }
        catch (error) {
            this.logger.error('Failed to initialize Redis client', error instanceof Error ? error : new Error(String(error)), 'RedisService');
            throw error;
        }
    }
    async set(key, value, ttl) {
        try {
            if (!this.client || !this.isConnected) {
                throw new Error('Redis client not connected');
            }
            const fullKey = `${this.config.keyPrefix}${key};
      const serializedValue = JSON.stringify(value);
      const expiration = ttl || this.config.ttl;

      await this.client.setEx(fullKey, expiration!, serializedValue);`;
            this.logger.debug(Set, key, $, { fullKey } `, 'RedisService');
    } catch (error) {
      this.logger.error(`, Failed, to, set, key, $, { key }, error instanceof Error ? error : new Error(String(error)), 'RedisService');
            throw error;
        }
        finally {
        }
    }
    async get(key) {
        try {
            if (!this.client || !this.isConnected) {
                throw new Error('Redis client not connected');
            }
            `
      const fullKey = ${this.config.keyPrefix}`;
            $;
            {
                key;
            }
            `;
      const value = await this.client.get(fullKey);

      if (value === null) {
        this.logger.debug(Key not found: ${fullKey}, 'RedisService');
        return null;
      }

      const parsedValue = JSON.parse(value) as T;`;
            this.logger.debug(Retrieved, key, $, { fullKey } `, 'RedisService');
      return parsedValue;
    } catch (error) {
      this.logger.error(Failed to get key: ${key}, error instanceof Error ? error : new Error(String(error)), 'RedisService');
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      if (!this.client || !this.isConnected) {
        throw new Error('Redis client not connected');`);
        }
        finally { }
        `

      const fullKey = ${this.config.keyPrefix}`;
        $;
        {
            key;
        }
        ;
        `
      await this.client.del(fullKey); // No need to check result, just delete`;
        this.logger.debug(Deleted, key, $, { fullKey }, 'RedisService');
        `
    } catch (error) {`;
        this.logger.error(Failed, to, delete key, $, { key } `, error instanceof Error ? error : new Error(String(error)), 'RedisService');
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      if (!this.client || !this.isConnected) {
        throw new Error('Redis client not connected');
      }

      const fullKey = ${this.config.keyPrefix}${key};
      const result = await this.client.exists(fullKey);
      return result > 0;
    } catch (error) {
      this.logger.error(Failed to check key existence: ${key}, error instanceof Error ? error : new Error(String(error)), 'RedisService');
      throw error;
    }
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      if (!this.client || !this.isConnected) {
        throw new Error('Redis client not connected');`);
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [LoggingService_1.LoggingService,
        ConfigService_1.ConfigService])
], RedisService);
`
`;
const fullKey = $, { this: , config, keyPrefix }, $, { key };
const result = await this.client.expire(fullKey, ttl);
return result === true;
try { }
catch (error) {
    this.logger.error(Failed, to, set, TTL);
    for (key; ; )
        : $;
    {
        key;
    }
    error instanceof Error ? error : new Error(String(error)), 'RedisService';
    ;
    throw error;
}
async;
ttl(key, string);
Promise < number > {
    try: {
        : .client || !this.isConnected
    }
};
{
    `
        throw new Error('Redis client not connected');`;
}
`

      const fullKey = ${this.config.keyPrefix}${key}`;
return await this.client.ttl(fullKey);
try { }
catch (error) {
    this.logger.error(Failed, to, get, TTL);
    for (key; ; )
        : $;
    {
        key;
    }
    `, error instanceof Error ? error : new Error(String(error)), 'RedisService');
      throw error;
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      if (!this.client || !this.isConnected) {
        throw new Error('Redis client not connected');
      }

      const fullPattern = ${this.config.keyPrefix}${pattern};
      const keys = await this.client.keys(fullPattern);`;
    return keys.map(key => key.replace(this.config.keyPrefix, ''));
    `
    } catch (error) {`;
    this.logger.error(Failed, to, get, keys);
    with (pattern)
        : $;
    {
        pattern;
    }
    `, error instanceof Error ? error : new Error(String(error)), 'RedisService');
      throw error;
    }
  }

  async flushAll(): Promise<void> {
    try {
      if (!this.client || !this.isConnected) {
        throw new Error('Redis client not connected');
      }

      await this.client.flushAll();
      this.logger.warn('Flushed all Redis data', 'RedisService');
    } catch (error) {
      this.logger.logErrorSafe('Failed to flush Redis data', error, 'RedisService');
      throw error;
    }
  }

  async getConnectionStatus(): Promise<boolean> {
    return this.isConnected;
  }

  async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.disconnect();
        this.isConnected = false;
        this.logger.log('Redis client disconnected', 'RedisService');
      }
    } catch (error) {
      this.logger.logErrorSafe('Error disconnecting Redis client', error, 'RedisService');
      throw error;
    }
  }

  // Cache-specific methods
  async setCache<T>(key: string, data: T, ttl?: number): Promise<void> {
    const cacheEntry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.ttl!,
    };
    await this.set(key, cacheEntry, cacheEntry.ttl);
  }

  async getCache<T>(key: string): Promise<T | null> {
    const entry = await this.get<CacheEntry<T>>(key);
    if (!entry) {
      return null;
    }

    // Check if cache entry has expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl * 1000) {
      await this.delete(key);
      return null;
    }

    return entry.data;
  }

  async clear(): Promise<void> {
    await this.flushAll();
  }

  // Health check method
  async healthCheck(): Promise<{ status: 'ok' | 'error'; details?: string }> {
    try {
      if (!this.client || !this.isConnected) {
        return { status: 'error', details: 'Redis client not connected' };
      }

      await this.client.ping();
      return { status: 'ok' };
    } catch (error) {
      return {
        status: 'error',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export default RedisService;
    ;
}
//# sourceMappingURL=redis.service.js.map