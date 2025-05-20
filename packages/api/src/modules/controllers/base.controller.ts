/**
 * Base controller pattern for all application controllers
 * Provides standardized response formatting and error handling
 */

import { Logger } from '@nestjs/common';
import { ApiResponse } from '@the-new-fuse/types';
import { toError } from '../../utils/error.js'; // Import the helper

export abstract class BaseController {
  protected readonly logger: Logger;
  
  constructor(controllerName: string) {
    this.logger = new Logger(controllerName);
  }

  /**
   * Handle async operations with consistent error handling
   * @param operation Async operation to execute
   * @param errorMessage Error message if operation fails
   * @returns Standardized API response
   */
  protected async handleAsync<T>(
    operation: () => Promise<T>, 
    errorMessage: string
  ): Promise<ApiResponse<T>> {
    try {
      const data = await operation();
      return this.success(data);
    } catch (error) {
      return this.handleError(error, errorMessage);
    }
  }

  /**
   * Create a success response
   * @param data Response data
   * @returns Standardized success response
   */
  protected success<T>(data: T): ApiResponse<T> {
    return {
      success: true,
      data,
      error: null
    };
  }

  /**
   * Create an error response
   * @param message Error message
   * @param details Error details
   * @returns Standardized error response
   */
  protected error<T>(message: string, details?: string): ApiResponse<T> {
    return {
      success: false,
      error: message,
      // no data property for failure
    } as ApiResponse<T>;
  }

  /**
   * Handle errors with consistent error handling
   * @param error Error object
   * @param errorMessage Error message if operation fails
   * @returns Standardized API response
   */
  protected handleError(error: unknown, errorMessage: string): ApiResponse<null> {
    const err = toError(error); // Use helper
    this.logger.error(`${errorMessage}: ${err.message}`, err.stack); // Use err.message and err.stack
    return this.error(errorMessage, err.message); // Use err.message
  }
}
