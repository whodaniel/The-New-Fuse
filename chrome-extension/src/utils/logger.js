/**
 * Shared Logger for The New Fuse Chrome Extension
 * Provides a consistent logging mechanism across the extension.
 */
class Logger {
  constructor(name) {
    this.name = name;
  }

  /**
   * Logs an informational message.
   * @param {string} message - The message to log.
   * @param {any} [data] - Optional data to include.
   */
  info(message, data) {
    this.log('INFO', message, data);
  }

  /**
   * Logs a warning message.
   * @param {string} message - The message to log.
   * @param {any} [data] - Optional data to include.
   */
  warn(message, data) {
    this.log('WARN', message, data);
  }

  /**
   * Logs an error message.
   * @param {string} message - The message to log.
   * @param {any} [data] - Optional data to include.
   */
  error(message, data) {
    this.log('ERROR', message, data);
  }

  /**
   * Core logging function.
   * @param {string} level - The log level (INFO, WARN, ERROR).
   * @param {string} message - The message to log.
   * @param {any} [data] - Optional data to include.
   */
  log(level, message, data) {
    const logEntry = `[${this.name}] [${level}] ${message}`;

    const logMethod = level === 'ERROR' ? console.error : (level === 'WARN' ? console.warn : console.log);

    if (data) {
      logMethod(logEntry, data);
    } else {
      logMethod(logEntry);
    }
  }
}

// Export an instance for easy use, or the class for custom naming.
// Example usage: import logger from './logger.js'; logger.info('Hello');
// Or: import { Logger } from './logger.js'; const myLogger = new Logger('MyComponent');
export default new Logger('TheNewFuse');
export { Logger };
