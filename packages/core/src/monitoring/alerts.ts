import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AlertsService {
    private readonly logger = new Logger(AlertsService.name);

    constructor() {}

    trigger(name: string, context: Record<string, any> = {}): void {
        this.logger.log(`Triggering alert: ${name}`, context);
        // This is a placeholder for a more robust implementation that would send
        // this alert to a service like PagerDuty, Slack, or a custom alerting system.
    }
}
