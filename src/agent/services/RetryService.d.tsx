export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
}
export declare class RetryService {
  private readonly logger;
  private readonly defaultConfig;
  executeWithRetry<T>(
    operation: () => Promise<T>,
    message: AgentMessage,
    config?: Partial<RetryConfig>,
  ): Promise<T>;
  private delay;
}
