import { Logger } from '@nestjs/common';
import { Message } from '@the-new-fuse/types';
/**
 * Abstract base class for message processors.
 * Defines a common interface for processing messages.
 */
export declare abstract class BaseProcessor {
    /**
     * Logger instance for the processor. Should be initialized in the subclass constructor.
     * @protected
     */
    protected readonly logger: Logger;
    constructor();
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
    protected validateMessage(message: Message): void;
    /**
     * Log debug information
     * @param message Debug message
     * @param data Optional data to log
     * @protected
     */
    protected debug(message: string): void;
    /**
     * Log errors with enhanced context
     * @param error Error object or message
     * @param context Optional error context
     * @protected
     */
    protected logError(error: Error | string, context?: unknown): void;
}
//# sourceMappingURL=BaseProcessor.d.ts.map