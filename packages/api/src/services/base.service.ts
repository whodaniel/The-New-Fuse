import { PrismaClient } from '@prisma/client';
import prismaService from './prisma.service.js';

/**
 * Base service class that provides common functionality for all services
 */
export abstract class BaseService<T> {
  protected prisma: PrismaClient;
  protected modelName: string;

  constructor(modelName: string) {
    this.prisma = prismaService;
    this.modelName = modelName;
  }

  /**
   * Transform database model to API response
   */
  protected abstract transform(item: any): T;

  /**
   * Handle errors consistently
   */
  protected handleError(error: unknown, operation: string): never {
    console.error(`Error in ${this.modelName} service during ${operation}:`, error);
    
    if (error instanceof Error) {
      throw new Error(`${this.modelName} service error: ${error.message}`);
    }
    
    throw new Error(`${this.modelName} service error: Unknown error during ${operation}`);
  }

  /**
   * Log operations for debugging and monitoring
   */
  protected log(operation: string, message: string, data?: any): void {
    console.log(`[${this.modelName}] ${operation}: ${message}`, data ? data : '');
  }
}
