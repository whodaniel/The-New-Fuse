"use strict";
/**
 * Redis Logger
 *
 * This module provides logging functionality for the Redis implementation.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisServiceLogger = exports.redisClientLogger = exports.redisLogger = exports.LogLevel = void 0;
exports.createLogger = createLogger;
const winston_1 = __importDefault(require("winston"));
require("winston-daily-rotate-file");
const fs = __importStar(require("fs"));
/**
 * Log levels
 */
var LogLevel;
(function (LogLevel) {
    LogLevel["ERROR"] = "error";
    LogLevel["WARN"] = "warn";
    LogLevel["INFO"] = "info";
    LogLevel["DEBUG"] = "debug";
    LogLevel["VERBOSE"] = "verbose";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
/**
 * Default logger configuration
 */
const DEFAULT_CONFIG = {
    level: LogLevel.INFO,
    console: {
        enabled: true,
        level: LogLevel.INFO,
        colorize: true,
    },
    file: {
        enabled: true,
        level: LogLevel.INFO,
        path: 'logs/redis',
        maxSize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
    },
};
/**
 * Create a logger instance
 */
function createLogger(name, config = {}) {
    // Merge with default config
    const mergedConfig = {
        level: config.level || DEFAULT_CONFIG.level,
        console: {
            enabled: config.console?.enabled !== undefined ? config.console.enabled : DEFAULT_CONFIG.console?.enabled,
            level: config.console?.level || DEFAULT_CONFIG.console?.level,
            colorize: config.console?.colorize !== undefined ? config.console.colorize : DEFAULT_CONFIG.console?.colorize,
        },
        file: {
            enabled: config.file?.enabled !== undefined ? config.file.enabled : DEFAULT_CONFIG.file?.enabled,
            level: config.file?.level || DEFAULT_CONFIG.file?.level,
            path: config.file?.path || DEFAULT_CONFIG.file?.path,
            maxSize: config.file?.maxSize || DEFAULT_CONFIG.file?.maxSize,
            maxFiles: config.file?.maxFiles || DEFAULT_CONFIG.file?.maxFiles,
        },
    };
    // Create transports array
    const transports = [];
    // Add console transport
    if (mergedConfig.console?.enabled) {
        transports.push(new winston_1.default.transports.Console({
            level: mergedConfig.console.level,
            format: winston_1.default.format.combine(winston_1.default.format.colorize({ all: mergedConfig.console.colorize }), winston_1.default.format.timestamp(), winston_1.default.format.printf(({ timestamp, level, message, ...meta }) => {
                return `${timestamp} [${level}] [${name}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
            })),
        }));
    }
    // Add file transport
    if (mergedConfig.file?.enabled) {
        // Ensure log directory exists
        const logDir = mergedConfig.file.path || 'logs/redis';
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        // Create daily rotate file transport
        transports.push(new winston_1.default.transports.DailyRotateFile({
            level: mergedConfig.file.level,
            dirname: logDir,
            filename: `${name}-%DATE%.log`,
            datePattern: 'YYYY-MM-DD',
            maxSize: mergedConfig.file.maxSize,
            maxFiles: mergedConfig.file.maxFiles,
            format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json()),
        }));
    }
    // Create logger
    return winston_1.default.createLogger({
        level: mergedConfig.level,
        defaultMeta: { service: name },
        transports,
    });
}
// Create Redis logger instance
exports.redisLogger = createLogger('redis');
// Create Redis client logger instance
exports.redisClientLogger = createLogger('redis-client');
// Create Redis service logger instance
exports.redisServiceLogger = createLogger('redis-service');
// Export default logger
exports.default = exports.redisLogger;
//# sourceMappingURL=logger.js.map