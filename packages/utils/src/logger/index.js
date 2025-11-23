// Use properly typed declaration for importDefault
var __importDefault = function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.logger = exports.createCustomLogger = void 0;
const winston_1 = __importDefault(require("winston"));
const { format, transports } = winston_1.default;
const { combine, timestamp, label, printf, colorize } = format;
import { createLogger, format as winstonFormat } from 'winston';
const { printf: _winstonPrintf, combine: winstonCombine, timestamp: winstonTimestamp } = winstonFormat;
const logFormat = printf(({ level, message, label, timestamp }) => {
    const formattedLabel = label ? ` [${label}]` : '';
    return `${timestamp}${formattedLabel} ${level}: ${message}`;
});
function createCustomLogger(name) {
    return winston_1.default.createLogger({
        level: process.env.LOG_LEVEL || 'info',
        format: combine(colorize(), label({ label: name }), timestamp(), logFormat),
        transports: [
            new transports.Console({}),
        ],
    });
}
exports.createCustomLogger = createCustomLogger;
exports.logger = createCustomLogger('app');
// Renamed to avoid conflict with the other createLogger
export const createWinstonLogger = (options) => {
    return createLogger({
        format: winstonCombine(winstonTimestamp(), logFormat),
        ...options
    });
};
import winston from 'winston';
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
export class Logger {
    constructor(config = {}) {
        this.logger = winston.createLogger({
            level: config.level || LogLevel.INFO,
            format: config.format || winston.format.combine(winston.format.timestamp(), winston.format.json()),
            transports: config.transports || [
                new winston.transports.Console()
            ]
        });
    }
    error(message, error) {
        const meta = error instanceof Error ?
            { error: { message: error.message, stack: error.stack } } :
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
    return new Logger(config);
};
// Single default export
export default createCustomizedLogger;
//# sourceMappingURL=index.js.map