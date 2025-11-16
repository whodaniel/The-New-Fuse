/**
 * Simple logging utility for VS Code extension
 */
export class Logger {
    private static instance: Logger;
    private outputChannel?: any;
    private name: string;

    constructor(name?: string) {
        this.name = name || 'Logger';
    }

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    public setOutputChannel(channel: any): void {
        this.outputChannel = channel;
    }

    public info(message: string, ...args: any[]): void {
        this.logInternal('INFO', message, ...args);
    }

    public warn(message: string, ...args: any[]): void {
        this.logInternal('WARN', message, ...args);
    }

    public error(message: string, ...args: any[]): void {
        this.logInternal('ERROR', message, ...args);
    }

    public debug(message: string, ...args: any[]): void {
        this.logInternal('DEBUG', message, ...args);
    }

    public log(message: string, ...args: any[]): void;
    public log(level: string, message: string, ...args: any[]): void;
    public log(levelOrMessage: string, message?: string, ...args: any[]): void {
        let level: string;
        let msg: string;
        
        if (message === undefined) {
            // Single argument case: log(message)
            level = 'INFO';
            msg = levelOrMessage;
        } else {
            // Two+ argument case: log(level, message, ...args)
            level = levelOrMessage;
            msg = message;
        }
        
        this.logInternal(level, msg, ...args);
    }

    private logInternal(level: string, message: string, ...args: any[]): void {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${level} [${this.name}]: ${message}`;
        
        if (args.length > 0) {
            console.log(logMessage, ...args);
        } else {
            console.log(logMessage);
        }

        if (this.outputChannel) {
            this.outputChannel.appendLine(logMessage);
            if (args.length > 0) {
                this.outputChannel.appendLine(`  Details: ${JSON.stringify(args)}`);
            }
        }
    }
}

// Export convenience functions
export const logger = Logger.getInstance();
export const info = (message: string, ...args: any[]) => logger.info(message, ...args);
export const warn = (message: string, ...args: any[]) => logger.warn(message, ...args);
export const error = (message: string, ...args: any[]) => logger.error(message, ...args);
export const debug = (message: string, ...args: any[]) => logger.debug(message, ...args);
