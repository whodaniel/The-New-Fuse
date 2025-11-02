import { Injectable, Logger } from '@nestjs/common';
import { ErrorDashboardService } from './error-dashboard.service';

@Injectable()
export class ErrorTrackingService {
  private readonly logger = new Logger(ErrorTrackingService.name);

  constructor(private readonly errorDashboardService: ErrorDashboardService) {}

  captureException(error: Error, context: Record<string, any> = {}): void {
    this.logger.error(`Capturing exception: ${error.message}`, {
      ...context,
      stack: error.stack,
    });

    this.errorDashboardService.reportError(error, context);
  }
}
