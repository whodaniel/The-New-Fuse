import { Injectable, Logger } from '@nestjs/common';
import { ErrorHandlingService } from './ErrorHandlingService.js';
import { ErrorRecoveryService } from './ErrorRecoveryService.js';
import { ErrorReportingService } from './error-reporting.service.js';

@Injectable()
export class ErrorHandler {
    private readonly logger = new Logger(ErrorHandler.name);

    constructor(
        private readonly errorHandlingService: ErrorHandlingService,
        private readonly errorRecoveryService: ErrorRecoveryService,
        private readonly errorReportingService: ErrorReportingService,
    ) {}

    async handle(error: Error, context: Record<string, any> = {}): Promise<void> {
        this.logger.error(`Handling error: ${error.message}`, {
            ...context,
            stack: error.stack,
        });

        this.errorHandlingService.handle(error, context);
        await this.errorRecoveryService.handle(error, context);
        this.errorReportingService.report(error, context);
    }
}
