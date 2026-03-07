import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ExternalReportingService {
    private readonly logger = new Logger(ExternalReportingService.name);

    constructor() {}

    report(error: Error, context: Record<string, any> = {}): void {
        this.logger.error(`Reporting error to external service: ${error.message}`, {
            ...context,
            stack: error.stack,
        });
        // This is a placeholder for a more robust implementation that would
        // send the error to a remote service like Sentry, Bugsnag, or a
        // custom error reporting system.
    }
}
