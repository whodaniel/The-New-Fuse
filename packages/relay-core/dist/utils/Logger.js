"use strict";
/**
 * Logger for The New Fuse Relay System
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
class Logger {
    constructor(logLevel, workspaceDir) {
        this.logLevel = logLevel;
        this.workspaceDir = workspaceDir;
        this.logPath = path.join(this.workspaceDir, 'relay.log');
    }
    async log(level, message) {
        if (this.getLogLevelNumber(level) < this.getLogLevelNumber(this.logLevel)) {
            return;
        }
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
        process.stdout.write(logEntry);
        try {
            // Ensure the directory exists before writing
            await fs.mkdir(this.workspaceDir, { recursive: true });
            await fs.appendFile(this.logPath, logEntry);
        }
        catch (error) {
            process.stderr.write(`Logging error: ${error}\n`);
        }
    }
    debug(message) {
        this.log('debug', message);
    }
    info(message) {
        this.log('info', message);
    }
    warn(message) {
        this.log('warn', message);
    }
    error(message) {
        this.log('error', message);
    }
    getLogLevelNumber(level) {
        switch (level) {
            case 'debug':
                return 0;
            case 'info':
                return 1;
            case 'warn':
                return 2;
            case 'error':
                return 3;
            default:
                return 1;
        }
    }
}
exports.Logger = Logger;
//# sourceMappingURL=Logger.js.map