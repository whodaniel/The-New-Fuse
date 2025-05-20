// filepath: src/types/modules/winston.d.ts
declare module "winston" {
  export interface Logger {
    log(level: string, message: string, ...meta: unknown[]): Logger;
    info(message: string, ...meta: unknown[]): Logger;
    error(message: string, ...meta: unknown[]): Logger;
    warn(message: string, ...meta: unknown[]): Logger;
    debug(message: string, ...meta: unknown[]): Logger;
    verbose(message: string, ...meta: unknown[]): Logger;
  }

  export interface LoggerOptions {
    level?: string;
    format?: unknown;
    defaultMeta?: unknown;
    transports?: unknown[];
    exitOnError?: boolean;
  }

  export interface Transports {
    Console: unknown;
    File: unknown;
    DailyRotateFile: unknown;
  }

  export const transports: Transports;

  export namespace format {
    function combine(...formats: unknown[]): unknown;
    function timestamp(options?: unknown): unknown;
    function json(): unknown;
    function printf(fn: Function): unknown;
    function colorize(): unknown;
  }

  export function createLogger(options: LoggerOptions): Logger;
  export function addColors(colors: Record<string, string>): void;
}
