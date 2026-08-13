export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogConfig {
  level: LogLevel;
  workspaceDir?: string;
  logFileName?: string;
  enableConsole?: boolean;
  enableFile?: boolean;
}

export const DEFAULT_LOG_CONFIG: LogConfig = {
  level: 'info',
  workspaceDir: process.cwd(),
  logFileName: 'tnf.log',
  enableConsole: true,
  enableFile: true,
};
