import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Logger } from '@the-new-fuse/utils';
import { PerformanceMonitoringService } from './performance-monitoring.service.js';
import { CorrelationIdManager } from '../utils/correlation-id.js';

export interface ServiceCommunicationMetrics {
  sourceService: string;
  targetService: string;
  operation: string;
  latencyMs: number;
  success: boolean;
  timestamp: Date;
  correlationId: string;
}

export interface ServiceDependency {
  sourceService: string;
  targetService: string;
  operations: string[];
  isRequired: boolean;
  averageLatencyMs?: number;
  errorRate?: number;
}

@Injectable()
export class ServiceCommunicationMonitor implements OnModuleInit {
  private readonly logger = new Logger(ServiceCommunicationMonitor.name);
  private readonly serviceName: string;
  private readonly dependencies: ServiceDependency[] = [];
  private readonly latencyThresholdMs: number;
  private readonly errorRateThreshold: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly performanceMonitor: PerformanceMonitoringService,
    private readonly eventEmitter: EventEmitter2
  ) {
    this.serviceName = this.configService.get<string>('service.name', 'unknown');
    this.latencyThresholdMs = this.configService.get<number>('monitoring.communication.latencyThresholdMs', 1000);
    this.errorRateThreshold = this.configService.get<number>('monitoring.communication.errorRateThreshold', 0.05);
  }

  onModuleInit() {
    // Load service dependencies from configuration
    const dependencies = this.configService.get<ServiceDependency[]>('service.dependencies', []);
    this.dependencies.push(...dependencies);
    
    this.logger.info(`Service communication monitor initialized for ${this.serviceName} with ${this.dependencies.length} dependencies`);
  }

  /**
   * Record a communication between services
   */
  async recordCommunication(metrics: Omit<ServiceCommunicationMetrics, 'timestamp' | 'correlationId'>): Promise<void> {
    const timestamp = new Date();
    const correlationId = CorrelationIdManager.getCurrentId();
    
    const fullMetrics: ServiceCommunicationMetrics = {
      ...metrics,
      timestamp,
      correlationId
    };
    
    // Record in performance monitoring
    await this.performanceMonitor.recordInterServiceLatency({
      sourceService: metrics.sourceService,
      targetService: metrics.targetService,
      operation: metrics.operation,
      durationMs: metrics.latencyMs,
      success: metrics.success,
      correlationId
    });
    
    // Check for latency issues
    if (metrics.latencyMs > this.latencyThresholdMs) {
      this.logger.warn(`High latency detected in communication with ${metrics.targetService}`, {
        latencyMs: metrics.latencyMs,
        threshold: this.latencyThresholdMs,
        operation: metrics.operation
      });
      
      this.eventEmitter.emit('communication.latency', {
        ...fullMetrics,
        threshold: this.latencyThresholdMs
      });
    }
    
    // Check for errors
    if (!metrics.success) {
      const dependency = this.dependencies.find(d => 
        d.sourceService === metrics.sourceService && 
        d.targetService === metrics.targetService
      );
      
      if (dependency?.isRequired) {
        this.logger.error(`Failed communication with required service ${metrics.targetService}`, {
          operation: metrics.operation,
          correlationId
        });
        
        this.eventEmitter.emit('communication.error', {
          ...fullMetrics,
          isRequiredDependency: true
        });
      } else {
        this.logger.warn(`Failed communication with service ${metrics.targetService}`, {
          operation: metrics.operation,
          correlationId
        });
        
        this.eventEmitter.emit('communication.error', {
          ...fullMetrics,
          isRequiredDependency: false
        });
      }
    }
  }

  /**
   * Get the health status of service dependencies
   */
  async getDependencyHealth(): Promise<Record<string, { healthy: boolean; metrics: any }>> {
    const result: Record<string, { healthy: boolean; metrics: any }> = {};
    
    for (const dependency of this.dependencies) {
      // Get metrics for this dependency over the last hour
      const startTime = new Date(Date.now() - 60 * 60 * 1000);
      
      const latencyMetrics = await this.performanceMonitor.getCustomMetrics(
        ['inter_service_latency'],
        startTime,
        new Date(),
        {
          source: dependency.sourceService,
          target: dependency.targetService
        }
      );
      
      // Get success rate
      const successMetrics = await this.performanceMonitor.getCustomMetrics(
        ['inter_service_latency'],
        startTime,
        new Date(),
        {
          source: dependency.sourceService,
          target: dependency.targetService,
          success: 'true'
        }
      );
      
      const failureMetrics = await this.performanceMonitor.getCustomMetrics(
        ['inter_service_latency'],
        startTime,
        new Date(),
        {
          source: dependency.sourceService,
          target: dependency.targetService,
          success: 'false'
        }
      );
      
      const totalCount = (successMetrics['inter_service_latency'] || 0) + (failureMetrics['inter_service_latency'] || 0);
      const successRate = totalCount > 0 ? (successMetrics['inter_service_latency'] || 0) / totalCount : 1;
      const errorRate = 1 - successRate;
      
      const averageLatencyMs = latencyMetrics['inter_service_latency'] || 0;
      
      // Determine health
      const isHealthy = errorRate < this.errorRateThreshold && 
                        averageLatencyMs < this.latencyThresholdMs;
      
      result[dependency.targetService] = {
        healthy: isHealthy,
        metrics: {
          averageLatencyMs,
          errorRate,
          successRate,
          isRequired: dependency.isRequired
        }
      };
    }
    
    return result;
  }

  /**
   * Check if a specific service dependency is healthy
   */
  async isDependencyHealthy(targetService: string): Promise<boolean> {
    const health = await this.getDependencyHealth();
    return health[targetService]?.healthy ?? false;
  }
}
