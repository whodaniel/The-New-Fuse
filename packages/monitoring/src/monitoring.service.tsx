import { Injectable, Logger } from '@nestjs/common';
import { AlertService } from './alerts/alert.service.js';
import { PerformanceMonitoringService } from './performance-monitoring.service.js';
import { ErrorTrackingService } from './error-tracking.service.js';
import { SecurityLoggingService } from './security-logging.service.js';

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);
  
  constructor(
    private readonly alertService: AlertService,
    private readonly performanceService: PerformanceMonitoringService,
    private readonly errorTracking: ErrorTrackingService,
    private readonly securityLogging: SecurityLoggingService
  ) {}

  async initialize(): Promise<void> {
    await Promise.all([
      this.alertService.initialize(),
      this.performanceService.initialize(),
      this.errorTracking.initialize(),
      this.securityLogging.initialize()
    ]);
    this.logger.log('Monitoring service initialized');
  }

  async trackMetric(name: string, value: number, tags: Record<string, string> = {}): Promise<void> {
    await this.performanceService.trackMetric(name, value, tags);
  }

  async trackError(error: Error, context: Record<string, any> = {}): Promise<void> {
    await this.errorTracking.trackError(error, context);
  }

  async logSecurityEvent(event: string, data: Record<string, any> = {}): Promise<void> {
    await this.securityLogging.logEvent(event, data);
  }

  async createAlert(type: string, message: string, severity: 'low' | 'medium' | 'high'): Promise<void> {
    await this.alertService.createAlert(type, message, severity);
  }
}
