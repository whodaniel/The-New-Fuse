import * as fs from 'fs';
import * as path from 'path';
import { Logger } from './logger.js';
export class LoggingUtils {
    static { this.logDirectory = path.join(process.cwd(), 'logs'); }
    static { this.logFileName = 'application.log'; }
    static { this.logger = new Logger('LoggingUtils'); }
    static initialize() {
        if (!fs.existsSync(LoggingUtils.logDirectory)) {
            fs.mkdirSync(LoggingUtils.logDirectory, { recursive: true });
        }
        LoggingUtils.logger.info('LoggingUtils initialized.');
    }
    static async writeLog(entry) {
        const logLine = `${entry.timestamp.toISOString()} [${entry.level.toUpperCase()}] ${entry.message} ${entry.metadata ? JSON.stringify(entry.metadata) : ''}\n`;
        try {
            await fs.promises.appendFile(path.join(LoggingUtils.logDirectory, LoggingUtils.logFileName), logLine);
        }
        catch (error) {
            console.error('Failed to write log entry:', error);
        }
    }
    static async readLogs() {
        try {
            return await fs.promises.readFile(path.join(LoggingUtils.logDirectory, LoggingUtils.logFileName), 'utf8');
        }
        catch (error) {
            console.error('Failed to read logs:', error);
            return '';
        }
    }
    static async clearLogs() {
        try {
            await fs.promises.writeFile(path.join(LoggingUtils.logDirectory, LoggingUtils.logFileName), '');
            LoggingUtils.logger.info('Logs cleared.');
        }
        catch (error) {
            console.error('Failed to clear logs:', error);
        }
    }
}
//# sourceMappingURL=LoggingUtils.js.map