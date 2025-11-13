"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var LoggingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingService = void 0;
const common_1 = require("@nestjs/common");
const ConfigService_1 = require("../config/ConfigService");
const errors_1 = require("../utils/errors");
let LoggingService = LoggingService_1 = class LoggingService {
    configService;
    logger = new common_1.Logger(LoggingService_1.name);
    config;
    logEntries = [];
    maxMemoryLogs = 1000;
    constructor(configService) {
        this.configService = configService;
        this.initializeConfig();
    }
    initializeConfig() {
        this.config = {
            logLevel: this.configService.get('LOG_LEVEL', 'log'),
            enableConsole: this.configService.get('LOG_CONSOLE', true),
            enableFile: this.configService.get('LOG_FILE', false),
            logFilePath: this.configService.get('LOG_FILE_PATH', 'logs/app.log'),
            maxFileSize: this.configService.get('LOG_MAX_FILE_SIZE', 10485760), // 10MB
            maxFiles: this.configService.get('LOG_MAX_FILES', 5),
        };
    }
    log(message, context, metadata) {
        this.writeLog('log', message, context, metadata);
    }
    error(message, errorOrTrace, contextOrLegacyContext, metadata) {
        if (typeof errorOrTrace === 'string') {
            // Legacy signature: (message, trace, context) - deprecated
            this.writeLog('error', message, contextOrLegacyContext, undefined, new Error(errorOrTrace));
        }
        else {
            // New signature: (message, error?, context?, metadata?)
            this.writeLog('error', message, contextOrLegacyContext, metadata, errorOrTrace);
        }
    }
    warn(message, context, metadata) {
        this.writeLog('warn', message, context, metadata);
    }
    debug(message, context, metadata) {
        this.writeLog('debug', message, context, metadata);
    }
    verbose(message, context, metadata) {
        this.writeLog('verbose', message, context, metadata);
    }
    writeLog(level, message, context, metadata, error) {
        const logEntry = {
            timestamp: new Date(),
            level,
            message,
            context,
            metadata,
            error,
        };
        // Store in memory (circular buffer)
        if (this.logEntries.length >= this.maxMemoryLogs) {
            this.logEntries.shift();
        }
        this.logEntries.push(logEntry);
        // Console logging
        if (this.config.enableConsole && this.shouldLog(level)) {
            this.logToConsole(logEntry);
        }
        // File logging (placeholder for future implementation)
        if (this.config.enableFile) {
            this.logToFile(logEntry);
        }
    }
    shouldLog(level) {
        const levels = ['verbose', 'debug', 'log', 'warn', 'error'];
        const currentLevelIndex = levels.indexOf(this.config.logLevel);
        const messageLevelIndex = levels.indexOf(level);
        return messageLevelIndex >= currentLevelIndex;
    }
    logToConsole(entry) {
        const formattedMessage = this.formatLogEntry(entry);
        switch (entry.level) {
            case 'error':
                console.error(formattedMessage, entry.error || '');
                break;
            case 'warn':
                console.warn(formattedMessage);
                break;
            case 'debug':
                console.debug(formattedMessage);
                break;
            case 'verbose':
                console.debug(formattedMessage);
                break;
            default:
                console.log(formattedMessage);
        }
    }
    logToFile(entry) {
        // TODO: Implement file logging
        this.logger.debug(`File logging not implemented: ${this.formatLogEntry(entry)}`);
    }
    formatLogEntry(entry) {
        const timestamp = entry.timestamp.toISOString();
        const context = entry.context ? `[${entry.context}]` : '';
        const metadata = entry.metadata ? ` ${JSON.stringify(entry.metadata)}` : '';
        return `[${timestamp}] ${entry.level.toUpperCase()} ${context} ${entry.message}${metadata}`;
    }
    // Additional utility methods
    getRecentLogs(count = 100) {
        const startIndex = Math.max(0, this.logEntries.length - count);
        return this.logEntries.slice(startIndex);
    }
    getLogsByLevel(level) {
        return this.logEntries.filter(entry => entry.level === level);
    }
    getLogsByContext(context) {
        return this.logEntries.filter(entry => entry.context === context);
    }
    clearLogs() {
        this.logEntries = [];
    }
    getLogStatistics() {
        const stats = {};
        this.logEntries.forEach(entry => {
            stats[entry.level] = (stats[entry.level] || 0) + 1;
        });
        return stats;
    }
    // Performance logging
    logPerformance(operation, duration, context) {
        this.log(`Performance: ${operation} took ${duration}ms`, context || 'Performance');
    }
    // Error logging with additional context
    logError(error, context, metadata) {
        this.writeLog('error', error.message, context, metadata, error);
    }
    // Security logging
    logSecurity(event, userId, metadata) {
        this.writeLog('warn', `Security: ${event}`, 'Security', {
            userId,
            ...metadata,
        });
    }
    // Business logic logging
    logBusiness(event, data, context) {
        this.writeLog('log', `Business: ${event}`, context || 'Business', data);
    }
    /**
     * Safely log errors from unknown types using the getErrorMessage utility
     * Use this method when catching unknown error types in catch blocks
     * @param message - The error message
     * @param error - Unknown error type (will be safely converted)
     * @param context - Optional context/module name
     * @param metadata - Optional metadata object
     */
    logErrorSafe(message, error, context, metadata) {
        this.error(message, error instanceof Error ? error : new Error((0, errors_1.getErrorMessage)(error)), context, metadata);
    }
};
exports.LoggingService = LoggingService;
exports.LoggingService = LoggingService = LoggingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [ConfigService_1.ConfigService])
], LoggingService);
exports.default = LoggingService;
//# sourceMappingURL=LoggingService.js.map