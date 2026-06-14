/**
 * Base controller pattern for all application controllers
 * Provides standardized response formatting and error handling
 */
import { Logger } from '@nestjs/common';
import { ApiResponse } from '@the-new-fuse/types';
export declare abstract class BaseController {
    protected readonly logger: Logger;
    constructor(controllerName: string);
    /**
     * Handle async operations with consistent error handling
     * @param operation Async operation to execute
     * @param errorMessage Error message if operation fails
     * @returns Standardized API response
     */
    protected handleAsync<T>(operation: () => Promise<T>, errorMessage: string): Promise<ApiResponse<T>>;
    /**
     * Create a success response
     * @param data Response data
     * @returns Standardized success response
     */
    protected success<T>(data: T): ApiResponse<T>;
    /**
     * Create an error response
     * @param message Error message
     * @param details Error details
     * @returns Standardized error response
     */
    protected error<T>(message: string, details?: string): ApiResponse<T>;
    /**
     * Handle errors with consistent error handling
     * @param error Error object
     * @param errorMessage Error message if operation fails
     * @returns Standardized API response
     */
    protected handleError<T>(error: unknown, errorMessage: string): ApiResponse<T>;
}
//# sourceMappingURL=base.controller.d.ts.map