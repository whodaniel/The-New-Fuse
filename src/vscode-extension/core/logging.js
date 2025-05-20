"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.LogLevel = void 0;
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class Logger {
    constructor(config) {
        this.config = config;
        this.logToFile = false;
        this.logToFile = config.get('enableLogging', false);
    }
    static getInstance(config) {
        if (!Logger.instance && config) {
            Logger.instance = new Logger(config);
        }
        return Logger.instance;
    }
    log(level, message, ...args) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${LogLevel[level]}] ${message}`;
        switch (level) {
            case LogLevel.DEBUG:
                console.debug(logMessage, ...args);
                break;
            case LogLevel.INFO:
                console.info(logMessage, ...args);
                break;
            case LogLevel.WARN:
                console.warn(logMessage, ...args);
                break;
            case LogLevel.ERROR:
                console.error(logMessage, ...args);
                break;
        }
        if (this.logToFile) {
            this.writeToFile(logMessage, args);
        }
    }
    debug(message, ...args) {
        this.log(LogLevel.DEBUG, message, ...args);
    }
    info(message, ...args) {
        this.log(LogLevel.INFO, message, ...args);
    }
    warn(message, ...args) {
        this.log(LogLevel.WARN, message, ...args);
    }
    error(message, ...args) {
        this.log(LogLevel.ERROR, message, ...args);
    }
    async writeToFile(message, args) {
        // Implement file writing logic here if needed
        // For now just log to console
        console.log(`[FILE] ${message}`, ...args);
    }
    async rotateLogFiles(maxFiles = 5) {
        // Implement log rotation logic here if needed
    }
}
exports.Logger = Logger;
//# sourceMappingURL=logging.js.map