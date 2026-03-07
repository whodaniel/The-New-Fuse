/**
 * Browser-compatible logging utilities
 *
 * NOTE: This file was rewritten to remove Node.js-only dependencies (winston, fs, path)
 * that were causing the React app to crash in the browser.
 *
 * For actual logging, use:
 * - LoggingService from '../services/logging' (browser-compatible singleton)
 * - Logger from './logger' (browser-compatible structured logger)
 */

export interface LoggingConfig {
  level: string;
  format: string;
  file?: string;
  maxSize?: number;
  maxFiles?: number;
}

const DEFAULT_CONFIG: LoggingConfig = {
  level: 'info',
  format: '${timestamp} - ${service} - ${level}: ${message}',
};

/**
 * Browser-compatible setup function
 * In browser context, this is a no-op since we use console logging
 */
export function setupLogging(_app: any, config: Partial<LoggingConfig> = {}): void {
  const logConfig = { ...DEFAULT_CONFIG, ...config };
  console.info(`[Logging] Configured with level: ${logConfig.level}`);
}

/**
 * Browser-compatible logger getter
 * Returns a console-based logger
 */
export function getLogger(_app?: any): Console {
  return console;
}

// Export empty object for compatibility with any destructuring imports
export default {};
