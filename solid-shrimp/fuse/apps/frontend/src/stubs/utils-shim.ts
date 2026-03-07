/**
 * Browser-safe shim for @the-new-fuse/utils
 *
 * This file provides browser-compatible exports that match the @the-new-fuse/utils package
 * but excludes Node.js-only modules (logging with winston).
 *
 * It's used via Vite alias to prevent Node.js code from being bundled in the browser.
 */

// Re-export cn utility (browser-compatible)
export { cn } from '../utils/cn';

// Re-export other browser-compatible utilities as needed
// Add more exports here as the frontend needs them

// Provide stub for logging to prevent import errors
export const LogLevel = {
  error: 'error',
  warn: 'warn',
  info: 'info',
  http: 'http',
  verbose: 'verbose',
  debug: 'debug',
  silly: 'silly',
} as const;

export const logger = {
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
  debug: console.debug.bind(console),
  verbose: console.log.bind(console),
  http: console.log.bind(console),
  silly: console.log.bind(console),
};

export function createLogger(component?: string) {
  return {
    info: (msg: string, ...args: any[]) => console.info(`[${component || 'app'}]`, msg, ...args),
    warn: (msg: string, ...args: any[]) => console.warn(`[${component || 'app'}]`, msg, ...args),
    error: (msg: string, ...args: any[]) => console.error(`[${component || 'app'}]`, msg, ...args),
    debug: (msg: string, ...args: any[]) => console.debug(`[${component || 'app'}]`, msg, ...args),
    verbose: (msg: string, ...args: any[]) => console.log(`[${component || 'app'}]`, msg, ...args),
  };
}

export class CustomLogger {
  private component: string;

  constructor(options: { level?: string; component?: string } = {}) {
    this.component = options.component || 'app';
  }

  info(message: string, meta: Record<string, unknown> = {}): void {
    console.info(`[${this.component}]`, message, meta);
  }

  warn(message: string, meta: Record<string, unknown> = {}): void {
    console.warn(`[${this.component}]`, message, meta);
  }

  error(message: string, error?: Error | unknown): void {
    console.error(`[${this.component}]`, message, error);
  }

  debug(message: string, meta: Record<string, unknown> = {}): void {
    console.debug(`[${this.component}]`, message, meta);
  }
}
