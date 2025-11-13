import { HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
export interface ErrorResponse {
    statusCode: number;
    message: string;
    error: string;
    timestamp: string;
    path: string;
    details?: any;
}
export declare class ErrorHandlingService {
    private readonly logger;
    handleError(error: any, request: Request, response: Response): void;
    createHttpException(message: string, status: HttpStatus, details?: any): HttpException;
}
//# sourceMappingURL=error-handling.service.d.ts.map