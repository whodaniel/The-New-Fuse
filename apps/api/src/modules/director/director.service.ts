import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// @ts-ignore
// @ts-ignore
import { CascadeMode, CascadeService } from '@the-new-fuse/core';
import { Redis } from 'ioredis';
import { TaskService } from '../task/task.service';
import { AgentSwarmService } from './agent-swarm.service';
import { BMADService } from './bmad.service';

@Injectable()
export class DirectorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DirectorService.name);
  private isRunning = false;
  private cycleCount = 0;
  private intervalHandle: NodeJS.Timeout | null = null;
  private redis: Redis | null = null;

  constructor(
    private readonly swarmService: AgentSwarmService,
    private readonly bmadService: BMADService,
    private readonly taskService: TaskService,
    private readonly cascadeService: CascadeService,
    private readonly configService: ConfigService
  ) {}

  async onModuleInit() {
    this.logger.log('🔮 Initializing Director Service...');
    await this.start();
  }

  onModuleDestroy() {
    this.stop();
  }

  async start(): Promise<void> {
    if (this.isRunning) return;

    // Initialize Redis connection if configured
    const redisUrl = this.configService.get<string>('REDIS_URL');
    if (redisUrl) {
      try {
        this.redis = new Redis(redisUrl);
        this.redis.on('error', (err) => this.logger.error('Redis error', err));
        this.logger.log('🔗 Redis connected for secondary task discovery');
      } catch (error) {
        this.logger.error('❌ Failed to connect to Redis', error);
      }
    }

    this.isRunning = true;
    const interval = this.configService.get<number>('DIRECTOR_CYCLE_INTERVAL') || 60000;
    this.logger.log(`🚀 Director started with ${interval}ms cycle`);

    // Execute first cycle
    await this.executeCycle();

    // Schedule cycles
    this.intervalHandle = setInterval(async () => {
      await this.executeCycle();
    }, interval);
  }

  stop() {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
    if (this.redis) {
      this.redis.quit();
      this.redis = null;
    }
    this.isRunning = false;
    this.logger.log('⏹️ Director stopped');
  }

  private async executeCycle(): Promise<void> {
    this.cycleCount++;
    const startTime = Date.now();

    try {
      this.logger.log(`🔄 Cycle ${this.cycleCount} starting...`);

      // Phase 1: System Health Check
      const swarmStats = this.swarmService.getStatistics();
      this.logger.log(`📊 Health: ${swarmStats.onlineAgents} agents online`);

      // Phase 2: Task Discovery (Primary: Drizzle, Secondary: Redis)
      const tasks = await this.discoverTasks();

      // Phase 3: Task Execution (via Cascade)
      let executed = 0;
      if (tasks.length > 0) {
        executed = await this.executeTasks(tasks);
      }

      // Phase 4: Self-Reflection & Handoff
      if (this.cycleCount % 5 === 0) await this.performReflection();
      if (this.cycleCount % 10 === 0) await this.updateHandoff();

      const duration = Date.now() - startTime;
      this.logger.log(
        `✅ Cycle ${this.cycleCount} completed in ${duration}ms (${executed} tasks handled)`
      );
    } catch (error) {
      this.logger.error(`❌ Cycle ${this.cycleCount} failed:`, error);
    }
  }

  private async discoverTasks(): Promise<any[]> {
    const combinedTasks: any[] = [];

    // 1. Discover tasks from Drizzle (Modern workflow)
    try {
      const activeTasks = await this.taskService.findActiveTasks();
      activeTasks.forEach((t) =>
        combinedTasks.push({
          id: t.id,
          name: t.title || 'Drizzle Task',
          source: 'database',
          data: t,
        })
      );
    } catch (err) {
      this.logger.error('Failed to discover tasks from Drizzle', err);
    }

    // 2. Discover tasks from Redis (Legacy/Queue workflow)
    if (this.redis) {
      try {
        const redisTask = await this.redis.rpoplpush('task:queue', 'task:processing');
        if (redisTask) {
          const data = JSON.parse(redisTask);
          combinedTasks.push({
            id: data.id,
            name: data.type || 'Redis Task',
            source: 'redis',
            data,
          });
        }
      } catch (err) {
        this.logger.error('Failed to discover tasks from Redis', err);
      }
    }

    return combinedTasks;
  }

  private async executeTasks(tasks: any[]): Promise<number> {
    const controller = this.cascadeService.createController(
      `director-cycle-${this.cycleCount}`,
      CascadeMode.PARALLEL
    );

    for (const task of tasks) {
      this.cascadeService.addStep(controller.id, {
        name: task.name,
        handler: async (input: any, context: any) => {
          this.logger.log(`🛠️ Executing ${task.source} task: ${task.id}`);
          // In actual implementation, this would route to AgentService or a specific Worker
          return { success: true, taskId: task.id };
        },
      });
    }

    const results = await this.cascadeService.executeController(controller.id, {});
    return Array.isArray(results) ? results.length : 1;
  }

  private async performReflection() {
    this.logger.log('🪞 Director performing self-reflection on system performance...');
    const stats = this.bmadService.getStatistics();
    this.logger.log(`   System Stats: ${stats.skills} skills, ${stats.tools} tools initialized`);
  }

  private async updateHandoff() {
    this.logger.log('📝 Director updating session handoff data...');
    // Log state for next agent/session
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      cycleCount: this.cycleCount,
      uptime: process.uptime(),
    };
  }

  /**
   * Get swarm activity logs from Redis
   */
  async getSwarmLogs(limit: number = 50): Promise<any[]> {
    if (!this.redis) return [];

    try {
      const logs = await this.redis.lrange('tnf:master:logs', 0, limit - 1);
      return logs.map((log) => JSON.parse(log));
    } catch (error) {
      this.logger.error('Failed to fetch swarm logs from Redis', error);
      return [];
    }
  }
}
