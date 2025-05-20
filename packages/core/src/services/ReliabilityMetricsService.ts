import { Injectable } from '@nestjs/common';
import { Logger } from '../utils/logger.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { EventEmitter2 } from '@nestjs/event-emitter';

interface PerformanceMetrics {
  latency: number[];
  errorRate: number;
  successCount: number;
  failureCount: number;
  lastUsed: number;
  availability: number;
  loadFactor: number;
}

@Injectable()
export class ReliabilityMetricsService {
  private metrics = new Map<string, Map<string, PerformanceMetrics>>();
  private logger = new Logger(ReliabilityMetricsService.name);
  private readonly windowSize = 100; // Rolling window size for metrics
  private readonly availabilityThreshold = 0.95;
  private readonly loadBalancingThreshold = 0.8;

  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2
  ) {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.eventEmitter.on('agent.capability.executed', (data: any) => {
      this.recordMetric(data.agentId, data.capabilityId, {
        latency: data.latency,
        success: data.success,
        error: data.error
      });
    });
  }

  async recordMetric(
    agentId: string,
    capabilityId: string,
    data: {
      latency: number;
      success: boolean;
      error?: string;
    }
  ): Promise<void> {
    let agentMetrics = this.metrics.get(agentId);
    if (!agentMetrics) {
      agentMetrics = new Map();
      this.metrics.set(agentId, agentMetrics);
    }

    let metrics = agentMetrics.get(capabilityId);
    if (!metrics) {
      metrics = this.initializeMetrics();
      agentMetrics.set(capabilityId, metrics);
    }

    // Update metrics
    metrics.latency.push(data.latency);
    if (metrics.latency.length > this.windowSize) {
      metrics.latency.shift();
    }

    if (data.success) {
      metrics.successCount++;
    } else {
      metrics.failureCount++;
      this.logger.warn(`Capability execution failed for agent ${agentId}:`, data.error);
    }

    metrics.errorRate = metrics.failureCount / (metrics.successCount + metrics.failureCount);
    metrics.lastUsed = Date.now();
    metrics.availability = this.calculateAvailability(metrics);
    metrics.loadFactor = this.calculateLoadFactor(metrics);

    // Emit events for significant changes
    if (metrics.errorRate > 0.1) {
      this.eventEmitter.emit('metrics.errorRate.high', {
        agentId,
        capabilityId,
        errorRate: metrics.errorRate
      });
    }

    if (metrics.loadFactor > this.loadBalancingThreshold) {
      this.eventEmitter.emit('metrics.load.high', {
        agentId,
        capabilityId,
        loadFactor: metrics.loadFactor
      });
    }

    // Persist metrics
    await this.persistMetrics(agentId, capabilityId, metrics);
  }

  getAgentReliability(agentId: string, capabilityId: string): number {
    const metrics = this.metrics.get(agentId)?.get(capabilityId);
    if (!metrics) return 0;

    return (1 - metrics.errorRate) * metrics.availability;
  }

  getLoadBalancingScore(agentId: string, capabilityId: string): number {
    const metrics = this.metrics.get(agentId)?.get(capabilityId);
    if (!metrics) return 0;

    return 1 - metrics.loadFactor;
  }

  private initializeMetrics(): PerformanceMetrics {
    return {
      latency: [],
      errorRate: 0,
      successCount: 0,
      failureCount: 0,
      lastUsed: Date.now(),
      availability: 1,
      loadFactor: 0
    };
  }

  private calculateAvailability(metrics: PerformanceMetrics): number {
    const timeSinceLastUse = Date.now() - metrics.lastUsed;
    const availabilityFactor = Math.exp(-timeSinceLastUse / (24 * 60 * 60 * 1000));
    return Math.max(0, Math.min(1, availabilityFactor));
  }

  private calculateLoadFactor(metrics: PerformanceMetrics): number {
    const recentLatencies = metrics.latency.slice(-10);
    if (recentLatencies.length === 0) return 0;

    const avgLatency = recentLatencies.reduce((a, b) => a + b, 0) / recentLatencies.length;
    const baselineLatency = metrics.latency[0] || avgLatency;
    
    return Math.min(1, avgLatency / baselineLatency);
  }

  private async persistMetrics(
    agentId: string,
    capabilityId: string,
    metrics: PerformanceMetrics
  ): Promise<void> {
    try {
      await this.prisma.agentMetrics.upsert({
        where: {
          agentId_capabilityId: {
            agentId,
            capabilityId
          }
        },
        update: {
          errorRate: metrics.errorRate,
          averageLatency: metrics.latency.reduce((a, b) => a + b, 0) / metrics.latency.length,
          availability: metrics.availability,
          loadFactor: metrics.loadFactor,
          lastUpdated: new Date()
        },
        create: {
          agentId,
          capabilityId,
          errorRate: metrics.errorRate,
          averageLatency: metrics.latency[0] || 0,
          availability: metrics.availability,
          loadFactor: metrics.loadFactor,
          lastUpdated: new Date()
        }
      });
    } catch (error) {
      this.logger.error('Failed to persist metrics:', error);
    }
  }
}