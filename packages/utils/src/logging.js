import { createLogger, format, transports } from 'winston';
const { combine, timestamp, printf, colorize, errors, label } = format;
export var LogLevel;
(function (LogLevel) {
    LogLevel["error"] = "error";
    LogLevel["warn"] = "warn";
    LogLevel["info"] = "info";
    LogLevel["http"] = "http";
    LogLevel["verbose"] = "verbose";
    LogLevel["debug"] = "debug";
    LogLevel["silly"] = "silly"; // Add the missing initializer
})(LogLevel || (LogLevel = {}));
const customFormat = printf((info) => {
    const { level, message, timestamp, duration, component, traceId, ...metadata } = info;
    let log = `${timestamp} [${level.toUpperCase()}]`;
    if (component)
        log += ` [${component}]`;
    if (traceId)
        log += ` (${traceId})`;
    log += `: ${message}`;
    if (duration)
        log += ` (${duration}ms)`;
    if (Object.keys(metadata).length > 0) {
        log += ` ${JSON.stringify(metadata)}`;
    }
    return log;
});
const logger = createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(colorize(), label({ label: 'app' }), timestamp(), errors({ stack: true }), customFormat),
    transports: [
        new transports.Console({})
    ]
});
function createLoggerInstance(component) {
    return logger.child({ component });
}
function createCustomLogger(name) {
    return createLogger({
        level: process.env.LOG_LEVEL || 'info',
        format: combine(colorize(), label({ label: name }), timestamp(), customFormat),
        transports: [
            new transports.Console({})
        ]
    });
}
export class CustomLogger {
    logger;
    constructor(options = {}) {
        this.logger = createLogger({
            level: options.level || 'info',
            format: combine(timestamp(), customFormat),
            defaultMeta: options.component ? { component: options.component } : {},
            transports: [
                new transports.Console()
            ]
        });
    }
    info(message, meta = {}) {
        this.logger.info(message, meta);
    }
    warn(message, meta = {}) {
        this.logger.warn(message, meta);
    }
    error(message, error) {
        const meta = {};
        if (error instanceof Error) {
            meta.error = {
                message: error.message,
                stack: error.stack
            };
        }
        else if (error) {
            meta.error = error;
        }
        this.logger.error(message, meta);
    }
    debug(message, meta = {}) {
        this.logger.debug(message, meta);
    }
}
export { logger, createLoggerInstance as createLogger, createCustomLogger };
// Add uncaught exception and unhandled rejection handlers
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Promise Rejection:', reason);
});
//# sourceMappingURL=logging.js.map