import { Injectable } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service.js';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Logger } from '@nestjs/common';

interface DirectorMetrics {
  taskDecompositionEfficiency: number;
  delegationPatterns: Record<string, number>;
  workerUtilization: Record<string, number>;
  taskCompletionRates: Record<string, number>;
  coordinationOverhead: number;
  messageRoutingEfficiency: number;
  brokerLoadDistribution: Record<string, number>;
}

@Injectable()
export class DirectorAnalyticsService {
  private readonly logger = new Logger(DirectorAnalyticsService.name);
  private readonly DIRECTOR_METRICS_KEY = 'ai:director:metrics';
  private readonly BROKER_METRICS_KEY = 'ai:broker:metrics';
  private readonly TASK_HISTORY_KEY = 'ai:director:task_history';
  private readonly MAX_HISTORY_DAYS = 90;

  constructor(
    private readonly redisService: RedisService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  async recordDirectorAction(action: {
    type: 'decomposition' | 'delegation' | 'supervision' | 'coordination';
    taskId: string;
    directorId: string;
    workers: string[];
    startTime: number;
    endTime?: number;
    status: 'started' | 'completed' | 'failed';
    metadata?: Record<string, any>;
  }) {
    try {
      const entry = {
        ...action,
        timestamp: new Date().toISOString(),
        endTime: action.endTime || Date.now(),
        duration: (action.endTime || Date.now()) - action.startTime
      };

      // Store in Redis
      await this.redisService.zadd(
        this.TASK_HISTORY_KEY,
        Date.now(),
        JSON.stringify(entry)
      );

      // Update metrics
      await this.updateDirectorMetrics(entry);

      // Emit monitoring event
      this.eventEmitter.emit('director.action.recorded', entry);

      // Check for optimization opportunities
      await this.analyzeOptimizationOpportunities(entry);
    } catch (error) {
      this.logger.error('Failed to record director action:', error);
      throw error;
    }
  }

  async recordBrokerAction(action: {
    type: 'route' | 'translate' | 'queue' | 'match';
    brokerId: string;
    sources: string[];
    targets: string[];
    startTime: number;
    endTime?: number;
    status: 'success' | 'failed';
    metadata?: Record<string, any>;
  }) {
    try {
      const entry = {
        ...action,
        timestamp: new Date().toISOString(),
        endTime: action.endTime || Date.now(),
        duration: (action.endTime || Date.now()) - action.startTime
      };

      // Update broker metrics
      await this.updateBrokerMetrics(entry);

      // Emit monitoring event
      this.eventEmitter.emit('broker.action.recorded', entry);

      // Analyze routing patterns
      await this.analyzeRoutingPatterns(entry);
    } catch (error) {
      this.logger.error('Failed to record broker action:', error);
      throw error;
    }
  }

  private async updateDirectorMetrics(entry: any) {
    const key = `${this.DIRECTOR_METRICS_KEY}:${entry.directorId}`;
    
    // Update task counts
    await this.redisService.hincrby(key, `tasks:${entry.type}`, 1);
    await this.redisService.hincrby(key, `status:${entry.status}`, 1);
    
    // Track worker assignments
    for (const worker of entry.workers) {
      await this.redisService.hincrby(key, `worker:${worker}`, 1);
    }

    // Store task duration
    await this.redisService.rpush(`${key}:durations`, entry.duration);

    // Calculate and store efficiency metrics
    if (entry.status === 'completed') {
      const avgDuration = await this.calculateAverageDuration(key);
      const efficiency = entry.duration < avgDuration ? 1 : avgDuration / entry.duration;
      await this.redisService.hset(key, 'current_efficiency', efficiency);
    }
  }

  private async updateBrokerMetrics(entry: any) {
    const key = `${this.BROKER_METRICS_KEY}:${entry.brokerId}`;
    
    // Update action counts
    await this.redisService.hincrby(key, `actions:${entry.type}`, 1);
    await this.redisService.hincrby(key, `status:${entry.status}`, 1);
    
    // Track routing patterns
    for (const source of entry.sources) {
      for (const target of entry.targets) {
        const pattern = `${source}->${target}`;
        await this.redisService.hincrby(key, `route:${pattern}`, 1);
      }
    }

    // Store action duration
    await this.redisService.rpush(`${key}:durations`, entry.duration);
  }

  private async calculateAverageDuration(key: string): Promise<number> {
    const durations = await this.redisService.lrange(`${key}:durations`, -100, -1);
    if (!durations.length) return 0;
    
    const sum = durations.reduce((acc, dur) => acc + parseInt(dur), 0);
    return sum / durations.length;
  }

  private async analyzeOptimizationOpportunities(entry: any) {
    // Analyze worker load distribution
    const workerLoads = await this.getWorkerLoads(entry.directorId);
    const loadVariance = this.calculateLoadVariance(workerLoads);
    
    if (loadVariance > 0.3) { // 30% variance threshold
      this.eventEmitter.emit('director.optimization.needed', {
        type: 'load_imbalance',
        directorId: entry.directorId,
        workerLoads,
        variance: loadVariance
      });
    }

    // Check task completion efficiency
    const efficiency = await this.redisService.hget(
      `${this.DIRECTOR_METRICS_KEY}:${entry.directorId}`,
      'current_efficiency'
    );

    if (efficiency && parseFloat(efficiency) < 0.7) { // 70% efficiency threshold
      this.eventEmitter.emit('director.optimization.needed', {
        type: 'low_efficiency',
        directorId: entry.directorId,
        efficiency: parseFloat(efficiency),
        taskId: entry.taskId
      });
    }
  }

  private async analyzeRoutingPatterns(entry: any) {
    const key = `${this.BROKER_METRICS_KEY}:${entry.brokerId}`;
    
    // Analyze routing success rates
    const successRate = await this.calculateSuccessRate(key);
    if (successRate < 0.95) { // 95% success rate threshold
      this.eventEmitter.emit('broker.optimization.needed', {
        type: 'low_success_rate',
        brokerId: entry.brokerId,
        successRate,
        patterns: await this.getRoutingPatterns(key)
      });
    }

    // Check for routing bottlenecks
    const patterns = await this.getRoutingPatterns(key);
    const bottlenecks = this.identifyBottlenecks(patterns);
    if (bottlenecks.length > 0) {
      this.eventEmitter.emit('broker.optimization.needed', {
        type: 'routing_bottleneck',
        brokerId: entry.brokerId,
        bottlenecks
      });
    }
  }

  private async getWorkerLoads(directorId: string): Promise<Record<string, number>> {
    const key = `${this.DIRECTOR_METRICS_KEY}:${directorId}`;
    const workers = await this.redisService.hgetall(key);
    
    return Object.entries(workers)
      .filter(([k]) => k.startsWith('worker:'))
      .reduce((acc, [k, v]) => ({
        ...acc,
        [k.replace('worker:', '')]: parseInt(v)
      }), {});
  }

  private calculateLoadVariance(loads: Record<string, number>): number {
    const values = Object.values(loads);
    if (values.length === 0) return 0;
    
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / values.length;
    return Math.sqrt(variance) / avg; // Coefficient of variation
  }

  private async calculateSuccessRate(key: string): Promise<number> {
    const total = await this.redisService.hget(key, 'status:success');
    const failed = await this.redisService.hget(key, 'status:failed');
    
    if (!total) return 1;
    return parseInt(total) / (parseInt(total) + parseInt(failed || '0'));
  }

  private async getRoutingPatterns(key: string): Promise<Record<string, number>> {
    const routes = await this.redisService.hgetall(key);
    return Object.entries(routes)
      .filter(([k]) => k.startsWith('route:'))
      .reduce((acc, [k, v]) => ({
        ...acc,
        [k.replace('route:', '')]: parseInt(v)
      }), {});
  }

  private identifyBottlenecks(patterns: Record<string, number>): string[] {
    const avg = Object.values(patterns).reduce((a, b) => a + b, 0) / Object.values(patterns).length;
    const threshold = avg * 2; // 2x average as bottleneck threshold
    
    return Object.entries(patterns)
      .filter(([, count]) => count > threshold)
      .map(([pattern]) => pattern);
  }

  async getMetrics(directorId: string): Promise<DirectorMetrics> {
    const key = `${this.DIRECTOR_METRICS_KEY}:${directorId}`;
    
    const [
      taskCounts,
      workerLoads,
      efficiency
    ] = await Promise.all([
      this.redisService.hgetall(`${key}:tasks`),
      this.getWorkerLoads(directorId),
      this.redisService.hget(key, 'current_efficiency')
    ]);

    return {
      taskDecompositionEfficiency: parseFloat(efficiency || '0'),
      delegationPatterns: taskCounts,
      workerUtilization: workerLoads,
      taskCompletionRates: await this.getTaskCompletionRates(directorId),
      coordinationOverhead: await this.calculateCoordinationOverhead(directorId),
      messageRoutingEfficiency: await this.calculateRoutingEfficiency(directorId),
      brokerLoadDistribution: await this.getBrokerLoadDistribution(directorId)
    };
  }

  private async getTaskCompletionRates(directorId: string): Promise<Record<string, number>> {
    const key = `${this.DIRECTOR_METRICS_KEY}:${directorId}`;
    const completed = await this.redisService.hget(key, 'status:completed');
    const failed = await this.redisService.hget(key, 'status:failed');
    const total = parseInt(completed || '0') + parseInt(failed || '0');
    
    return {
      completed: parseInt(completed || '0'),
      failed: parseInt(failed || '0'),
      rate: total ? parseInt(completed || '0') / total : 0
    };
  }

  private async calculateCoordinationOverhead(directorId: string): Promise<number> {
    const key = `${this.DIRECTOR_METRICS_KEY}:${directorId}`;
    const durations = await this.redisService.lrange(`${key}:durations`, -100, -1);
    if (!durations.length) return 0;
    
    const totalDuration = durations.reduce((acc, dur) => acc + parseInt(dur), 0);
    const avgDuration = totalDuration / durations.length;
    const overhead = avgDuration / 1000; // Convert to seconds
    
    return overhead;
  }

  private async calculateRoutingEfficiency(directorId: string): Promise<number> {
    const brokerKey = `${this.BROKER_METRICS_KEY}:${directorId}`;
    const successRate = await this.calculateSuccessRate(brokerKey);
    const patterns = await this.getRoutingPatterns(brokerKey);
    const bottlenecks = this.identifyBottlenecks(patterns);
    
    // Efficiency decreases with more bottlenecks
    return successRate * (1 - (bottlenecks.length * 0.1));
  }

  private async getBrokerLoadDistribution(directorId: string): Promise<Record<string, number>> {
    const brokerKey = `${this.BROKER_METRICS_KEY}:${directorId}`;
    const patterns = await this.getRoutingPatterns(brokerKey);
    
    // Calculate load per target
    return Object.entries(patterns).reduce((acc, [pattern, count]) => {
      const target = pattern.split('->')[1];
      acc[target] = (acc[target] || 0) + count;
      return acc;
    }, {} as Record<string, number>);
  }

  async cleanup() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - this.MAX_HISTORY_DAYS);
    
    await this.redisService.zremrangebyscore(
      this.TASK_HISTORY_KEY,
      0,
      cutoff.getTime()
    );
  }
}