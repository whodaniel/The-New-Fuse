import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CentralizedLoggingService } from '../logging/centralized-logging.service.js';
import { SystemResourceMonitorService } from './system-resource-monitor.service.js';
import { PerformanceMonitoringService } from './performance-monitoring.service.js';
import * as child_process from 'child_process';
import * as util from 'util';

const exec = util.promisify(child_process.exec);

export interface ScalingRule {
  metric: string;
  threshold: number;
  cooldownSeconds: number;
  action: 'scale_up' | 'scale_down';
  minInstances: number;
  maxInstances: number;
  incrementBy: number;
}

export interface ScalingAction {
  timestamp: Date;
  rule: ScalingRule;
  metric: string;
  value: number;
  action: 'scale_up' | 'scale_down';
  fromInstances: number;
  toInstances: number;
  success: boolean;
  error?: string;
}

export interface AutoScalingConfig {
  enabled: boolean;
  checkIntervalMs: number;
  rules: ScalingRule[];
  provider: 'kubernetes' | 'docker' | 'aws' | 'azure' | 'gcp' | 'custom';
  providerConfig: Record<string, any>;
}

@Injectable()
export class AutoScalingService implements OnModuleInit {
  private readonly logger: any;
  private config: AutoScalingConfig;
  private checkInterval: NodeJS.Timeout;
  private lastScalingActions: Map<string, Date> = new Map();
  private currentInstances: number = 1;
  private scalingHistory: ScalingAction[] = [];

  constructor(
    private readonly configService: ConfigService,
    private readonly loggingService: CentralizedLoggingService,
    private readonly systemMonitor: SystemResourceMonitorService,
    private readonly performanceMonitor: PerformanceMonitoringService,
    private readonly eventEmitter: EventEmitter2
  ) {
    this.logger = this.loggingService.createLogger('AutoScaling');
  }

  async onModuleInit() {
    // Load configuration
    this.config = {
      enabled: this.configService.get<boolean>('monitoring.autoScaling.enabled', false),
      checkIntervalMs: this.configService.get<number>('monitoring.autoScaling.checkIntervalMs', 60000), // 1 minute
      rules: this.configService.get<ScalingRule[]>('monitoring.autoScaling.rules', []),
      provider: this.configService.get<'kubernetes' | 'docker' | 'aws' | 'azure' | 'gcp' | 'custom'>('monitoring.autoScaling.provider', 'kubernetes'),
      providerConfig: this.configService.get<Record<string, any>>('monitoring.autoScaling.providerConfig', {})
    };

    if (!this.config.enabled) {
      this.logger.info('Auto scaling is disabled');
      return;
    }

    // Get current instance count
    try {
      this.currentInstances = await this.getCurrentInstanceCount();
    } catch (error) {
      this.logger.error('Failed to get current instance count', { error });
    }

    // Start check interval
    this.checkInterval = setInterval(() => this.checkScalingRules(), this.config.checkIntervalMs);
    
    // Run initial check
    await this.checkScalingRules();
    
    this.logger.info('Auto scaling service initialized', {
      metadata: {
        provider: this.config.provider,
        rules: this.config.rules.length,
        currentInstances: this.currentInstances
      }
    });
  }

  /**
   * Get scaling history
   */
  getScalingHistory(): ScalingAction[] {
    return [...this.scalingHistory];
  }

  /**
   * Get current instance count
   */
  async getCurrentInstanceCount(): Promise<number> {
    switch (this.config.provider) {
      case 'kubernetes':
        return this.getKubernetesInstanceCount();
      case 'docker':
        return this.getDockerInstanceCount();
      case 'aws':
        return this.getAwsInstanceCount();
      case 'azure':
        return this.getAzureInstanceCount();
      case 'gcp':
        return this.getGcpInstanceCount();
      case 'custom':
        return this.getCustomInstanceCount();
      default:
        return this.currentInstances;
    }
  }

  /**
   * Manually trigger scaling rules check
   */
  async checkScalingRules(): Promise<void> {
    if (!this.config.enabled) return;
    
    try {
      // Get latest metrics
      const systemMetrics = this.systemMonitor.getLatestMetrics();
      
      if (!systemMetrics) {
        this.logger.warn('No system metrics available for scaling decision');
        return;
      }
      
      // Check each rule
      for (const rule of this.config.rules) {
        await this.evaluateScalingRule(rule, systemMetrics);
      }
    } catch (error) {
      this.logger.error('Error checking scaling rules', { error });
    }
  }

  /**
   * Private methods
   */

  private async evaluateScalingRule(rule: ScalingRule, metrics: any): Promise<void> {
    // Get metric value
    const value = this.getMetricValue(metrics, rule.metric);
    
    if (value === null) {
      this.logger.warn(`Metric ${rule.metric} not found for scaling rule`);
      return;
    }
    
    // Check if in cooldown period
    const lastAction = this.lastScalingActions.get(rule.metric);
    if (lastAction) {
      const cooldownMs = rule.cooldownSeconds * 1000;
      const timeSinceLastAction = Date.now() - lastAction.getTime();
      
      if (timeSinceLastAction < cooldownMs) {
        this.logger.debug(`Scaling rule for ${rule.metric} is in cooldown period (${Math.round((cooldownMs - timeSinceLastAction) / 1000)}s remaining)`);
        return;
      }
    }
    
    // Determine if scaling is needed
    let shouldScale = false;
    let scalingAction: 'scale_up' | 'scale_down' = 'scale_up';
    
    if (rule.action === 'scale_up' && value >= rule.threshold) {
      shouldScale = true;
      scalingAction = 'scale_up';
    } else if (rule.action === 'scale_down' && value <= rule.threshold) {
      shouldScale = true;
      scalingAction = 'scale_down';
    }
    
    if (!shouldScale) {
      return;
    }
    
    // Calculate new instance count
    const currentInstances = await this.getCurrentInstanceCount();
    let newInstances = currentInstances;
    
    if (scalingAction === 'scale_up') {
      newInstances = Math.min(rule.maxInstances, currentInstances + rule.incrementBy);
    } else {
      newInstances = Math.max(rule.minInstances, currentInstances - rule.incrementBy);
    }
    
    // Check if instance count would actually change
    if (newInstances === currentInstances) {
      this.logger.info(`No scaling needed for ${rule.metric}: already at ${scalingAction === 'scale_up' ? 'maximum' : 'minimum'} instances (${currentInstances})`);
      return;
    }
    
    // Perform scaling
    try {
      await this.scaleInstances(newInstances);
      
      // Record action
      const action: ScalingAction = {
        timestamp: new Date(),
        rule,
        metric: rule.metric,
        value,
        action: scalingAction,
        fromInstances: currentInstances,
        toInstances: newInstances,
        success: true
      };
      
      this.scalingHistory.push(action);
      this.lastScalingActions.set(rule.metric, new Date());
      this.currentInstances = newInstances;
      
      this.logger.info(`Scaled ${scalingAction === 'scale_up' ? 'up' : 'down'} from ${currentInstances} to ${newInstances} instances based on ${rule.metric} = ${value}`, {
        metadata: {
          rule,
          value,
          fromInstances: currentInstances,
          toInstances: newInstances
        }
      });
      
      // Emit event
      this.eventEmitter.emit('monitoring.scaling', action);
    } catch (error) {
      const action: ScalingAction = {
        timestamp: new Date(),
        rule,
        metric: rule.metric,
        value,
        action: scalingAction,
        fromInstances: currentInstances,
        toInstances: newInstances,
        success: false,
        error: error.message
      };
      
      this.scalingHistory.push(action);
      
      this.logger.error(`Failed to scale ${scalingAction === 'scale_up' ? 'up' : 'down'} from ${currentInstances} to ${newInstances} instances`, {
        error,
        metadata: {
          rule,
          value,
          fromInstances: currentInstances,
          toInstances: newInstances
        }
      });
      
      // Emit event
      this.eventEmitter.emit('monitoring.scaling', action);
    }
  }

  private getMetricValue(metrics: any, metricPath: string): number | null {
    const parts = metricPath.split('.');
    let current: any = metrics;
    
    for (const part of parts) {
      if (current === undefined || current === null) {
        return null;
      }
      
      current = current[part];
    }
    
    return typeof current === 'number' ? current : null;
  }

  private async scaleInstances(count: number): Promise<void> {
    switch (this.config.provider) {
      case 'kubernetes':
        return this.scaleKubernetes(count);
      case 'docker':
        return this.scaleDocker(count);
      case 'aws':
        return this.scaleAws(count);
      case 'azure':
        return this.scaleAzure(count);
      case 'gcp':
        return this.scaleGcp(count);
      case 'custom':
        return this.scaleCustom(count);
      default:
        throw new Error(`Unsupported scaling provider: ${this.config.provider}`);
    }
  }

  // Provider-specific implementations

  private async getKubernetesInstanceCount(): Promise<number> {
    try {
      const { namespace, deployment } = this.config.providerConfig;
      
      const { stdout } = await exec(`kubectl get deployment ${deployment} -n ${namespace} -o jsonpath='{.spec.replicas}'`);
      
      return parseInt(stdout.trim(), 10) || 1;
    } catch (error) {
      this.logger.error('Failed to get Kubernetes instance count', { error });
      return 1;
    }
  }

  private async scaleKubernetes(count: number): Promise<void> {
    const { namespace, deployment } = this.config.providerConfig;
    
    await exec(`kubectl scale deployment ${deployment} -n ${namespace} --replicas=${count}`);
  }

  private async getDockerInstanceCount(): Promise<number> {
    try {
      const { serviceName } = this.config.providerConfig;
      
      const { stdout } = await exec(`docker service inspect ${serviceName} --format '{{.Spec.Mode.Replicated.Replicas}}'`);
      
      return parseInt(stdout.trim(), 10) || 1;
    } catch (error) {
      this.logger.error('Failed to get Docker instance count', { error });
      return 1;
    }
  }

  private async scaleDocker(count: number): Promise<void> {
    const { serviceName } = this.config.providerConfig;
    
    await exec(`docker service scale ${serviceName}=${count}`);
  }

  private async getAwsInstanceCount(): Promise<number> {
    // Implementation would use AWS SDK
    return this.currentInstances;
  }

  private async scaleAws(count: number): Promise<void> {
    // Implementation would use AWS SDK
    this.logger.info(`Would scale AWS to ${count} instances`);
  }

  private async getAzureInstanceCount(): Promise<number> {
    // Implementation would use Azure SDK
    return this.currentInstances;
  }

  private async scaleAzure(count: number): Promise<void> {
    // Implementation would use Azure SDK
    this.logger.info(`Would scale Azure to ${count} instances`);
  }

  private async getGcpInstanceCount(): Promise<number> {
    // Implementation would use GCP SDK
    return this.currentInstances;
  }

  private async scaleGcp(count: number): Promise<void> {
    // Implementation would use GCP SDK
    this.logger.info(`Would scale GCP to ${count} instances`);
  }

  private async getCustomInstanceCount(): Promise<number> {
    const { getInstanceCountCommand } = this.config.providerConfig;
    
    if (!getInstanceCountCommand) {
      return this.currentInstances;
    }
    
    try {
      const { stdout } = await exec(getInstanceCountCommand);
      return parseInt(stdout.trim(), 10) || 1;
    } catch (error) {
      this.logger.error('Failed to get custom instance count', { error });
      return 1;
    }
  }

  private async scaleCustom(count: number): Promise<void> {
    const { scaleCommand } = this.config.providerConfig;
    
    if (!scaleCommand) {
      throw new Error('No scale command configured for custom provider');
    }
    
    const command = scaleCommand.replace('{count}', count.toString());
    await exec(command);
  }
}
