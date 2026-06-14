"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupLogging = setupLogging;
const winston_1 = require("winston");
require("winston-daily-rotate-file");
function setupLogging() {
    const isProduction = process.env.NODE_ENV === 'production' || process.env.CLOUD_RUNTIME_ENVIRONMENT;
    const loggerTransports = [
        new winston_1.transports.Console({
            format: winston_1.format.combine(winston_1.format.colorize(), winston_1.format.simple()),
        }),
    ];
    // Only use file logging in non-production environments
    // In production (CloudRuntime, etc.), logs should go to stdout for platform log aggregation
    if (!isProduction) {
        loggerTransports.push(new winston_1.transports.DailyRotateFile({
            filename: 'logs/application-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d',
        }));
    }
    return (0, winston_1.createLogger)({
        level: process.env.LOG_LEVEL || 'info',
        format: winston_1.format.combine(winston_1.format.timestamp(), winston_1.format.json()),
        transports: loggerTransports,
    });
}
//# sourceMappingURL=logging_config.js.map