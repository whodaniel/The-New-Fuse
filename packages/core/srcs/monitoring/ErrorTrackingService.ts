import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ErrorTrackingService {
  private readonly logger = new Logger(ErrorTrackingService.name);

  constructor() {}

  captureException(error: Error, context: Record<string, any> = {}): void {
    this.logger.error(`Capturing exception: ${error.message}`, {
      ...context,
      stack: error.stack,
    });
    // This is a placeholder for a more robust implementation that would send
    // this error to a service like Sentry, Bugsnag, or a custom error tracking system.
  }
}
