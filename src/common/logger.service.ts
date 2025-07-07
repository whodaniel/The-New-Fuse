/**
 * Simple Logger Service for MCP Server
 */

export class Logger {
  private context: string;

  constructor(context?: string) {
    this.context = context || 'Logger';
  }

  private formatMessage(level: string, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    const contextStr = this.context ? `[${this.context}] ` : '';
    const argsStr = args.length > 0 ? ` ${args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ')}` : '';
    
    return `${timestamp} [${level}] ${contextStr}${message}${argsStr}`;
  }

  log(message: string, ...args: any[]) {
    console.log(this.formatMessage('LOG', message, ...args));
  }

  error(message: string, ...args: any[]) {
    console.error(this.formatMessage('ERROR', message, ...args));
  }

  warn(message: string, ...args: any[]) {
    console.warn(this.formatMessage('WARN', message, ...args));
  }

  debug(message: string, ...args: any[]) {
    console.debug(this.formatMessage('DEBUG', message, ...args));
  }

  verbose(message: string, ...args: any[]) {
    console.log(this.formatMessage('VERBOSE', message, ...args));
  }

  setContext(context: string) {
    this.context = context;
  }
}