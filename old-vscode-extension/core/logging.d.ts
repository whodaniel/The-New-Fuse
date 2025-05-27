export declare enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}
export declare class Logger {
    private readonly config;
    private static instance;
    private logToFile;
    private constructor();
    static getInstance(config?: ConfigurationService): Logger;
    log(level: LogLevel, message: string, ...args: any[]): void;
    debug(message: string, ...args: any[]): void;
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
    private writeToFile;
    private rotateLogFiles;
}
export interface ConfigurationService {
    get<T>(key: string, defaultValue: T): T;
}
//# sourceMappingURL=logging.d.ts.map