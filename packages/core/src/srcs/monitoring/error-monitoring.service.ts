import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ErrorMonitoringService {
    private readonly logger = new Logger(ErrorMonitoringService.name);

    constructor() {}

    captureError(error: Error, context: Record<string, any> = {}): void {
        this.logger.error(`Capturing error: ${error.message}`, {
            ...context,
            stack: error.stack,
        });
        // This is a placeholder for a more robust implementation that would send
        // this error to a service like Sentry, Bugsnag, or a custom error tracking system.
    }
}
