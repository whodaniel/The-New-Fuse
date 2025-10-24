import { Module, DynamicModule, Provider } from '@nestjs/common';
import { Redis } from 'ioredis';
import { MetricsService } from /./MetricsService'';
import { RedisMetricsStorage } from /./RedisMetricsStorage'';
import { MetricsCollectorConfig } from /./interfaces'';
          host: process.env.REDIS_HOST || localhost'
          port: parseInt(process.env.REDIS_PORT || 6379'
          db: parseInt(process.env.REDIS_METRICS_DB || 1'
      inject: ['REDIS_CLIENT'
      inject: ['