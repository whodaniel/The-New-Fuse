import { ErrorSeverity, CustomError } from '@the-new-fuse/types';

export declare class ErrorHandler {
    createError(
        message: string,
        code: string,
        statusCode?: number,
        severity?: ErrorSeverity,
        details?: Record<string, any>
    ): Error & {
        statusCode: number;
        code: string;
        details?: Record<string, any>;
    };

    logError(error: Error | CustomError, context?: string): void;

    formatErrorResponse(error: Error | CustomError): {
        status: number;
        body: unknown
    };
}
