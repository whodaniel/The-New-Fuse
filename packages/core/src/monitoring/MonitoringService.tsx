import { Injectable, OnModuleInit } from '@nestjs/common';
import { Logger } from '@the-new-fuse/utils';
import { DatabaseService } from '@the-new-fuse/database';
import { Redis } from 'ioredis';
import { EventEmitter } from 'events';
import * as os from 'os';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DeploymentHealth, DeploymentMetrics, DeploymentStatus, Environment } from '../types/deployment.js';
import { deploymentConfigs } from '../../../config/deployment-config.js';

interface MetricValue {
  value: number;
  timestamp: Date;
  labels: Record<string, string>;
}

interface Metric {
  name: string;
  type: 'counter' | 'gauge' | 'histogram';
  description: string;
  unit?: string;
  values: MetricValue[];
}

interface Alert {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  status: 'active' | 'resolved';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  metadata: Record<string, unknown>;
}

interface MetricRecord {
  model: string;
  messageCount?: number;
  tokenCount?: number;
  errorCount?: number;
  latencyMs: number[];
  timestamp: string;
}

interface ErrorRecord {
  model: string;
  error: string;
  processingId: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class MonitoringService extends EventEmitter implements OnModuleInit {
  private logger: Logger;
  private redis: Redis;
  private db: DatabaseService;
  private metrics: Map<string, Metric>;
  private alerts: Map<string, Alert>;
  private checkIntervals: Map<string, NodeJS.Timeout>;
  private readonly defaultInterval = 60000; // 1 minute
  private activeDeployments = new Map<string, {
    environment: Environment;
    version: string;
    status: DeploymentStatus;
    startTime: Date;
  }>();

  constructor(
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super();
  }

  async onModuleInit(): Promise<void> {
    await this.initializeMetrics();
  }

  private async initializeMetrics(): Promise<void> {
    // Initialize system metrics
    this.registerMetric({
      name: 'system_cpu_usage',
      type: 'gauge',
      description: 'System CPU usage percentage',
      unit: 'percent'
    });

    this.registerMetric({
      name: 'system_memory_usage',
      type: 'gauge',
      description: 'System memory usage in bytes',
      unit: 'bytes'
    });

    this.registerMetric({
      name: 'system_disk_usage',
      type: 'gauge',
      description: 'System disk usage in bytes',
      unit: 'bytes'
    });

    setInterval(async () => {
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;
      this.recordMetric('system_memory_usage', usedMemory);

      // Disk Usage (implement as needed)
      // Requires additional library for disk usage stats

    }, this.defaultInterval);
  }

  registerMetric(metric: Metric): void {
    if (this.metrics.has(metric.name)) {
      throw new Error(`Metric ${metric.name} already exists`);
    }

    this.metrics.set(metric.name, {
      ...metric,
      values: []
    });

    // Persist metric definition
    this.db.metrics.create({
      data: {
        name: metric.name,
        type: metric.type,
        description: metric.description,
        unit: metric.unit
      }
    }).catch(error => {
      this.logger.error(`Failed to persist metric ${metric.name}:`, error);
    });
  }

  async recordMetric(
    name: string,
    value: number,
    labels: Record<string, string> = {}
  ): Promise<void> {
    const metric = this.metrics.get(name);
    if (!metric) {
      throw new Error(`Metric ${name} not found`);
    }

    const metricValue: MetricValue = {
      value,
      timestamp: new Date(),
      labels
    };

    metric.values = (metric as any).values.slice(-1000);
    (metric as any).values.push(metricValue);

    // Persist in Redis
    await this.redis.zadd(
      `metric:${name}`,
      metricValue.timestamp.getTime(),
      JSON.stringify(metricValue)
    );

    // Persist in database
    await this.db.metricValues.create({
      data: {
        metricName: name,
        value,
        timestamp: metricValue.timestamp,
        labels
      }
    });

    // Emit metric event
    this.emit('metricRecorded', {
      name,
      value: metricValue
    });
  }

  async getMetricValues(
    name: string,
    options: {
      startTime?: Date;
      endTime?: Date;
      labels?: Record<string, string>;
    } = {}
  ): Promise<MetricValue[]> {
    const metric = this.metrics.get(name);
    if (!metric) {
      throw new Error(`Metric ${name} not found`);
    }

    const values = await this.redis.zrangebyscore(
      `metric:${name}`,
      options.startTime?.getTime() || '-inf',
      options.endTime?.getTime() || '+inf'
    );

    if (values.length > 0) {
      return values
        .map(v => JSON.parse(v))
        .filter(v => {
          if (!options.labels) return true;
          return Object.entries(options.labels).every(
            ([key, value]) => v.labels[key] === value
          );
        });
    }

    // Fall back to database
    return this.db.metricValues.findMany({
      where: {
        metricName: name,
        timestamp: {
          gte: options.startTime,
          lte: options.endTime
        }
      },
      orderBy: { timestamp: 'asc' }
    });
  }

  registerAlert(
    name: string,
    condition: string,
    threshold: number,
    options: {
      severity?: 'low' | 'medium' | 'high' | 'critical';
      interval?: number;
      metadata?: Record<string, unknown>;
    } = {}
  ): void {
    const alert: Alert = {
      id: crypto.randomUUID(),
      name,
      condition,
      threshold,
      status: 'resolved',
      severity: options.severity || 'medium',
      message: '',
      timestamp: new Date(),
      metadata: options.metadata || {}
    };

    this.alerts.set(name, alert);

    // Persist alert definition
    this.db.alerts.create({
      data: {
        id: alert.id,
        name: alert.name,
        condition: alert.condition,
        threshold: alert.threshold,
        status: alert.status,
        severity: alert.severity,
        message: alert.message,
        timestamp: alert.timestamp,
        metadata: alert.metadata
      }
    }).catch(error => {
      this.logger.error(`Failed to persist alert ${alert.name}:`, error);
    });
  }

  async recordAlert(
    metricName: string,
    value: number,
    labels: Record<string, string>
  ): Promise<void> {
    for (const alert of this.alerts.values()) {
      if (alert.condition.includes(metricName)) {
        await this.evaluateAlert(alert, { [metricName]: value }, labels);
      }
    }
  }

  private async evaluateAlert(
    alert: Alert,
    metrics: Record<string, number>,
    labels: Record<string, string>
  ): Promise<void> {
    try {
      const condition = new Function('metrics', `return ${alert.condition}`);
      const triggered = condition(metrics);

      const previousStatus = alert.status;
      if (triggered && previousStatus === 'resolved') {
        alert.status = 'active';
        alert.timestamp = new Date();
        alert.message = `Alert ${alert.name} triggered`;

        await this.persistAlert(alert);
      } else if (!triggered && previousStatus === 'active') {
        alert.status = 'resolved';
        alert.timestamp = new Date();
        alert.message = `Alert ${alert.name} resolved`;

        await this.persistAlert(alert);
      }
    } catch (error) {
      this.logger.error(`Failed to evaluate alert ${alert.name}:`, error);
    }
  }

  private async persistAlert(alert: Alert): Promise<void> {
    await this.db.alerts.create({
      data: {
        id: alert.id,
        name: alert.name,
        condition: alert.condition,
        threshold: alert.threshold,
        status: alert.status,
        severity: alert.severity,
        message: alert.message,
        timestamp: alert.timestamp,
        metadata: alert.metadata
      }
    });
  }

  async getAlerts(
    options: {
      status?: 'active' | 'resolved';
      severity?: 'low' | 'medium' | 'high' | 'critical';
      startTime?: Date;
      endTime?: Date;
    } = {}
  ): Promise<Alert[]> {
    return this.db.alerts.findMany({
      where: {
        status: options.status,
        severity: options.severity,
        timestamp: {
          gte: options.startTime,
          lte: options.endTime
        }
      },
      orderBy: { timestamp: 'desc' }
    });
  }

  async recordMetricData(metricName: string, data: MetricRecord): Promise<void> {
    try {
      this.logger.debug(`Recording metric ${metricName}:`, data);
      await this.db.metricRecords.create({
        data: {
          metricName,
          ...data
        }
      });
    } catch (error) {
      this.logger.error('Error recording metric:', error);
    }
  }

  async recordErrorData(errorType: string, data: ErrorRecord): Promise<void> {
    try {
      this.logger.error(`Recording error ${errorType}:`, data);
      await this.db.errorRecords.create({
        data: {
          errorType,
          ...data
        }
      });
    } catch (error) {
      this.logger.error('Error recording error:', error);
    }
  }

  async shutdown(): Promise<void> {
    // Clear intervals
    for (const interval of this.checkIntervals.values()) {
      clearInterval(interval);
    }

    // Clear Redis
    const keys = await this.redis.keys('metric:*');
    if (keys.length > 0) {
      await this.redis.del(keys);
    }

    // Clear memory
    this.metrics.clear();
    this.alerts.clear();
  }

  async startDeploymentMonitoring(
    environment: Environment,
    version: string
  ): Promise<string> {
    const deploymentId = `${environment}-${version}-${Date.now()}`;
    
    this.activeDeployments.set(deploymentId, {
      environment,
      version,
      status: DeploymentStatus.IN_PROGRESS,
      startTime: new Date()
    });

    this.eventEmitter.emit('deployment.monitoring.started', {
      deploymentId,
      environment,
      version
    });

    return deploymentId;
  }

  async checkDeploymentHealth(deploymentId: string): Promise<DeploymentHealth> {
    const deployment = this.activeDeployments.get(deploymentId);
    if (!deployment) {
      throw new Error(`Deployment ${deploymentId} not found`);
    }

    const config = deploymentConfigs[deployment.environment];
    const metrics = await this.collectDeploymentMetrics(deploymentId);
    
    const health: DeploymentHealth = {
      healthy: true,
      metrics: metrics
    };

    // Check error rate
    if (metrics.errorRate > config.healthChecks.maxErrorRate) {
      health.healthy = false;
      health.reason = `Error rate ${metrics.errorRate} exceeds threshold ${config.healthChecks.maxErrorRate}`;
      return health;
    }

    // Check response time
    if (metrics.responseTime > config.healthChecks.maxResponseTime) {
      health.healthy = false;
      health.reason = `Response time ${metrics.responseTime}ms exceeds threshold ${config.healthChecks.maxResponseTime}ms`;
      return health;
    }

    // Check resource usage
    const cpuThreshold = 85; // 85% of limit
    const memoryThreshold = 90; // 90% of limit
    
    if (metrics.cpuUsage > cpuThreshold) {
      health.healthy = false;
      health.reason = `CPU usage ${metrics.cpuUsage}% exceeds threshold ${cpuThreshold}%`;
      return health;
    }

    if (metrics.memoryUsage > memoryThreshold) {
      health.healthy = false;
      health.reason = `Memory usage ${metrics.memoryUsage}% exceeds threshold ${memoryThreshold}%`;
      return health;
    }

    return health;
  }

  private async collectDeploymentMetrics(deploymentId: string): Promise<DeploymentMetrics> {
    // Here we would integrate with Prometheus/metrics collection
    // For now returning sample metrics
    return {
      responseTime: 150,
      errorRate: 0.001,
      cpuUsage: 45,
      memoryUsage: 60,
      requestsPerSecond: 100
    };
  }

  completeDeployment(deploymentId: string, success: boolean): void {
    const deployment = this.activeDeployments.get(deploymentId);
    if (!deployment) {
      throw new Error(`Deployment ${deploymentId} not found`);
    }

    deployment.status = success ? DeploymentStatus.COMPLETED : DeploymentStatus.FAILED;
    
    this.eventEmitter.emit('deployment.monitoring.completed', {
      deploymentId,
      environment: deployment.environment,
      version: deployment.version,
      status: deployment.status,
      duration: Date.now() - deployment.startTime.getTime()
    });
  }

  getDeploymentStatus(deploymentId: string): DeploymentStatus {
    const deployment = this.activeDeployments.get(deploymentId);
    if (!deployment) {
      throw new Error(`Deployment ${deploymentId} not found`);
    }
    return deployment.status;
  }
}
