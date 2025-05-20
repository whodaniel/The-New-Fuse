import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class AlertService {
  constructor(
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Send a system alert
   */
  sendAlert(alertType: string, message: string, severity: 'info' | 'warning' | 'error' | 'critical' = 'info', metadata: Record<string, any> = {}): void {
    const alert = {
      type: alertType,
      message,
      severity,
      timestamp: new Date(),
      metadata,
    };

    // Emit event for alert handlers
    this.eventEmitter.emit('system.alert', alert);

    // Log critical alerts to console as well
    if (severity === 'critical' || severity === 'error') {
      console.error(`[ALERT] ${alertType}: ${message}`);
    }
  }

  /**
   * Send an info level alert
   */
  info(alertType: string, message: string, metadata: Record<string, any> = {}): void {
    this.sendAlert(alertType, message, 'info', metadata);
  }

  /**
   * Send a warning level alert
   */
  warning(alertType: string, message: string, metadata: Record<string, any> = {}): void {
    this.sendAlert(alertType, message, 'warning', metadata);
  }

  /**
   * Send an error level alert
   */
  error(alertType: string, message: string, metadata: Record<string, any> = {}): void {
    this.sendAlert(alertType, message, 'error', metadata);
  }

  /**
   * Send a critical level alert
   */
  critical(alertType: string, message: string, metadata: Record<string, any> = {}): void {
    this.sendAlert(alertType, message, 'critical', metadata);
  }

  /**
   * Check if alerts should be sent based on environment
   */
  shouldSendAlerts(): boolean {
    const environment = this.configService.get<string>('NODE_ENV');
    const alertsEnabled = this.configService.get<string>('ALERTS_ENABLED');
    
    // Default to enabled for production, disabled for development/test
    if (alertsEnabled !== undefined) {
      return alertsEnabled === 'true';
    }
    
    return environment === 'production';
  }
}