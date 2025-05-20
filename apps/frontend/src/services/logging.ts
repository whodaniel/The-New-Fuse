export var LogLevel;
(function (LogLevel): any {
    LogLevel["DEBUG"] = "debug";
    LogLevel["INFO"] = "info";
    LogLevel["WARN"] = "warn";
    LogLevel["ERROR"] = "error";
})(LogLevel || (LogLevel = {}));
export class LoggingService {
    constructor() {
        this.logs = [];
        this.maxLogs = 1000;
        this.consoleEnabled = true;
    }
    static getInstance() {
        if (!LoggingService.instance) {
            LoggingService.instance = new LoggingService();
        }
        return LoggingService.instance;
    }
    createLogEntry(level, message, context, error) {
        return {
            timestamp: Date.now(),
            level,
            message,
            context,
            error
        };
    }
    addLog(entry) {
        this.logs.push(entry);
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }
        if (this.consoleEnabled) {
            const consoleMethod = this.getConsoleMethod(entry.level);
            if (entry.error) {
                consoleMethod(entry.message, entry.context, entry.error);
            }
            else if (entry.context) {
                consoleMethod(entry.message, entry.context);
            }
            else {
                consoleMethod(entry.message);
            }
        }
    }
    getConsoleMethod(level) {
        switch (level) {
            case LogLevel.DEBUG:
                return console.debug;
            case LogLevel.INFO:
                return console.info;
            case LogLevel.WARN:
                return console.warn;
            case LogLevel.ERROR:
                return console.error;
            default:
                return console.log;
        }
    }
    debug(message, context) {
        this.addLog(this.createLogEntry(LogLevel.DEBUG, message, context));
    }
    info(message, context) {
        this.addLog(this.createLogEntry(LogLevel.INFO, message, context));
    }
    warn(message, context) {
        this.addLog(this.createLogEntry(LogLevel.WARN, message, context));
    }
    error(message, error, context) {
        this.addLog(this.createLogEntry(LogLevel.ERROR, message, context, error));
    }
    getLogs() {
        return [...this.logs];
    }
    clearLogs() {
        this.logs = [];
    }
    setMaxLogs(max) {
        this.maxLogs = max;
        while (this.logs.length > max) {
            this.logs.shift();
        }
    }
    enableConsole() {
        this.consoleEnabled = true;
    }
    disableConsole() {
        this.consoleEnabled = false;
    }
    getLogsByLevel(level) {
        return this.logs.filter(log => log.level === level);
    }
    getRecentLogs(count) {
        return this.logs.slice(-count);
    }
}
//# sourceMappingURL=logging.js.map