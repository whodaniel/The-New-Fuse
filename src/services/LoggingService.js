export var LogLevel;
(function (LogLevel) {
    LogLevel["ERROR"] = "error";
    LogLevel["WARN"] = "warn";
    LogLevel["INFO"] = "info";
    LogLevel["DEBUG"] = "debug";
})(LogLevel || (LogLevel = {}));
export class LoggingService {
    serviceName;
    constructor(serviceName) {
        this.serviceName = serviceName;
    }
    info(message, context = {}) {
        this.log(LogLevel.INFO, message, context);
    }
    warn(message, context = {}) {
        this.log(LogLevel.WARN, message, context);
    }
    error(message, context = {}) {
        this.log(LogLevel.ERROR, message, context);
    }
    debug(message, context = {}) {
        this.log(LogLevel.DEBUG, message, context);
    }
    log(level, message, context = {}) {
        const timestamp = context.timestamp || new Date();
        const logEntry = {
            timestamp,
            level,
            service: this.serviceName,
            message,
            ...context
        };
        // In a real implementation, this would use an appropriate logging backend
        const consoleMethodMap = {
            [LogLevel.INFO]: console.info,
            [LogLevel.WARN]: console.warn,
            [LogLevel.ERROR]: console.error,
            [LogLevel.DEBUG]: console.debug,
        };
        const logFn = consoleMethodMap[level] || console.log;
        logFn(JSON.stringify(logEntry));
    }
}
