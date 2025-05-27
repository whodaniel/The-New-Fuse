import * as vscode from 'vscode';

export const LogLevel = {
  Debug: 'debug',
  Info: 'info',
  Warn: 'warn',
  Error: 'error'
};

// Logger class implementing ExtensionLogger
export class Logger {
  constructor(name = 'Extension') {
    this.name = name;
    this.outputChannel = vscode.window.createOutputChannel(name);
  }

  log(message, level) {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [${level}] ${message}`;
    this.outputChannel.appendLine(formattedMessage);
  }

  debug(message, ...args) {
    const additionalInfo = args.length > 0 ? args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ') : '';
    
    this.log(`${message} ${additionalInfo}`, LogLevel.Debug);
  }

  info(message, ...args) {
    const additionalInfo = args.length > 0 ? args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ') : '';
    
    this.log(`${message} ${additionalInfo}`, LogLevel.Info);
  }

  warn(message, ...args) {
    const additionalInfo = args.length > 0 ? args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ') : '';
    
    this.log(`${message} ${additionalInfo}`, LogLevel.Warn);
  }

  error(message, ...args) {
    let errorMessage = message;
    if (message instanceof Error) {
      errorMessage = `${message.message}\nStack: ${message.stack || 'No stack trace available'}`;
    }
    
    const additionalInfo = args.length > 0 ? args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ') : '';
    
    this.log(`${errorMessage} ${additionalInfo}`, LogLevel.Error);
  }

  showError(message, error) {
    this.error(message);
    const errorMessage = error instanceof Error ? error.message : error;
    vscode.window.showErrorMessage(`${message}${errorMessage ? `: ${errorMessage}` : ''}`);
  }

  showInfo(message) {
    this.info(message);
    vscode.window.showInformationMessage(message);
  }

  dispose() {
    this.outputChannel.dispose();
  }
}

// Singleton instance
let loggerInstance;

// Get or create logger instance
export function getLogger(name = 'The New Fuse') {
  if (!loggerInstance) {
    loggerInstance = new Logger(name);
  }
  return loggerInstance;
}
