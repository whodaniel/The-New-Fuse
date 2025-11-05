var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var LoggingService_1;
import { Injectable, Logger } from '@nestjs/common';
let LoggingService = LoggingService_1 = class LoggingService {
    logger = new Logger(LoggingService_1.name);
    context = {};
    /**
     * Set context for all subsequent log messages
     */
    setContext(context) {
        this.context = { ...this.context, ...context };
    }
    /**
     * Clear the current context
     */
    clearContext() {
        this.context = {};
    }
    /**
     * Get current context
     */
    getContext() {
        return { ...this.context };
    }
    /**
     * Log info message
     */
    log(message, context) {
        const mergedContext = { ...this.context, ...context };
        this.logger.log(message, mergedContext);
    }
    /**
     * Log error message
     */
    error(message, trace, context) {
        const mergedContext = { ...this.context, ...context };
        this.logger.error(message, trace, mergedContext);
    }
    /**
     * Log warning message
     */
    warn(message, context) {
        const mergedContext = { ...this.context, ...context };
        this.logger.warn(message, mergedContext);
    }
    /**
     * Log debug message
     */
    debug(message, context) {
        const mergedContext = { ...this.context, ...context };
        this.logger.debug(message, mergedContext);
    }
    /**
     * Log verbose message
     */
    verbose(message, context) {
        const mergedContext = { ...this.context, ...context };
        this.logger.verbose(message, mergedContext);
    }
    /**
     * Create a child logger with persistent context
     */
    createChildLogger(additionalContext) {
        const childLogger = new LoggingService_1();
        childLogger.setContext({ ...this.context, ...additionalContext });
        return childLogger;
    }
};
LoggingService = LoggingService_1 = __decorate([
    Injectable()
], LoggingService);
export { LoggingService };
//# sourceMappingURL=logging.service.js.map