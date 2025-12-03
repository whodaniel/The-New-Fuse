import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisConfiguration } from './types';

@Injectable()
export class RedisConfig {
  constructor(private readonly configService: ConfigService) {}

  private parseRedisConfig() {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    
    if (redisUrl) {
      try {
        const url = new URL(redisUrl);
        return {
          host: url.hostname,
          port: parseInt(url.port) || 6379,
          password: url.password || undefined,
          db: parseInt(url.pathname.slice(1)) || 0,
        };
      } catch (error) {
        console.error('[RedisConfig] Failed to parse REDIS_URL, falling back to individual env vars:', error);
      }
    }
    
    return {
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD'),
      db: this.configService.get<number>('REDIS_DB', 0),
    };
  }

  getConfiguration(): RedisConfiguration {
    const { host, port, password, db } = this.parseRedisConfig();
    
    return {
      host,
      port,
      password,
      db,
      poolSize: this.configService.get<number>('REDIS_POOL_SIZE', 10),
      retryAttempts: this.configService.get<number>('REDIS_RETRY_ATTEMPTS', 3),
      retryDelay: this.configService.get<number>('REDIS_RETRY_DELAY', 1000),
      connectTimeout: this.configService.get<number>('REDIS_CONNECT_TIMEOUT', 10000),
      lazyConnect: this.configService.get<boolean>('REDIS_LAZY_CONNECT', true),
      maxRetriesPerRequest: this.configService.get<number>('REDIS_MAX_RETRIES_PER_REQUEST', 3),
      cluster: {
        enableReadyCheck: this.configService.get<boolean>('REDIS_CLUSTER_READY_CHECK', false),
        maxRedirections: this.configService.get<number>('REDIS_CLUSTER_MAX_REDIRECTIONS', 16),
        retryDelayOnFailover: this.configService.get<number>('REDIS_CLUSTER_RETRY_DELAY', 100),
      },
    };
  }

  getConnectionOptions() {
    const config = this.getConfiguration();
    return {
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.db,
      connectTimeout: config.connectTimeout,
      lazyConnect: config.lazyConnect,
      maxRetriesPerRequest: config.maxRetriesPerRequest,
      retryDelayOnFailover: config.retryDelay,
      retryAttempts: config.retryAttempts,
      family: 4,
      keepAlive: 30000,
      keyPrefix: this.configService.get<string>('REDIS_KEY_PREFIX', ''),
    };
  }

  isClusterMode(): boolean {
    return this.configService.get<boolean>('REDIS_CLUSTER_MODE', false);
  }

  getClusterNodes(): string[] {
    const nodesStr = this.configService.get<string>('REDIS_CLUSTER_NODES', '');
    return nodesStr ? nodesStr.split(',').map(node => node.trim()) : [];
  }
}