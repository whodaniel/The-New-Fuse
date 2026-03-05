/**
 * Browser stub for winston logging library
 *
 * This file replaces the Node.js-only winston library in browser builds.
 * It provides a console-based logging interface that matches winston's API.
 */

const createLogger = (options: { level?: string } = {}) => {
  const log = (level: string, message: string, ...args: unknown[]) => {
    const method =
      level === 'error'
        ? console.error
        : level === 'warn'
          ? console.warn
          : level === 'debug'
            ? console.debug
            : console.log;
    method(`[${level.toUpperCase()}]`, message, ...args);
  };

  return {
    log: (level: string, message: string, ...args: unknown[]) => log(level, message, ...args),
    info: (message: string, ...args: unknown[]) => log('info', message, ...args),
    warn: (message: string, ...args: unknown[]) => log('warn', message, ...args),
    error: (message: string, ...args: unknown[]) => log('error', message, ...args),
    debug: (message: string, ...args: unknown[]) => log('debug', message, ...args),
    verbose: (message: string, ...args: unknown[]) => log('verbose', message, ...args),
    silly: (message: string, ...args: unknown[]) => log('silly', message, ...args),
    add: () => {},
    remove: () => {},
    clear: () => {},
    configure: () => {},
    on: () => {},
    off: () => {},
    child: () => createLogger(options),
    level: options.level || 'info',
    transports: [],
    format: {
      combine: (..._args: unknown[]) => ({}),
      timestamp: () => ({}),
      json: () => ({}),
      simple: () => ({}),
      colorize: () => ({}),
      printf: (_fn: unknown) => ({}),
      label: () => ({}),
      metadata: () => ({}),
    },
  };
};

const format = {
  combine: (..._args: unknown[]) => ({}),
  timestamp: () => ({}),
  json: () => ({}),
  simple: () => ({}),
  colorize: () => ({}),
  printf: (_fn: unknown) => ({}),
  label: () => ({}),
  metadata: () => ({}),
  errors: () => ({}),
  splat: () => ({}),
  prettyPrint: () => ({}),
};

const transports = {
  Console: class Console {
    constructor(_options: unknown = {}) {}
  },
  File: class File {
    constructor(_options: unknown = {}) {}
  },
  Stream: class Stream {
    constructor(_options: unknown = {}) {}
  },
  DailyRotateFile: class DailyRotateFile {
    constructor(_options: unknown = {}) {}
  },
};

const config = {
  npm: { levels: { error: 0, warn: 1, info: 2, verbose: 3, debug: 4, silly: 5 } },
  syslog: { levels: {} },
};

const winston = {
  createLogger,
  format,
  transports,
  config,
  addColors: () => {},
  Logger: class Logger {
    constructor(options: { level?: string } = {}) {
      return createLogger(options);
    }
  },
  Container: class Container {
    loggers = new Map<string, ReturnType<typeof createLogger>>();
    add(id: string, options?: { level?: string }) {
      const logger = createLogger(options);
      this.loggers.set(id, logger);
      return logger;
    }
    get(id: string) {
      return this.loggers.get(id) || this.add(id);
    }
    has(id: string) {
      return this.loggers.has(id);
    }
  },
};

export default winston;
export { config, createLogger, format, transports };
