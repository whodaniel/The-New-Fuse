import { Logger } from "@nestjs/common";
export declare abstract class BaseService {
  protected readonly logger: Logger;
  protected readonly options: BaseServiceOptions;
  constructor(loggerContext: string, options?: Partial<BaseServiceOptions>);
  protected withErrorHandling<T>(
    operation: () => Promise<T>,
    errorMessage: string,
  ): Promise<T>;
  protected withRetry<T>(
    operation: () => Promise<T>,
    attempts?: number,
  ): Promise<T>;
}
