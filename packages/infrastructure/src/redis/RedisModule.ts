import { Module, DynamicModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UnifiedRedisService } from './UnifiedRedisService';
import { RedisConfig } from './RedisConfig';
import { RedisConfiguration } from './types';

export interface RedisModuleOptions {
  isGlobal?: boolean;
  config?: Partial<RedisConfiguration>;
}

@Module({
  imports: [ConfigModule],
})
export class RedisModule {
  static forRoot(options: RedisModuleOptions = {}): DynamicModule {
    return {
      module: RedisModule,
      global: options.isGlobal ?? true,
      imports: [ConfigModule],
      providers: [
        {
          provide: 'REDIS_CONFIG_OPTIONS',
          useValue: options.config ?? {},
        },
        RedisConfig,
        UnifiedRedisService,
      ],
      exports: [UnifiedRedisService, RedisConfig],
    };
  }

  static forRootAsync(options: {
    isGlobal?: boolean;
    useFactory?: (...args: any[]) => Promise<Partial<RedisConfiguration>> | Partial<RedisConfiguration>;
    inject?: any[];
  }): DynamicModule {
    return {
      module: RedisModule,
      global: options.isGlobal ?? true,
      imports: [ConfigModule],
      providers: [
        {
          provide: 'REDIS_CONFIG_OPTIONS',
          useFactory: options.useFactory || (() => ({})),
          inject: options.inject || [],
        },
        RedisConfig,
        UnifiedRedisService,
      ],
      exports: [UnifiedRedisService, RedisConfig],
    };
  }
}