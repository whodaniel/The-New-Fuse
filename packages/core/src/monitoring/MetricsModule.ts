import { Module, DynamicModule, Provider } from '@nestjs/common';
import { Redis } from 'ioredis';
import { MetricsService } from './MetricsService.js';
import { RedisMetricsStorage } from './RedisMetricsStorage.js';
import { MetricsCollectorConfig } from './interfaces.js';

@Module({})
export class MetricsModule {
  static forRoot(config: MetricsCollectorConfig): DynamicModule {
    const redisProvider: Provider = {
      provide: 'REDIS_CLIENT',
      useFactory: () => {
        return new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          password: process.env.REDIS_PASSWORD,
          db: parseInt(process.env.REDIS_METRICS_DB || '1')
        });
      }
    };

    const storageProvider: Provider = {
      provide: 'METRICS_STORAGE',
      useFactory: (redis: Redis) => {
        return new RedisMetricsStorage(redis, config.prefix);
      },
      inject: ['REDIS_CLIENT']
    };

    const metricsServiceProvider: Provider = {
      provide: MetricsService,
      useFactory: (storage: RedisMetricsStorage) => {
        return new MetricsService(storage);
      },
      inject: ['METRICS_STORAGE']
    };

    return {
      module: MetricsModule,
      providers: [
        redisProvider,
        storageProvider,
        metricsServiceProvider
      ],
      exports: [MetricsService]
    };
  }

  static forFeature(): DynamicModule {
    return {
      module: MetricsModule,
      imports: [],
      exports: [MetricsService]
    };
  }
}