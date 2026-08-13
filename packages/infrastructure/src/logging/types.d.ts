export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export interface LogConfig {
    level: LogLevel;
    workspaceDir?: string;
    logFileName?: string;
    enableConsole?: boolean;
    enableFile?: boolean;
}
export declare const DEFAULT_LOG_CONFIG: LogConfig;
//# sourceMappingURL=types.d.ts.map