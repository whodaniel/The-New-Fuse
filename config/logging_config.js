"use strict";
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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLogger = exports.LOG_LEVELS = void 0;
const winston = __importStar(require("winston"));
require("winston-daily-rotate-file");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
exports.LOG_LEVELS = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
    silly: 6
};
const createLogger = (config) => {
    if (!fs.existsSync(config.logDir)) {
        fs.mkdirSync(config.logDir, { recursive: true });
    }
    const detailedFormat = winston.format.combine(winston.format.timestamp(), winston.format.json(), winston.format.errors({ stack: true }), winston.format.metadata(), winston.format.printf((info) => {
        const { timestamp, level, message } = info, metadata = __rest(info, ["timestamp", "level", "message"]);
        return JSON.stringify({
            timestamp,
            level,
            message,
            metadata
        });
    }));
    const consoleFormat = winston.format.combine(winston.format.colorize(), winston.format.simple());
    const transports = [
        new winston.transports.Console({
            level: config.level,
            format: consoleFormat
        }),
        new winston.transports.DailyRotateFile({
            filename: path.join(config.logDir, 'app-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '10m',
            maxFiles: '7d',
            format: detailedFormat
        }),
        new winston.transports.DailyRotateFile({
            filename: path.join(config.logDir, 'error-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '10m',
            maxFiles: '30d',
            level: 'error',
            format: detailedFormat
        })
    ];
    const logger = winston.createLogger({
        level: config.level,
        levels: exports.LOG_LEVELS,
        defaultMeta: {
            service: config.service
        },
        transports
    });
    return logger;
};
exports.createLogger = createLogger;
winston.addColors({
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    verbose: 'cyan',
    debug: 'blue',
    silly: 'gray'
});
//# sourceMappingURL=logging_config.js.map