import { ErrorHandlingService } from './ErrorHandlingService.js';
import { ErrorRecoveryService } from './ErrorRecoveryService.js';
import { ErrorReportingService } from './error-reporting.service.js';
export declare class ErrorHandler {
    private readonly errorHandlingService;
    private readonly errorRecoveryService;
    private readonly errorReportingService;
    private readonly logger;
    constructor(errorHandlingService: ErrorHandlingService, errorRecoveryService: ErrorRecoveryService, errorReportingService: ErrorReportingService);
    handle(error: Error, context?: Record<string, any>): Promise<void>;
}
//# sourceMappingURL=error-handler.d.ts.map