import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConsolidatedMonitoringService } from './ConsolidatedMonitoringService.js';

/**
 * AgentMonitoringService
 * 
 * This service provides a backward-compatible API for the agent module's MonitoringService
 * while delegating all functionality to the ConsolidatedMonitoringService.
 * 
 * This allows for a gradual migration from the agent's MonitoringService to the
 * consolidated monitoring infrastructure without breaking existing code.
 */
@Injectable()
export class AgentMonitoringService implements OnModuleInit {
  private readonly logger = new Logger(AgentMonitoringService.name);

  constructor(
    private readonly consolidatedMonitoring: ConsolidatedMonitoringService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async onModuleInit() {
    this.logger.log('AgentMonitoringService initialized - delegating to ConsolidatedMonitoringService');
  }

  /**
   * Log a system event
   */
  logEvent(eventType: string, data: any): void {
    // Maintain backward compatibility with the agent's event naming
    this.eventEmitter.emit('system.log', { type: eventType, data, timestamp: new Date() });
    
    // Also use the consolidated monitoring service
    this.consolidatedMonitoring.logEvent(eventType, data);
  }

  /**
   * Record a metric
   */
  recordMetric(metricName: string, value: number, tags: Record<string, string> = {}): void {
    // Maintain backward compatibility with the agent's event naming
    this.eventEmitter.emit('system.metric', { name: metricName, value, tags, timestamp: new Date() });
    
    // Also use the consolidated monitoring service
    this.consolidatedMonitoring.recordMetric(metricName, value, tags);
  }

  /**
   * Start monitoring a specific component
   */
  startMonitoring(componentName: string): void {
    this.logEvent('monitoring.start', { component: componentName });
  }

  /**
   * Stop monitoring a specific component
   */
  stopMonitoring(componentName: string): void {
    this.logEvent('monitoring.stop', { component: componentName });
  }

  /**
   * Check system health
   */
  async checkHealth(): Promise<Record<string, any>> {
    const healthResult = await this.consolidatedMonitoring.checkHealth();
    
    // Transform the result to match the agent's MonitoringService format
    return {
      status: healthResult.healthy ? 'ok' : 'error',
      timestamp: new Date(),
      services: healthResult.details,
    };
  }
}