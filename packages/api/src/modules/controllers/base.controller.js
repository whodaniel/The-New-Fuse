/**
 * Base controller pattern for all application controllers
 * Provides standardized response formatting and error handling
 */
import { Logger } from '@nestjs/common';
import { toError } from '../../utils/error'; // Import the helper
export class BaseController {
    logger;
    constructor(controllerName) {
        this.logger = new Logger(controllerName);
    }
    /**
     * Handle async operations with consistent error handling
     * @param operation Async operation to execute
     * @param errorMessage Error message if operation fails
     * @returns Standardized API response
     */
    async handleAsync(operation, errorMessage) {
        try {
            const data = await operation();
            return this.success(data);
        }
        catch (error) {
            return this.handleError(error, errorMessage);
        }
    }
    /**
     * Create a success response
     * @param data Response data
     * @returns Standardized success response
     */
    success(data) {
        return {
            success: true,
            data,
            error: undefined
        };
    }
    /**
     * Create an error response
     * @param message Error message
     * @param details Error details
     * @returns Standardized error response
     */
    error(message, details) {
        return {
            success: false,
            error: message,
            // no data property for failure
        };
    }
    /**
     * Handle errors with consistent error handling
     * @param error Error object
     * @param errorMessage Error message if operation fails
     * @returns Standardized API response
     */
    handleError(error, errorMessage) {
        const err = toError(error); // Use helper
        this.logger.error(`${errorMessage}: ${err.message}`, err.stack); // Use err.message and err.stack
        return this.error(errorMessage, err.message); // Use err.message
    }
}
//# sourceMappingURL=base.controller.js.map