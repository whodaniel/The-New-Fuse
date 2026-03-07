import { Injectable, Logger } from '@nestjs/common';
import { AlertService } from './alerts/AlertService';

interface Alert {
    name: string;
    condition: () => boolean;
    message: string;
}

@Injectable()
export class AlertManager {
  private readonly logger = new Logger(AlertManager.name);
  private readonly alerts: Alert[] = [];

  constructor(private readonly alertService: AlertService) {}

  createAlert(alert: Alert): void {
    this.logger.log(`Creating alert: ${alert.name}`);
    this.alerts.push(alert);
  }

  checkAlerts(): void {
    this.logger.debug('Checking alerts...');
    for (const alert of this.alerts) {
        if (alert.condition()) {
            this.alertService.sendAlert(alert.name, alert.message, 'warning');
        }
    }
  }
}
