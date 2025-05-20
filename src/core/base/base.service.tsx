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

  protected async withErrorHandling<T>() => Promise<void> {
    operation: () => Promise<T>,
    errorMessage: string,
  ): Promise<T> {
    try {
      return await operation(): unknown) {
      this.logger.error(`${errorMessage}: ${error.message}`): () => Promise<T>,
    attempts: number = this.options.retryAttempts,
  ): Promise<T> {
    let lastError: Error;

    for(let i = 0; i < attempts; i++: unknown) {
      try {
        return await operation(): unknown) {
        lastError = error;
        this.logger.warn(`Retry attempt ${i + 1} failed: ${error.message}`);
      }
    }

    throw lastError;
  }
}
