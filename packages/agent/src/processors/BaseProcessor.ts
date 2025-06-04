// filepath: /Users/<owner>/Desktop/A1-Inter-LLM-Com/The New Fuse/packages/agent/src/processors/BaseProcessor.ts
import { Logger } from '@the-new-fuse/utils';
import { Message } from '@the-new-fuse/types';

/**
 * Abstract base class for message processors.
 * Defines a common interface for processing messages.
 */
export abstract class BaseProcessor {
  /**
   * Logger instance for the processor. Should be initialized in the subclass constructor.
   * @protected
   */
  protected readonly logger: Logger;

  constructor() {
    if (this.constructor === BaseProcessor) {
      throw new Error("Abstract classes can't be instantiated.");
    }
  }

  /**
   * Processes an incoming message.
   * Subclasses must implement this method to handle specific message types.
   * @param message The message to process
   * @returns A Promise resolving to the processing result or null
   * @abstract
   */
  abstract process(message: Message): Promise<unknown | null>;

  /**
   * Validates a message before processing
   * @param message The message to validate
   * @throws Error if message is invalid
   * @protected
   */
  protected validateMessage(message: Message): void {
    if (!message) {
      throw new Error('Message cannot be null or undefined');
    }

    if (!message.type) {
      throw new Error('Message must have a type');
    }

    if (typeof message.data === 'undefined') {
      throw new Error('Message must have data');
    }
  }

  /**
   * Log debug information
   * @param message Debug message
   * @param data Optional data to log
   * @protected
   */
  protected debug(message: string, data?: unknown): void {
    this.logger.debug(message, data);
  }

  /**
   * Log errors with enhanced context
   * @param error Error object or message
   * @param context Optional error context
   * @protected
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
