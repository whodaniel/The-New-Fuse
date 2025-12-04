var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
export var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "debug";
    LogLevel["INFO"] = "info";
    LogLevel["WARN"] = "warn";
    LogLevel["ERROR"] = "error";
})(LogLevel || (LogLevel = {}));
var LoggingService = /** @class */ (function () {
    function LoggingService() {
        this.logs = [];
        this.maxLogs = 1000;
        this.consoleEnabled = true;
    }
    LoggingService.getInstance = function () {
        if (!LoggingService.instance) {
            LoggingService.instance = new LoggingService();
        }
        return LoggingService.instance;
    };
    LoggingService.prototype.createLogEntry = function (level, message, context, error) {
        return {
            timestamp: Date.now(),
            level: level,
            message: message,
            context: context,
            error: error
        };
    };
    LoggingService.prototype.addLog = function (entry) {
        this.logs.push(entry);
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }
        if (this.consoleEnabled) {
            var consoleMethod = this.getConsoleMethod(entry.level);
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
    };
    LoggingService.prototype.getConsoleMethod = function (level) {
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
    };
    LoggingService.prototype.debug = function (message, context) {
        this.addLog(this.createLogEntry(LogLevel.DEBUG, message, context));
    };
    LoggingService.prototype.info = function (message, context) {
        this.addLog(this.createLogEntry(LogLevel.INFO, message, context));
    };
    LoggingService.prototype.warn = function (message, context) {
        this.addLog(this.createLogEntry(LogLevel.WARN, message, context));
    };
    LoggingService.prototype.error = function (message, error, context) {
        this.addLog(this.createLogEntry(LogLevel.ERROR, message, context, error));
    };
    LoggingService.prototype.getLogs = function () {
        return __spreadArray([], this.logs, true);
    };
    LoggingService.prototype.clearLogs = function () {
        this.logs = [];
    };
    LoggingService.prototype.setMaxLogs = function (max) {
        this.maxLogs = max;
        while (this.logs.length > max) {
            this.logs.shift();
        }
    };
    LoggingService.prototype.enableConsole = function () {
        this.consoleEnabled = true;
    };
    LoggingService.prototype.disableConsole = function () {
        this.consoleEnabled = false;
    };
    LoggingService.prototype.getLogsByLevel = function (level) {
        return this.logs.filter(function (log) { return log.level === level; });
    };
    LoggingService.prototype.getRecentLogs = function (count) {
        return this.logs.slice(-count);
    };
    return LoggingService;
}());
export { LoggingService };
