import { Controller } from '@nestjs/common';

/**
 * Base controller class that all controllers should extend
 * Provides common functionality for API responses
 */
export abstract class BaseController {
  /**
   * Creates a successful API response
   * @param data The data to include in the response
   * @param message Optional message to include
   */
  protected success<T>(data: T, message?: string): ApiResponse<T> {
    return {
      success: true,
      data,
      message: message || 'Operation successful'
    };
  }

  /**
   * Creates an error API response
   * @param error The error message or object
   * @param data Optional data to include
   */
  protected error<T>(error: string | Error, data?: T): ApiResponse<T> {
    const errorMessage = error instanceof Error ? error.message : error;
    
    return {
      success: false,
      error: errorMessage,
      data
    };
  }
}

/**
 * Standard API response format
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
