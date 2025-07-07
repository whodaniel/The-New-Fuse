import { Logger } from '@packages/utils';
import { Message } from '@packages/types';

/**
 * Abstract base class for message processors
 */
export abstract class BaseProcessor {
  protected readonly logger: Logger;

  constructor() {
    if (this.constructor === BaseProcessor) {
      throw new Error("Abstract classes can't be instantiated.");
    }
    this.logger = new Logger(this.constructor.name);
  }

  /**
   * Process an incoming message
   * @param message The message to process
   * @returns Processing result or null
   */
  abstract process(message: Message): Promise<unknown | null>;

  /**
   * Validate incoming message
   * @param message The message to validate
   * @throws Error if message is invalid
   */
  protected validateMessage(message: Message): void {
    if (!message) {
      throw new Error('Message cannot be null or undefined');
    }
    if (!message.type) {
      throw new Error('Message must have a type');
    }
    if (typeof message.type !== 'string') {
      throw new Error('Message type must be a string');
    }
  }

  /**
   * Log debug information
   * @param message Debug message
   * @param data Optional data to log
   */
  protected debug(message: string, data?: unknown): void {
    this.logger.debug(message, data);
  }

  /**
   * Log errors with enhanced context
   * @param error Error object or message
   * @param context Optional error context
   */
  protected logError(error: Error | string, context?: unknown): void {
    if (error instanceof Error) {
      this.logger.error(error.message, {
        stack: error.stack,
        context
      });
    } else {
      this.logger.error(error, context);
    }
  }
}
