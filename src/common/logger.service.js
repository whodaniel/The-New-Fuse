"use strict";
/**
 * Simple Logger Service for MCP Server
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
class Logger {
    context;
    constructor(context) {
        this.context = context || 'Logger';
    }
    formatMessage(level, message, ...args) {
        const timestamp = new Date().toISOString();
        const contextStr = this.context ? `[${this.context}] ` : '';
        const argsStr = args.length > 0 ? ` ${args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ')}` : '';
        return `${timestamp} [${level}] ${contextStr}${message}${argsStr}`;
    }
    log(message, ...args) {
        console.log(this.formatMessage('LOG', message, ...args));
    }
    error(message, ...args) {
        console.error(this.formatMessage('ERROR', message, ...args));
    }
    warn(message, ...args) {
        console.warn(this.formatMessage('WARN', message, ...args));
    }
    debug(message, ...args) {
        console.debug(this.formatMessage('DEBUG', message, ...args));
    }
    verbose(message, ...args) {
        console.log(this.formatMessage('VERBOSE', message, ...args));
    }
    setContext(context) {
        this.context = context;
    }
}
exports.Logger = Logger;
//# sourceMappingURL=logger.service.js.map