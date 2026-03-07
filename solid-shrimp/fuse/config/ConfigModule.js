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
Object.defineProperty(exports, "__esModule", { value: true });
exports.loggerManager = exports.LoggerManager = exports.LRUCache = exports.TimeDelta = void 0;
const winston = __importStar(require("winston"));
const os = __importStar(require("os"));
import date_fns_1 from 'date-fns';
class TimeDelta {
    constructor(args = {}) {
        this.days = args.days || 0;
        this.seconds = args.seconds || 0;
        this.microseconds = args.microseconds || 0;
        if (args.milliseconds) {
            this.microseconds += args.milliseconds * 1000;
        }
        if (args.minutes) {
            this.seconds += args.minutes * 60;
        }
        if (args.hours) {
            this.seconds += args.hours * 3600;
        }
        if (args.weeks) {
            this.days += args.weeks * 7;
        }
        this.normalize();
    }
    normalize() {
        const extraSeconds = Math.floor(this.microseconds / 1000000);
        this.microseconds %= 1000000;
        this.seconds += extraSeconds;
        const extraDays = Math.floor(this.seconds / 86400);
        this.seconds %= 86400;
        this.days += extraDays;
    }
    toMilliseconds() {
        return (this.days * 86400000 +
            this.seconds * 1000 +
            Math.floor(this.microseconds / 1000));
    }
}
exports.TimeDelta = TimeDelta;
class LRUCache {
    constructor(maxSize) {
        this.cache = new Map();
        this.maxSize = maxSize;
    }
    get(key) {
        const item = this.cache.get(key);
        if (item) {
            item.timestamp = Date.now();
            return item.value;
        }
        return undefined;
    }
    set(key, value) {
        if (this.cache.size >= this.maxSize) {
            let oldestKey = null;
            let oldestTimestamp = Infinity;
            this.cache.forEach((value, key) => {
                if (value.timestamp < oldestTimestamp) {
                    oldestTimestamp = value.timestamp;
                    oldestKey = key;
                }
            });
            if (oldestKey) {
                this.cache.delete(oldestKey);
            }
        }
        this.cache.set(key, { value, timestamp: Date.now() });
    }
    clear() {
        this.cache.clear();
    }
    size() {
        return this.cache.size;
    }
}
exports.LRUCache = LRUCache;
class JsonFormatter {
    static transform(info) {
        const logRecord = Object.assign({}, info);
        logRecord.timestamp = (0, date_fns_1.format)(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
        logRecord.level = info.level;
        if (info.correlation_id) {
            logRecord.correlation_id = info.correlation_id;
        }
        if (info.component) {
            logRecord.component = info.component;
        }
        return logRecord;
    }
}
class LoggerManager {
    constructor() {
        this.defaultLogDir = 'logs';
        this.loggers = new Map();
    }
    static getInstance() {
        if (!LoggerManager.instance) {
            LoggerManager.instance = new LoggerManager();
        }
        return LoggerManager.instance;
    }
    createRotatingHandler(filename, maxBytes = 10485760, backupCount = 5) {
        os.mkdirSync(this.defaultLogDir, { recursive: true });
        return new winston.transports.File({
            filename: `${this.defaultLogDir}/${filename}`,
            maxsize: maxBytes,
            maxFiles: backupCount,
            format: winston.format.combine(winston.format.timestamp(), winston.format.json())
        });
    }
    createTimedHandler(filename, when = 'midnight', interval = 1, backupCount = 30) {
        os.mkdirSync(this.defaultLogDir, { recursive: true });
        return new winston.transports.File({
            filename: `${this.defaultLogDir}/${filename}`,
            format: winston.format.combine(winston.format.timestamp(), winston.format.json())
        });
    }
    getLogger(options) {
        if (this.loggers.has(options.name)) {
            return this.loggers.get(options.name);
        }
        const transports = [];
        if (options.enableConsole) {
            transports.push(new winston.transports.Console({
                format: winston.format.combine(winston.format.colorize(), winston.format.simple())
            }));
        }
        if (options.enableFile) {
            transports.push(this.createRotatingHandler(`${options.name}.log`));
        }
        const logger = winston.createLogger({
            level: options.level || 'info',
            format: winston.format.combine(winston.format(JsonFormatter.transform)(), winston.format.json()),
            defaultMeta: {
                component: options.component,
                correlation_id: options.correlationId
            },
            transports
        });
        this.loggers.set(options.name, logger);
        return logger;
    }
}
exports.LoggerManager = LoggerManager;
exports.loggerManager = LoggerManager.getInstance();
//# sourceMappingURL=ConfigModule.js.map