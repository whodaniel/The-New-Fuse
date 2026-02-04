"use strict";
/**
 * Simple Logger wrapper for the agent package
 * Provides a consistent logging interface with context support
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.Logger = exports.LOG_LEVELS = void 0;
exports.LOG_LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
};
class Logger {
    context;
    level;
    constructor(context = 'Agent') {
        this.context = context;
        this.level = this.getLogLevelFromEnv();
    }
    getLogLevelFromEnv() {
        const envLevel = process.env.LOG_LEVEL?.toUpperCase();
        switch (envLevel) {
            case 'ERROR':
                return exports.LOG_LEVELS.ERROR;
            case 'WARN':
                return exports.LOG_LEVELS.WARN;
            case 'INFO':
                return exports.LOG_LEVELS.INFO;
            case 'DEBUG':
                return exports.LOG_LEVELS.DEBUG;
            default:
                return exports.LOG_LEVELS.INFO;
        }
    }
    formatMessage(level, message, errorOrContext, context) {
        const timestamp = new Date().toISOString();
        let errorStr = '';
        let contextStr = '';
        if (errorOrContext instanceof Error) {
            errorStr = ` - Error: ${errorOrContext.message}`;
            contextStr = context ? ` ${JSON.stringify(context)}` : '';
        }
        else if (errorOrContext) {
            contextStr = ` ${JSON.stringify(errorOrContext)}`;
        }
        return `${timestamp} [${level}] [${this.context}]: ${message}${errorStr}${contextStr}`;
    }
    shouldLog(level) {
        return level <= this.level;
    }
    error(message, errorOrContext, context) {
        if (this.shouldLog(exports.LOG_LEVELS.ERROR)) {
            console.error(this.formatMessage('ERROR', message, errorOrContext, context));
        }
    }
    warn(message, errorOrContext, context) {
        if (this.shouldLog(exports.LOG_LEVELS.WARN)) {
            console.warn(this.formatMessage('WARN', message, errorOrContext, context));
        }
    }
    info(message, context) {
        if (this.shouldLog(exports.LOG_LEVELS.INFO)) {
            console.info(this.formatMessage('INFO', message, context));
        }
    }
    debug(message, errorOrContext, context) {
        if (this.shouldLog(exports.LOG_LEVELS.DEBUG)) {
            console.debug(this.formatMessage('DEBUG', message, errorOrContext, context));
        }
    }
    log(message, context) {
        this.info(message, context);
    }
    setContext(context) {
        this.context = context;
    }
    getContext() {
        return this.context;
    }
}
exports.Logger = Logger;
// Default logger instance
exports.logger = new Logger('Core');
//# sourceMappingURL=logger.js.map