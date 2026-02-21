import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Counter, Histogram, Gauge, register } from 'prom-client';
import { trace, context, SpanStatusCode, propagation } from '@opentelemetry/api';
import { RedisService } from '../services/redis.service.js';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type MonitoringConfig = {
  serviceName: string;
  metricsPrefix: string;
  tracingEnabled: boolean;
  metricsEnabled: boolean;
};

@Injectable()
export class UnifiedMonitoringService implements OnModuleInit {
  private readonly logger = new Logger(UnifiedMonitoringService.name);
  
  // Prometheus metrics
  private messageCounter: Counter<string>;
  private processingTimeHistogram: Histogram<string>;
  private healthCheckGauge: Gauge;
  
  // OpenTelemetry tracer
  private tracer = trace.getTracer('unified-monitoring');
  
  // Storage for outputs and errors for historical analysis
  private outputs: Array<{type: string; data: any; timestamp: string}> = [];
  private errors: Array<{error: any; timestamp: string}> = [];
  private readonly MAX_HISTORY_SIZE = 1000; // Limit the size of stored history
  
  // Default configuration
  private config: MonitoringConfig = {
    serviceName: 'the-new-fuse',
    metricsPrefix: 'fuse',
    tracingEnabled: true,
    metricsEnabled: true
  };

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly redisService: RedisService,
    private readonly configService?: ConfigService
  ) {
    // Override defaults with config from ConfigService if available
    if (this.configService) {
      this.config.serviceName = this.configService.get('SERVICE_NAME', this.config.serviceName);
      this.config.metricsPrefix = this.configService.get('METRICS_PREFIX', this.config.metricsPrefix);
      this.config.tracingEnabled = this.configService.get('TRACING_ENABLED', this.config.tracingEnabled);
      this.config.metricsEnabled = this.configService.get('METRICS_ENABLED', this.config.metricsEnabled);
    }
  }
  
  async onModuleInit() {
    if (this.config.metricsEnabled) {
      this.initializeMetrics();
    }
    this.initializeEventListeners();
    this.startHealthChecks();
    this.logger.log('UnifiedMonitoringService initialized');
  }

  private initializeMetrics() {
    this.messageCounter = new Counter({
      name: `${this.config.metricsPrefix}_messages_total`,
      help: 'Total messages processed',
      labelNames: ['message_type']
    });

    this.processingTimeHistogram = new Histogram({
      name: `${this.config.metricsPrefix}_processing_time_seconds`,
      help: 'Processing time distribution',
      buckets: [0.1, 0.5, 1, 2, 5],
      labelNames: ['message_type']
    });

    this.healthCheckGauge = new Gauge({
      name: `${this.config.metricsPrefix}_health_status`,
      help: 'Service health status (1 = healthy, 0 = unhealthy)'
    });
  }

  private initializeEventListeners() {
    // Unified event listener for all agent activity
    this.eventEmitter.on('agent.activity', (type: string, data: any) => {
      this.handleActivity(type, data);
    });
    
    // Listen for error events
    this.eventEmitter.on('agent.processing.error', (error: any) => {
      this.handleError(error);
    });
  }

  private async handleActivity(type: string, data: any) {
    const span = this.tracer.startSpan('handleActivity');
    context.with(trace.setSpan(context.active(), span), async () => {
      try {
        const startTime = process.hrtime();

        // Metric collection
        if (this.config.metricsEnabled) {
          this.messageCounter.inc({ message_type: type });
        }

        // Tracing context
        if (this.config.tracingEnabled) {
          span.setAttributes({
            'message.type': type,
            'processing.start_time': Date.now()
          });
        }

        // Core processing logic
        this.logger.log(`Processed ${type} activity:`, data);
        
        // Store the output for historical analysis
        this.storeOutput(type, data);
        
        // Distributed tracing propagation
        propagation.inject(context.active(), data);

        // Unified event emission
        this.eventEmitter.emit('monitoring.event', {
          type,
          data,
          timestamp: new Date().toISOString(),
          traceId: span.spanContext().traceId
        });

        // Metric timing
        if (this.config.metricsEnabled) {
          const diffTime = process.hrtime(startTime);
          const duration = diffTime[0] + diffTime[1] / 1e9;
          this.processingTimeHistogram.observe({ message_type: type }, duration);
        }

        span.end();
      } catch (error) {
        span.recordException(error);
        span.setStatus({ code: SpanStatusCode.ERROR });
        this.logger.error('Activity processing failed:', error);
        // Store the error
        this.storeError(error);
        span.end();
      }
    });
  }

  // Consolidated health check logic
  private startHealthChecks() {
    setInterval(async () => {
      try {
        await this.redisService.ping();
        this.healthCheckGauge.set(1);
      } catch (error) {
        this.healthCheckGauge.set(0);
        this.logger.error('Health check failure:', error);
      }
    }, 30000);
  }
  
  // Error handling method
  private handleError(error: any) {
    const span = this.tracer.startSpan('handleError');
    context.with(trace.setSpan(context.active(), span), () => {
      try {
        this.logger.error('Processing error:', error);
        
        // Store the error for historical analysis
        this.storeError(error);
        
        // Add error attributes to span
        span.setAttributes({
          'error.type': error.name || 'UnknownError',
          'error.message': error.message || 'No message',
          'error.timestamp': Date.now()
        });
        
        // Emit a unified error event
        this.eventEmitter.emit('monitoring.error', {
          error,
          timestamp: new Date().toISOString(),
          traceId: span.spanContext().traceId
        });
        
        span.end();
      } catch (err) {
        span.recordException(err);
        span.setStatus({ code: SpanStatusCode.ERROR });
        this.logger.error('Error handling failed:', err);
        span.end();
      }
    });
  }
  
  // Storage methods
  private storeOutput(type: string, data: any) {
    const outputEntry = {
      type,
      data,
      timestamp: new Date().toISOString()
    };
    
    // Add to the beginning for faster access to recent items
    this.outputs.unshift(outputEntry);
    
    // Trim the history if it exceeds the maximum size
    if (this.outputs.length > this.MAX_HISTORY_SIZE) {
      this.outputs = this.outputs.slice(0, this.MAX_HISTORY_SIZE);
    }
  }
  
  private storeError(error: any) {
    const errorEntry = {
      error,
      timestamp: new Date().toISOString()
    };
    
    this.errors.unshift(errorEntry);
    
    if (this.errors.length > this.MAX_HISTORY_SIZE) {
      this.errors = this.errors.slice(0, this.MAX_HISTORY_SIZE);
    }
  }
  
  // Public methods for accessing historical data
  public async getRecentOutputs(limit: number = 100) {
    return this.outputs.slice(0, limit);
  }
  
  public async getRecentErrors(limit: number = 100) {
    return this.errors.slice(0, limit);
  }
}