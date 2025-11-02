import { Injectable, Logger } from '@nestjs/common';
import { ErrorHandlingService } from './ErrorHandlingService';
import { ErrorRecoveryService } from './ErrorRecoveryService';
import { ErrorReportingService } from './error-reporting.service';

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
