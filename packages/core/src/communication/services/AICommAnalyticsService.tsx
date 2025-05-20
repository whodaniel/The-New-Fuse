import { Injectable } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service.js';
import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

interface CommunicationMetrics {
  messageVolume: number;
  avgResponseTime: number;
  successRate: number;
  errorRate: number;
  messageTypes: Record<string, number>;
  channelUtilization: Record<string, number>;
  agentInteractions: Record<string, number>;
  patternFrequency: Record<string, number>;
}

@Injectable()
export class AICommAnalyticsService {
  private readonly logger = new Logger(AICommAnalyticsService.name);
  private readonly METRICS_KEY = 'ai:communication:metrics';
  private readonly PATTERN_KEY = 'ai:communication:patterns';
  private readonly HISTORY_KEY = 'ai:communication:history';
  private readonly MAX_HISTORY_DAYS = 90;

  constructor(
    private readonly redisService: RedisService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  async recordCommunication(data: {
    id: string;
    type: string;
    action: string;
    channel: string;
    responseTime: number;
    status: 'sent' | 'handled' | 'error';
    error?: string;
    metadata?: Record<string, any>;
  }) {
    try {
      const entry = {
        ...data,
        timestamp: new Date().toISOString()
      };

      // Store in Redis
      await this.redisService.zadd(
        this.HISTORY_KEY,
        Date.now(),
        JSON.stringify(entry)
      );

      // Update metrics
      await this.updateMetrics(entry);

      // Emit monitoring event
      this.eventEmitter.emit('communication.recorded', entry);

      // Analyze patterns
      await this.analyzeCommunicationPatterns(entry);
    } catch (error) {
      this.logger.error('Failed to record communication:', error);
      throw error;
    }
  }

  private async updateMetrics(entry: any) {
    const baseKey = `${this.METRICS_KEY}:${entry.channel}`;

    // Update message counts
    await this.redisService.hincrby(baseKey, 'total_messages', 1);
    await this.redisService.hincrby(baseKey, `status:${entry.status}`, 1);
    await this.redisService.hincrby(baseKey, `type:${entry.type}`, 1);

    // Store response time
    await this.redisService.rpush(`${baseKey}:response_times`, entry.responseTime);

    // Track patterns
    const pattern = `${entry.type}:${entry.action}`;
    await this.redisService.hincrby(this.PATTERN_KEY, pattern, 1);

    // Calculate and store success rate
    if (entry.status === 'handled' || entry.status === 'error') {
      const total = await this.redisService.hget(baseKey, 'total_messages');
      const errors = await this.redisService.hget(baseKey, 'status:error');
      
      const successRate = (parseInt(total) - parseInt(errors || '0')) / parseInt(total);
      await this.redisService.hset(baseKey, 'success_rate', successRate);
    }
  }

  private async analyzeCommunicationPatterns(entry: any) {
    // Check response times
    const avgResponseTime = await this.calculateAverageResponseTime(entry.channel);
    if (entry.responseTime > avgResponseTime * 2) {
      this.eventEmitter.emit('communication.slow_response', {
        channel: entry.channel,
        responseTime: entry.responseTime,
        average: avgResponseTime
      });
    }

    // Check error rates
    const errorRate = await this.calculateErrorRate(entry.channel);
    if (errorRate > 0.1) { // 10% error rate threshold
      this.eventEmitter.emit('communication.high_error_rate', {
        channel: entry.channel,
        errorRate
      });
    }

    // Analyze communication patterns
    const patterns = await this.getPatternFrequency();
    const unusualPatterns = this.identifyUnusualPatterns(patterns);
    if (unusualPatterns.length > 0) {
      this.eventEmitter.emit('communication.unusual_patterns', {
        channel: entry.channel,
        patterns: unusualPatterns
      });
    }
  }

  private async calculateAverageResponseTime(channel: string): Promise<number> {
    const times = await this.redisService.lrange(
      `${this.METRICS_KEY}:${channel}:response_times`,
      -100,
      -1
    );
    
    if (!times.length) return 0;
    const sum = times.reduce((acc, time) => acc + parseInt(time), 0);
    return sum / times.length;
  }

  private async calculateErrorRate(channel: string): Promise<number> {
    const key = `${this.METRICS_KEY}:${channel}`;
    const total = await this.redisService.hget(key, 'total_messages');
    const errors = await this.redisService.hget(key, 'status:error');
    
    if (!total) return 0;
    return parseInt(errors || '0') / parseInt(total);
  }

  private async getPatternFrequency(): Promise<Record<string, number>> {
    const patterns = await this.redisService.hgetall(this.PATTERN_KEY);
    return Object.entries(patterns).reduce((acc, [pattern, count]) => ({
      ...acc,
      [pattern]: parseInt(count)
    }), {});
  }

  private identifyUnusualPatterns(patterns: Record<string, number>): string[] {
    const values = Object.values(patterns);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / values.length
    );

    // Identify patterns that deviate more than 2 standard deviations
    return Object.entries(patterns)
      .filter(([, count]) => Math.abs(count - avg) > stdDev * 2)
      .map(([pattern]) => pattern);
  }

  async getMetrics(channel?: string): Promise<CommunicationMetrics> {
    const key = channel ? 
      `${this.METRICS_KEY}:${channel}` :
      this.METRICS_KEY;

    const [
      messageVolume,
      avgResponseTime,
      successRate,
      messageTypes,
      patterns
    ] = await Promise.all([
      this.getTotalMessages(key),
      this.calculateAverageResponseTime(channel || 'all'),
      this.getSuccessRate(key),
      this.getMessageTypeDistribution(key),
      this.getPatternFrequency()
    ]);

    return {
      messageVolume,
      avgResponseTime,
      successRate,
      errorRate: 1 - successRate,
      messageTypes,
      channelUtilization: await this.getChannelUtilization(),
      agentInteractions: await this.getAgentInteractions(),
      patternFrequency: patterns
    };
  }

  private async getTotalMessages(key: string): Promise<number> {
    const total = await this.redisService.hget(key, 'total_messages');
    return parseInt(total || '0');
  }

  private async getSuccessRate(key: string): Promise<number> {
    const rate = await this.redisService.hget(key, 'success_rate');
    return parseFloat(rate || '1');
  }

  private async getMessageTypeDistribution(key: string): Promise<Record<string, number>> {
    const types = await this.redisService.hgetall(key);
    return Object.entries(types)
      .filter(([k]) => k.startsWith('type:'))
      .reduce((acc, [k, v]) => ({
        ...acc,
        [k.replace('type:', '')]: parseInt(v)
      }), {});
  }

  private async getChannelUtilization(): Promise<Record<string, number>> {
    const channels = await this.redisService.keys(`${this.METRICS_KEY}:*`);
    const utilization: Record<string, number> = {};

    for (const channel of channels) {
      const total = await this.getTotalMessages(channel);
      utilization[channel.replace(`${this.METRICS_KEY}:`, '')] = total;
    }

    return utilization;
  }

  private async getAgentInteractions(): Promise<Record<string, number>> {
    const patterns = await this.getPatternFrequency();
    const interactions: Record<string, number> = {};

    for (const [pattern, count] of Object.entries(patterns)) {
      const [source, target] = pattern.split(':');
      interactions[`${source}->${target}`] = count;
    }

    return interactions;
  }

  async cleanup() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - this.MAX_HISTORY_DAYS);
    
    await this.redisService.zremrangebyscore(
      this.HISTORY_KEY,
      0,
      cutoff.getTime()
    );

    // Reset pattern counts after cleanup
    await this.redisService.del(this.PATTERN_KEY);
  }
}