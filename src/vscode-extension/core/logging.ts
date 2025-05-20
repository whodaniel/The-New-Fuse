export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}

export class Logger {
    private static instance: Logger;
    private logToFile: boolean = false;

    private constructor(private readonly config: ConfigurationService) {
        this.logToFile = config.get('enableLogging', false);
    }

    public static getInstance(config?: ConfigurationService): Logger {
        if (!Logger.instance && config) {
            Logger.instance = new Logger(config);
        }
        return Logger.instance;
    }

    public log(level: LogLevel, message: string, ...args: any[]): void {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${LogLevel[level]}] ${message}`;
        
        switch (level) {
            case LogLevel.DEBUG:
                console.debug(logMessage, ...args);
                break;
            case LogLevel.INFO:
                console.info(logMessage, ...args);
                break;
            case LogLevel.WARN:
                console.warn(logMessage, ...args);
                break;
            case LogLevel.ERROR:
                console.error(logMessage, ...args);
                break;
        }

        if (this.logToFile) {
            this.writeToFile(logMessage, args);
        }
    }

    public debug(message: string, ...args: any[]): void {
        this.log(LogLevel.DEBUG, message, ...args);
    }

    public info(message: string, ...args: any[]): void {
        this.log(LogLevel.INFO, message, ...args);
    }

    public warn(message: string, ...args: any[]): void {
        this.log(LogLevel.WARN, message, ...args);
    }

    public error(message: string, ...args: any[]): void {
        this.log(LogLevel.ERROR, message, ...args);
    }

    private async writeToFile(message: string, args: any[]): Promise<void> {
        // Implement file writing logic here if needed
        // For now just log to console
        console.log(`[FILE] ${message}`, ...args);
    }

    private async rotateLogFiles(maxFiles: number = 5): Promise<void> {
        // Implement log rotation logic here if needed
    }
}

export interface ConfigurationService {
    get<T>(key: string, defaultValue: T): T;
}