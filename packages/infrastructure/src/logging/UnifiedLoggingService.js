import * as fs from 'fs/promises';
import * as path from 'path';
import { DEFAULT_LOG_CONFIG } from './types.js';
/**
 * Unified Logging Service for The New Fuse
 *
 * Provides consistent logging across all workspace packages.
 * Supports console output, file persistence, and metadata.
 */
export class UnifiedLoggingService {
    constructor(config = {}) {
        this.config = { ...DEFAULT_LOG_CONFIG, ...config };
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
/**
 * Global default logger instance
 */
export const logger = new UnifiedLoggingService();
//# sourceMappingURL=UnifiedLoggingService.js.map