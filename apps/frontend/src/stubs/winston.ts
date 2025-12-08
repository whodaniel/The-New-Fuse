/**
 * Browser stub for winston logging library
 *
 * This file replaces the Node.js-only winston library in browser builds.
 * It provides a console-based logging interface that matches winston's API.
 */

const createLogger = (options: any = {}) => {
  const log = (level: string, message: string, ...args: any[]) => {
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
    log: (level: string, message: string, ...args: any[]) => log(level, message, ...args),
    info: (message: string, ...args: any[]) => log('info', message, ...args),
    warn: (message: string, ...args: any[]) => log('warn', message, ...args),
    error: (message: string, ...args: any[]) => log('error', message, ...args),
    debug: (message: string, ...args: any[]) => log('debug', message, ...args),
    verbose: (message: string, ...args: any[]) => log('verbose', message, ...args),
    silly: (message: string, ...args: any[]) => log('silly', message, ...args),
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
      combine: (...args: any[]) => ({}),
      timestamp: () => ({}),
      json: () => ({}),
      simple: () => ({}),
      colorize: () => ({}),
      printf: (fn: any) => ({}),
      label: () => ({}),
      metadata: () => ({}),
    },
  };
};

const format = {
  combine: (...args: any[]) => ({}),
  timestamp: () => ({}),
  json: () => ({}),
  simple: () => ({}),
  colorize: () => ({}),
  printf: (fn: any) => ({}),
  label: () => ({}),
  metadata: () => ({}),
  errors: () => ({}),
  splat: () => ({}),
  prettyPrint: () => ({}),
};

const transports = {
  Console: class Console {
    constructor(options: any = {}) {}
  },
  File: class File {
    constructor(options: any = {}) {}
  },
  Stream: class Stream {
    constructor(options: any = {}) {}
  },
  DailyRotateFile: class DailyRotateFile {
    constructor(options: any = {}) {}
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
    constructor(options: any = {}) {
      return createLogger(options);
    }
  },
  Container: class Container {
    loggers = new Map();
    add(id: string, options?: any) {
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
