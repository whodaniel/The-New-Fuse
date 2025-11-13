/**
 * Simple Logger utility for MCP Core
 */
export class Logger {
    component;
    logLevel;
    constructor(component = 'MCP', logLevel = 'info') {
        this.component = component;
        this.logLevel = logLevel;
    }
    debug(message, data) {
        if (this.shouldLog('debug')) {
            this.log('debug', message, data);
        }
    }
    info(message, data) {
        if (this.shouldLog('info')) {
            this.log('info', message, data);
        }
    }
    warn(message, data) {
        if (this.shouldLog('warn')) {
            this.log('warn', message, data);
        }
    }
    error(message, data) {
        if (this.shouldLog('error')) {
            this.log('error', message, data);
        }
    }
    shouldLog(level) {
        const levels = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3
        };
        return levels[level] >= levels[this.logLevel];
    }
    log(level, message, data) {
        const entry = {
            timestamp: new Date(),
            level,
            message,
            data,
            component: this.component
        };
        const logMessage = `[${entry.timestamp.toISOString()}] [${level.toUpperCase()}] [${this.component}] ${message}`;
        if (data) {
            console.log(logMessage, data);
        }
        else {
            console.log(logMessage);
        }
    }
    setLogLevel(level) {
        this.logLevel = level;
    }
    getLogLevel() {
        return this.logLevel;
    }
}
//# sourceMappingURL=Logger.js.map