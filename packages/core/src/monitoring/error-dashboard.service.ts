import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ErrorDashboardService {
  private readonly logger = new Logger(ErrorDashboardService.name);

  constructor() {}

  reportError(error: Error, context: Record<string, any> = {}): void {
    this.logger.error(`Reporting error to dashboard: ${error.message}`, {
      ...context,
      stack: error.stack,
    });
    // This is a placeholder for a more robust implementation that would send
    // this error to a service like Sentry, Bugsnag, or a custom dashboard.
  }
}
