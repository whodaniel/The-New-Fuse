import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);

  constructor() {}

  sendAlert(title: string, message: string, severity: 'info' | 'warning' | 'error' = 'info'): void {
    this.logger.log(`Sending alert [${severity}]: ${title}`, message);
    // This is a placeholder for a more robust implementation that would send
    // this alert to a service like PagerDuty, Slack, or a custom alerting system.
  }
}
