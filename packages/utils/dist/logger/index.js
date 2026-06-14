import { createLogger, format as winstonFormat, transports } from 'winston';
const { combine, timestamp, label, printf, colorize, errors, json } = winstonFormat;
export var LogLevel;
(function (LogLevel) {
    LogLevel["ERROR"] = "error";
    LogLevel["WARN"] = "warn";
    LogLevel["INFO"] = "info";
    LogLevel["HTTP"] = "http";
    LogLevel["VERBOSE"] = "verbose";
    LogLevel["DEBUG"] = "debug";
    LogLevel["SILLY"] = "silly";
})(LogLevel || (LogLevel = {}));
const logFormat = printf(({ level, message, label, timestamp, stack }) => {
    const formattedLabel = label ? ` [${label}]` : '';
    const errorStack = stack ? `\n${stack}` : '';
    return `${timestamp}${formattedLabel} ${level}: ${message}${errorStack}`;
});
export function createCustomLogger(name) {
    return createLogger({
        level: process.env.LOG_LEVEL || 'info',
        format: combine(colorize(), label({ label: name }), timestamp(), errors({ stack: true }), logFormat),
        transports: [
            new transports.Console({}),
        ],
    });
}
export const logger = createCustomLogger('app');
export const createWinstonLogger = (options) => {
    return createLogger({
        format: combine(timestamp(), errors({ stack: true }), logFormat),
        ...options
    });
};
export class LoggerWrapper {
    constructor(config = {}) {
        this.logger = createLogger({
            level: config.level || LogLevel.INFO,
            format: config.format || combine(timestamp(), errors({ stack: true }), json()),
            transports: config.transports || [
                new transports.Console()
            ]
        });
    }
    error(message, error) {
        const meta = error instanceof Error ?
            { error: { message: error.message, stack: error.stack }, stack: error.stack } :
            { error };
        this.logger.error(message, meta);
    }
    warn(message, meta) {
        this.logger.warn(message, meta);
    }
    info(message, meta) {
        this.logger.info(message, meta);
    }
    http(message, meta) {
        this.logger.http(message, meta);
    }
    verbose(message, meta) {
        this.logger.verbose(message, meta);
    }
    debug(message, meta) {
        this.logger.debug(message, meta);
    }
    silly(message, meta) {
        this.logger.silly(message, meta);
    }
}
export const createCustomizedLogger = (config) => {
    return new LoggerWrapper(config);
};
export default createCustomizedLogger;
//# sourceMappingURL=index.js.map