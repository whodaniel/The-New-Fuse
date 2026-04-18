/**
 * Logger for The New Fuse Relay System
 */
import * as fs from 'fs/promises';
import * as path from 'path';
export class Logger {
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
//# sourceMappingURL=Logger.js.map