"use strict";
/**
 * Simple logger utility for core error handling
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
/**
 * Simple logger implementation
 */
class Logger {
    component;
    minLevel;
    static levelPriority = {
        debug: 0,
        info: 1,
        warn: 2,
        error: 3
    };
    constructor(component, minLevel = 'info') {
        this.component = component;
        this.minLevel = minLevel;
    }
    debug(message, data) {
        this.log('debug', message, data);
    }
    info(message, data) {
        this.log('info', message, data);
    }
    warn(message, data) {
        this.log('warn', message, data);
    }
    error(message, data) {
        this.log('error', message, data);
    }
    log(level, message, data) {
        if (Logger.levelPriority[level] < Logger.levelPriority[this.minLevel]) {
            return;
        }
        const entry = {
            timestamp: new Date(),
            level,
            component: this.component,
            message,
            data
        };
        const logMessage = this.formatLogEntry(entry);
        switch (level) {
            case 'debug':
                console.debug(logMessage);
                break;
            case 'info':
                console.info(logMessage);
                break;
            case 'warn':
                console.warn(logMessage);
                break;
            case 'error':
                console.error(logMessage);
                break;
        }
    }
    formatLogEntry(entry) {
        const timestamp = entry.timestamp.toISOString();
        const level = entry.level.toUpperCase().padEnd(5);
        const component = entry.component.padEnd(20);
        let message = `${timestamp} [${level}] ${component} ${entry.message}`;
        if (entry.data !== undefined) {
            try {
                message += ` ${JSON.stringify(entry.data)}`;
            }
            catch {
                message += ` ${String(entry.data)}`;
            }
        }
        return message;
    }
}
exports.Logger = Logger;
//# sourceMappingURL=Logger.js.map