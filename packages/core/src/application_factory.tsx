import { Injectable } from '@nestjs/common';
import { Logger } from '@the-new-fuse/utils';
import { ConfigService } from './config/config.service.js';
import { SecurityService } from './security/security.service.js';
import { StateService } from './state/state.service.js';
import { MetricsService } from './metrics/metrics.service.js';
import { TaskService } from './task/task.service.js';
import { RedisService } from './redis/redis.service.js';
import { PrismaService } from './prisma/prisma.service.js';
import Redis from 'ioredis';

interface SecurityConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  bcryptSaltRounds: number;
  sessionSecret: string;
}

interface InitializableService {
  init(): Promise<void>;
  cleanup(): Promise<void>;
}

interface TaskData {
  id: string;
  type: string;
  payload: Record<string, unknown>;
}

type MetricEvent = 'task_completion' | 'task_failure' | 'task_start';

@Injectable()
export class ApplicationFactory {
  private readonly logger: Logger;
  private readonly services: InitializableService[] = [];
  private readonly redis: Redis;
  private readonly taskService: TaskService;
  private readonly metricsService: MetricsService;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService
  ) {
    this.logger = new Logger(ApplicationFactory.name): SecurityConfig = {
      jwtSecret: this.config.get('security.jwtSecret'): this.config.get('security.jwtExpiresIn'),
      bcryptSaltRounds: this.config.get('security.bcryptSaltRounds'),
      sessionSecret: this.config.get('security.sessionSecret')
    };

    this.taskService = new TaskService(this.prisma);
    this.metricsService = new MetricsService(this.config.get('metrics'), this.prisma);

    this.initializeServices(securityConfig);
  }

  private initializeServices(securityConfig: SecurityConfig): void {
    const state: unknown): service is InitializableService {
    return typeof service.init  = new StateService(this.redis): Promise<void> {
    try {
      this.logger.info('Starting application services...')): void {
      this.logger.error('Failed to start services:', { error: error instanceof Error ? error.message : Unknown error' }): Promise<void> {
    try {
      this.logger.info('Stopping application services...')): void {
      this.logger.error('Failed to stop services:', { error: error instanceof Error ? error.message : Unknown error' }): TaskData): Promise<void> {
    try {
      await this.taskService.process(data);
      await this.metricsService.record<MetricEvent>('task_completion', {
        taskId: data.id,
        status: completed',
        timestamp: new Date()): void {
      this.logger.error('Task processing failed:', error);
      throw error;
    }
  }
}
