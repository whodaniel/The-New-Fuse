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
exports.logger = exports.UnifiedLoggingService = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const types_1 = require("./types");
/**
 * Unified Logging Service for The New Fuse
 *
 * Provides consistent logging across all workspace packages.
 * Supports console output, file persistence, and metadata.
 */
class UnifiedLoggingService {
    config;
    logPath;
    constructor(config = {}) {
        this.config = { ...types_1.DEFAULT_LOG_CONFIG, ...config };
        this.logPath = path.join(this.config.workspaceDir || process.cwd(), this.config.logFileName || 'tnf.log');
    }
    async log(level, message, metadata) {
        if (this.getLogLevelNumber(level) < this.getLogLevelNumber(this.config.level)) {
            return;
        }
        const timestamp = new Date().toISOString();
        const metaString = metadata ? ` ${JSON.stringify(metadata)}` : '';
        const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}${metaString}\n`;
        if (this.config.enableConsole) {
            if (level === 'error') {
                process.stderr.write(logEntry);
            }
            else {
                process.stdout.write(logEntry);
            }
        }
        if (this.config.enableFile) {
            try {
                await fs.mkdir(path.dirname(this.logPath), { recursive: true });
                await fs.appendFile(this.logPath, logEntry);
            }
            catch (error) {
                process.stderr.write(`[Logging-Internal-Error] Failed to write to log file: ${error}\n`);
            }
        }
    }
    debug(message, metadata) {
        void this.log('debug', message, metadata);
    }
    info(message, metadata) {
        void this.log('info', message, metadata);
    }
    warn(message, metadata) {
        void this.log('warn', message, metadata);
    }
    error(message, metadata) {
        void this.log('error', message, metadata);
    }
    getLogLevelNumber(level) {
        const levels = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3,
        };
        return levels[level] ?? 1;
    }
}
exports.UnifiedLoggingService = UnifiedLoggingService;
/**
 * Global default logger instance
 */
exports.logger = new UnifiedLoggingService();
//# sourceMappingURL=UnifiedLoggingService.js.map