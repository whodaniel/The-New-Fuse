// Simple logger configuration
export const logger = {
  debug: (...args: unknown[]) => console.debug(...args),
  info: (...args: unknown[]) => console.info(...args),
  warn: (...args: unknown[]) => console.warn(...args),
  error: (...args: unknown[]) => console.error(...args),
  log: (...args: unknown[]) => console.log(...args),
};

export const LogConfig = {
  level: process.env.LOG_LEVEL || "info",
  format: process.env.LOG_FORMAT || "json",
  destination: process.env.LOG_DESTINATION || "console",
};