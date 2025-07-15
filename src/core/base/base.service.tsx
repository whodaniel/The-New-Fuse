import { Injectable, Logger } from "@nestjs/common";
import { BaseServiceOptions } from "@project/types";

@Injectable()
export abstract class BaseService {
  protected readonly logger: Logger;
  protected readonly options: BaseServiceOptions;

  constructor(
    loggerContext: string,
    options: Partial<BaseServiceOptions> = {},
  ) {
    this.logger = new Logger(loggerContext);
    this.options = {
      timeout: 30000,
      retryAttempts: 3,
      cacheEnabled: true,
      ...options,
    };
  }

  protected async withErrorHandling<T>(
    operation: () => Promise<T>,
    errorMessage: string,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error: any) {
      this.logger.error(`${errorMessage}: ${error.message}`);
      throw error;
    }
  }

  protected async withRetry<T>(
    operation: () => Promise<T>,
    attempts: number = this.options.retryAttempts,
  ): Promise<T> {
    let lastError: Error;

    for (let i = 0; i < attempts; i++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        this.logger.warn(`Retry attempt ${i + 1} failed: ${error.message}`);
        
        if (i < attempts - 1) {
          await this.delay(Math.pow(2, i) * 1000); // Exponential backoff
        }
      }
    }

    throw lastError;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}