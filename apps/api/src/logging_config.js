"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupLogging = setupLogging;
const winston_1 = require("winston");
require("winston-daily-rotate-file");
function setupLogging() {
    return (0, winston_1.createLogger)({
        level: 'info',
        format: winston_1.format.combine(winston_1.format.timestamp(), winston_1.format.json()),
        transports: [
            new winston_1.transports.Console({
                format: winston_1.format.combine(winston_1.format.colorize(), winston_1.format.simple())
            }),
            new winston_1.transports.DailyRotateFile({
                filename: 'logs/application-%DATE%.log',
                datePattern: 'YYYY-MM-DD',
                zippedArchive: true,
                maxSize: '20m',
                maxFiles: '14d'
            })
        ]
    });
}
