export {}
exports.setupLogging = setupLogging;
exports.getLogger = getLogger;
import fs from 'fs';
import path from 'path';
import winston from 'winston';
require("winston-daily-rotate-file");
const DEFAULT_CONFIG = {
    level: 'info',
    format: '${timestamp} - ${service} - ${level}: ${message}',
    file: 'logs/app.log',
    maxSize: 10 * 1024 * 1024,
    maxFiles: 5
};
function setupLogging(app, config = {}): any {
    const logConfig = Object.assign(Object.assign(Object.assign({}, DEFAULT_CONFIG), config), { level: (process.env.LOG_LEVEL || config.level || DEFAULT_CONFIG.level).toLowerCase(), format: process.env.LOG_FORMAT || config.format || DEFAULT_CONFIG.format, file: process.env.LOG_FILE || config.file || DEFAULT_CONFIG.file });
    const logDir = path.dirname(logConfig.file);
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }
    const logger = winston.createLogger({
        level: logConfig.level,
        format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
        defaultMeta: { service: 'app' },
        transports: [
            new winston.transports.Console({
                format: winston.format.combine(winston.format.colorize(), winston.format.printf(({ timestamp, level, message, service }) => {
                    return logConfig.format
                        .replace('${timestamp}', timestamp)
                        .replace('${service}', service)
                        .replace('${level}', level)
                        .replace('${message}', message);
                }))
            }),
            new winston.transports.DailyRotateFile({
                filename: logConfig.file,
                datePattern: 'YYYY-MM-DD',
                maxSize: logConfig.maxSize,
                maxFiles: logConfig.maxFiles,
                format: winston.format.combine(winston.format.timestamp(), winston.format.json())
            })
        ]
    });
    app.locals.logger = logger;
    logger.info(`Logging configured with level: ${logConfig.level}`);
}
function getLogger(app): any {
    return app.locals.logger;
}
export {};
//# sourceMappingURL=logging.js.map