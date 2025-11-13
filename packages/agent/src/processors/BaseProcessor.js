"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseProcessor = void 0;
/**
 * Abstract base class for message processors.
 * Defines a common interface for processing messages.
 */
class BaseProcessor {
    /**
     * Logger instance for the processor. Should be initialized in the subclass constructor.
     * @protected
     */
    logger;
    constructor() {
        if (this.constructor === BaseProcessor) {
            throw new Error("Abstract classes can't be instantiated.");
        }
    }
    /**
     * Validates a message before processing
     * @param message The message to validate
     * @throws Error if message is invalid
     * @protected
     */
    validateMessage(message) {
        if (!message) {
            throw new Error('Message cannot be null or undefined');
        }
        if (!message.type) {
            throw new Error('Message must have a type');
        }
        if (typeof message.content === 'undefined') {
            throw new Error('Message must have content');
        }
    }
    /**
     * Log debug information
     * @param message Debug message
     * @param data Optional data to log
     * @protected
     */
    debug(message) {
        this.logger.debug(message);
    }
    /**
     * Log errors with enhanced context
     * @param error Error object or message
     * @param context Optional error context
     * @protected
     */
    logError(error, context) {
        if (error instanceof Error) {
            const errorMessage = context ? `${error.message} - Context: ${JSON.stringify(context)} : error.message;
      this.logger.error(errorMessage);
    } else {`
                :
            ;
            const errorMessage = context ? $ : , { error };
            ` - Context: ${JSON.stringify(context)}` ` : error;
      this.logger.error(errorMessage);
    }
  }
}
            ;
        }
    }
}
exports.BaseProcessor = BaseProcessor;
//# sourceMappingURL=BaseProcessor.js.map