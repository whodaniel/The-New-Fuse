import * as vscode from 'vscode';

export enum LogLevel {
  Debug = 'debug',
  Info = 'info',
  Warn = 'warn',
  Error = 'error'
}

export interface ExtensionLogger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string | Error, ...args: any[]): void;
  showError(message: string, error?: any): void;
  showInfo(message: string): void;
  log(message: string, level: LogLevel): void;
}

// Logger class implementing ExtensionLogger
export class Logger implements ExtensionLogger {
  private outputChannel: vscode.OutputChannel;
  private currentLogLevel: LogLevel = LogLevel.Debug;

  constructor(name: string = 'Extension') {
    this.outputChannel = vscode.window.createOutputChannel(name);
  }

  private logMessage(level: LogLevel, message: string, ...additionalParams: any[]): void {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [${level}] ${message}`;
    
    if (additionalParams.length > 0) {
      const formattedParams = additionalParams.map(param => 
        typeof param === 'object' ? JSON.stringify(param, null, 2) : String(param)
      ).join(' ');
      this.outputChannel.appendLine(`${formattedMessage} ${formattedParams}`);
    } else {
      this.outputChannel.appendLine(formattedMessage);
    }
  }

  public log(message: string, level: LogLevel): void {
    this.logMessage(level, message);
  }

  public debug(message: string, ...args: any[]): void {
    this.logMessage(LogLevel.Debug, message, ...args);
  }

  public info(message: string, ...args: any[]): void {
    this.logMessage(LogLevel.Info, message, ...args);
  }

  public warn(message: string, ...args: any[]): void {
    this.logMessage(LogLevel.Warn, message, ...args);
  }

  public error(message: string | Error, ...args: any[]): void {
    if (message instanceof Error) {
      this.logMessage(LogLevel.Error, `${message.message}\nStack: ${message.stack || 'No stack trace available'}`, ...args);
    } else {
      this.logMessage(LogLevel.Error, message, ...args);
    }
  }

  showError(message: string, error?: any): void {
    this.error(message);
    const errorMessage = error instanceof Error ? error.message : error;
    vscode.window.showErrorMessage(`${message}${errorMessage ? `: ${errorMessage}` : ''}`);
  }

  showInfo(message: string): void {
    this.info(message);
    vscode.window.showInformationMessage(message);
  }

  dispose(): void {
    this.outputChannel.dispose();
  }
}

// Singleton instance
let loggerInstance: Logger | undefined;

// Get or create logger instance
export function getLogger(): Logger {
  if (!loggerInstance) {
    loggerInstance = new Logger('The New Fuse');
  }
  return loggerInstance;
}
