import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UnifiedMonitoringService } from './UnifiedMonitoringService.js';
import { RedisService } from '../services/redis.service.js';

/**
 * ConsolidatedMonitoringService
 * 
 * This service acts as a facade for all monitoring functionality in the application.
 * It delegates to UnifiedMonitoringService for most functionality while providing
 * a clean, consistent API for all monitoring needs.
 * 
 * In the future, all monitoring services should be migrated to use this service
 * instead of directly using UnifiedMonitoringService or other monitoring services.
 */
@Injectable()
export class ConsolidatedMonitoringService implements OnModuleInit {
  private readonly logger = new Logger(ConsolidatedMonitoringService.name);

  constructor(
    private readonly unifiedMonitoring: UnifiedMonitoringService,
    private readonly eventEmitter: EventEmitter2,
    private readonly redisService: RedisService
  ) {}

  async onModuleInit() {
    this.logger.log('ConsolidatedMonitoringService initialized');
    
    // Set up event forwarding to ensure all events are properly captured
    this.setupEventForwarding();
  }

  private setupEventForwarding() {
    // Forward all monitoring-related events to UnifiedMonitoringService
    this.eventEmitter.on('agent.*', (type: string, data: any) => {
      this.eventEmitter.emit('monitoring.event', { source: 'agent', type, data });
    });
    
    this.eventEmitter.on('system.*', (type: string, data: any) => {
      this.eventEmitter.emit('monitoring.event', { source: 'system', type, data });
    });
    
    this.eventEmitter.on('roo.*', (type: string, data: any) => {
      this.eventEmitter.emit('monitoring.event', { source: 'roo', type, data });
    });
  }

  // Metrics recording
  recordMetric(name: string, value: number, tags: Record<string, string> = {}) {
    this.eventEmitter.emit('monitoring.metric', { name, value, tags });
    return this.unifiedMonitoring.recordMetric?.(name, value, tags);
  }

  // Latency recording
  recordLatency(operation: string, durationMs: number, tags: Record<string, string> = {}) {
    this.eventEmitter.emit('monitoring.latency', { operation, durationMs, tags });
    return this.unifiedMonitoring.recordLatency?.(operation, durationMs, tags);
  }

  // Event logging
  logEvent(eventName: string, data: any = {}) {
    this.eventEmitter.emit('monitoring.event', { name: eventName, data });
    return this.unifiedMonitoring.logEvent?.(eventName, data);
  }

  // Error tracking
  trackError(error: Error, context: Record<string, any> = {}) {
    this.eventEmitter.emit('monitoring.error', { error, context });
    return this.unifiedMonitoring.trackError?.(error, context);
  }

  // Health check
  async checkHealth(): Promise<{ healthy: boolean; details: Record<string, any> }> {
    try {
      // Check Redis connection
      await this.redisService.ping?.();
      
      return { 
        healthy: true, 
        details: { 
          redis: 'connected',
          timestamp: new Date().toISOString() 
        } 
      };
    } catch (error) {
      this.logger.error('Health check failed', error);
      return { 
        healthy: false, 
        details: { 
          error: error.message,
          timestamp: new Date().toISOString() 
        } 
      };
    }
  }

  // Historical data access
  async getRecentOutputs(limit: number = 100) {
    return this.unifiedMonitoring.getRecentOutputs(limit);
  }
  
  async getRecentErrors(limit: number = 100) {
    return this.unifiedMonitoring.getRecentErrors(limit);
  }

  // Trae-specific metrics tracking
  async trackTraeMetrics(data: any) {
    this.eventEmitter.emit('monitoring.trae', data);
    return this.unifiedMonitoring.trackTraeMetrics?.(data);
  }
}