import { Response } from 'express';
/**
 * Success response structure
 */
export interface SuccessResponse<T> {
    success: true;
    data: T;
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
        [key: string]: unknown;
    };
}
/**
 * Send a standardized success response
 */
export declare function sendSuccess<T>(res: Response, data: T, statusCode?: number, meta?: SuccessResponse<T>['meta']): Response;
/**
 * Send a standardized created response
 */
export declare function sendCreated<T>(res: Response, data: T): Response;
/**
 * Send a standardized no content response
 */
export declare function sendNoContent(res: Response): Response;
//# sourceMappingURL=response.util.d.ts.map