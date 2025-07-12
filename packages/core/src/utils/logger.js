import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';
var LogLevel;
(function (LogLevel) {
    LogLevel["TRACE"] = "trace";
    LogLevel["DEBUG"] = "debug";
    LogLevel["INFO"] = "info";
    LogLevel["WARN"] = "warn";
    LogLevel["ERROR"] = "error";
    LogLevel["FATAL"] = "fatal";
})(LogLevel || (LogLevel = {}));
export class Logger extends EventEmitter {
    filePath = null;
    consoleOutput;
    level;
    constructor(options) {
        super();
        this.filePath = options?.filePath || null;
        this.consoleOutput = options?.consoleOutput ?? true;
        this.level = options?.level || LogLevel.INFO;
        if (this.filePath) {
            const logDir = path.dirname(this.filePath);
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir, { recursive: true });
            }
        }
    }
    log(level, message, ...args) {
        if (this.shouldLog(level)) {
            const timestamp = new Date().toISOString();
            const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
            if (this.consoleOutput) {
                console.log(logMessage, ...args);
            }
            if (this.filePath) {
                fs.appendFileSync(this.filePath, `${logMessage}\n`);
            }
            this.emit('log', { level, message: logMessage, args });
        }
    }
    shouldLog(level) {
        const levels = [LogLevel.TRACE, LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL];
        return levels.indexOf(level) >= levels.indexOf(this.level);
    }
    trace(message, ...args) {
        this.log(LogLevel.TRACE, message, ...args);
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
    fatal(message, ...args) {
        this.log(LogLevel.FATAL, message, ...args);
    }
}
export const newLogger = (name, options) => new Logger(options);
