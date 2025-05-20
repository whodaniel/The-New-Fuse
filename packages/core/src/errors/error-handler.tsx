import { injectable } from 'inversify';
import { CustomError, ErrorSeverity } from '@the-new-fuse/types';

@injectable()
export class ErrorHandler {
  createError(
    message: string,
    code: string,
    statusCode: number = 500,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    details?: Record<string, any>
  ): Error & { statusCode: number; code: string; details?: Record<string, any> } {
    const error = new Error(message) as Error & {
      statusCode: number;
      code: string;
      details?: Record<string, any>;
    };
    error.statusCode = statusCode;
    error.code = code;
    error.details = details;
    return error;
  }

  logError(error: Error | CustomError, context?: string): void {
    console.error(`[${context || 'ERROR'}] ${error.message}`, error);
  }

  formatErrorResponse(error: Error | CustomError): { status: number; body: unknown } {
    const statusCode = (error as any).statusCode || 500;
    const code = (error as any).code || 'INTERNAL_ERROR';

    return {
      status: statusCode,
      body: {
        error: {
          message: error.message,
          code,
          details: (error as any).details,
        }
      }
    };
  }
}
