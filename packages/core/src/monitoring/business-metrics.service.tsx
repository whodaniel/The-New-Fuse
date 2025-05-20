import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Logger } from '@the-new-fuse/utils';
import { PerformanceMonitoringService } from './performance-monitoring.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

export interface BusinessMetric {
  name: string;
  value: number;
  unit?: string;
  dimensions?: Record<string, string>;
  timestamp?: Date;
}

export interface BusinessMetricDefinition {
  name: string;
  description: string;
  unit: string;
  thresholds?: {
    warning?: number;
    critical?: number;
  };
}

@Injectable()
export class BusinessMetricsService implements OnModuleInit {
  private readonly logger = new Logger(BusinessMetricsService.name);
  private readonly metricDefinitions: Map<string, BusinessMetricDefinition> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly performanceMonitor: PerformanceMonitoringService,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  onModuleInit() {
    // Load metric definitions from configuration
    const definitions = this.configService.get<BusinessMetricDefinition[]>('metrics.business', []);
    
    for (const definition of definitions) {
      this.metricDefinitions.set(definition.name, definition);
    }
    
    this.logger.info(`Business metrics service initialized with ${this.metricDefinitions.size} metric definitions`);
  }

  /**
   * Record a business metric
   */
  async recordMetric(metric: BusinessMetric): Promise<void> {
    const definition = this.metricDefinitions.get(metric.name);
    
    // Use definition unit if not provided in the metric
    const unit = metric.unit || definition?.unit || '';
    
    // Record in performance monitoring system
    await this.performanceMonitor.recordMetric({
      name: `business.${metric.name}`,
      value: metric.value,
      unit,
      tags: metric.dimensions,
      timestamp: metric.timestamp
    });
    
    // Check thresholds if defined
    if (definition?.thresholds) {
      this.checkThresholds(metric, definition);
    }
    
    // Emit event for the metric
    this.eventEmitter.emit('business.metric', {
      ...metric,
      unit
    });
  }

  /**
   * Record a user activity metric
   */
  async recordUserActivity(
    userId: string,
    activity: string,
    properties: Record<string, any> = {}
  ): Promise<void> {
    await this.recordMetric({
      name: 'user_activity',
      value: 1,
      dimensions: {
        userId,
        activity,
        ...this.flattenProperties(properties)
      }
    });
  }

  /**
   * Record a conversion metric
   */
  async recordConversion(
    conversionType: string,
    value: number = 1,
    properties: Record<string, any> = {}
  ): Promise<void> {
    await this.recordMetric({
      name: 'conversion',
      value,
      dimensions: {
        type: conversionType,
        ...this.flattenProperties(properties)
      }
    });
  }

  /**
   * Record a feature usage metric
   */
  async recordFeatureUsage(
    featureId: string,
    action: string,
    userId?: string,
    properties: Record<string, any> = {}
  ): Promise<void> {
    await this.recordMetric({
      name: 'feature_usage',
      value: 1,
      dimensions: {
        featureId,
        action,
        userId: userId || 'anonymous',
        ...this.flattenProperties(properties)
      }
    });
  }

  /**
   * Get aggregated business metrics for a specific time range
   */
  async getAggregatedMetrics(
    metricName: string,
    startTime: Date,
    endTime: Date = new Date(),
    dimensions?: Record<string, string>,
    aggregation: 'sum' | 'avg' | 'min' | 'max' | 'count' = 'avg'
  ): Promise<number> {
    const whereClause: any = {
      name: `business.${metricName}`,
      timestamp: {
        gte: startTime,
        lte: endTime
      }
    };
    
    // Add dimension filtering if provided
    if (dimensions && Object.keys(dimensions).length > 0) {
      whereClause.tags = {};
      for (const [key, value] of Object.entries(dimensions)) {
        whereClause.tags[key] = value;
      }
    }
    
    const metrics = await this.prisma.performanceMetric.findMany({
      where: whereClause,
      select: {
        value: true
      }
    });
    
    if (metrics.length === 0) {
      return 0;
    }
    
    const values = metrics.map(m => m.value);
    
    switch (aggregation) {
      case 'sum':
        return values.reduce((sum, value) => sum + value, 0);
      case 'min':
        return Math.min(...values);
      case 'max':
        return Math.max(...values);
      case 'count':
        return values.length;
      case 'avg':
      default:
        return values.reduce((sum, value) => sum + value, 0) / values.length;
    }
  }

  /**
   * Register a new business metric definition
   */
  registerMetricDefinition(definition: BusinessMetricDefinition): void {
    this.metricDefinitions.set(definition.name, definition);
    this.logger.info(`Registered business metric definition: ${definition.name}`);
  }

  /**
   * Private methods
   */

  private checkThresholds(metric: BusinessMetric, definition: BusinessMetricDefinition): void {
    const { thresholds } = definition;
    
    if (!thresholds) return;
    
    if (thresholds.critical !== undefined && metric.value >= thresholds.critical) {
      this.triggerAlert('critical', metric, definition);
    } else if (thresholds.warning !== undefined && metric.value >= thresholds.warning) {
      this.triggerAlert('warning', metric, definition);
    }
  }

  private triggerAlert(
    level: 'warning' | 'critical',
    metric: BusinessMetric,
    definition: BusinessMetricDefinition
  ): void {
    const threshold = level === 'critical' 
      ? definition.thresholds?.critical 
      : definition.thresholds?.warning;
    
    const alert = {
      level,
      metric: metric.name,
      value: metric.value,
      threshold,
      unit: definition.unit,
      dimensions: metric.dimensions,
      timestamp: new Date().toISOString(),
      message: `Business metric ${level}: ${metric.name} is ${metric.value}${definition.unit} (threshold: ${threshold}${definition.unit})`
    };
    
    this.logger.warn(`Business metric alert: ${alert.message}`, alert);
    this.eventEmitter.emit('business.alert', alert);
  }

  private flattenProperties(properties: Record<string, any>, prefix: string = ''): Record<string, string> {
    const result: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(properties)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && value !== null) {
        Object.assign(result, this.flattenProperties(value, fullKey));
      } else {
        result[fullKey] = String(value);
      }
    }
    
    return result;
  }
}
