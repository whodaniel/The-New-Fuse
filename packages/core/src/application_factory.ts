import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MetricsService } from './metrics/MetricService';
import Redis from 'ioredis';

type MetricEvent = 'task_completion' | 'task_failure' | 'task_start';

export interface SecurityConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  bcryptSaltRounds: number;
  sessionSecret: string;
}

export interface RedisConfig {
  url: string;
}

@Injectable()
export class ApplicationFactory implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ApplicationFactory.name);
  private redis: Redis;
  private metricsService: MetricsService;
  private services: any[] = [];

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    try {
      const securityConfig: SecurityConfig = {
        jwtSecret: this.config.get('security.jwtSecret') || 'default-secret',
        jwtExpiresIn: this.config.get('security.jwtExpiresIn') || '1h',
        bcryptSaltRounds: this.config.get('security.bcryptSaltRounds') || 10,
        sessionSecret: this.config.get('security.sessionSecret') || 'session-secret'
      };

      this.redis = new Redis(this.config.get('redis.url') || 'redis://localhost:6379');
      this.metricsService = new MetricsService(this.config);

      this.logger.log('Initializing application services...');
      
      // Initialize services
      await this.initializeServices();
      
      this.logger.log('All services started successfully');
    } catch (error) {
      this.logger.error('Failed to start services:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      this.logger.log('Stopping application services...');
      
      // Cleanup services
      await this.cleanupServices();
      
      if (this.redis) {
        await this.redis.quit();
      }
      
      this.logger.log('All services stopped successfully');
    } catch (error) {
      this.logger.error('Failed to stop services:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async initializeServices() {
    for (const service of this.services) {
      if (typeof service === 'object' && 
          typeof (service as any).init === 'function') {
        await (service as any).init();
      }
    }
  }

  private async cleanupServices() {
    for (const service of this.services) {
      if (typeof service === 'object' && 
          typeof (service as any).cleanup === 'function') {
        await (service as any).cleanup();
      }
    }
  }

  async recordTaskCompletion(taskId: string, metadata?: any) {
    try {
      await this.metricsService.record<MetricEvent>('task_completion', {
        taskId,
        status: 'completed',
        ...metadata
      });
    } catch (error) {
      this.logger.error('Task processing failed:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      await this.metricsService.record<MetricEvent>('task_failure', {
        taskId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  registerService(service: any) {
    this.services.push(service);
  }

  getRedisClient(): Redis {
    return this.redis;
  }

  getMetricsService(): MetricsService {
    return this.metricsService;
  }
}