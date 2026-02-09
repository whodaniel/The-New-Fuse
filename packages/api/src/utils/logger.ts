/**
 * Simple logger utility for consistent logging across the application
 */
export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  info(message: string, ...optionalParams: any[]): void {
    console.info(`[${this.timestamp}] [${this.context}] [INFO] ${message}`, ...optionalParams);
  }

  debug(message: string, ...optionalParams: any[]): void {
    console.debug(`[${this.timestamp}] [${this.context}] [DEBUG] ${message}`, ...optionalParams);
  }

  warn(message: string, ...optionalParams: any[]): void {
    console.warn(`[${this.timestamp}] [${this.context}] [WARN] ${message}`, ...optionalParams);
  }

  error(message: string, ...optionalParams: any[]): void {
    console.error(`[${this.timestamp}] [${this.context}] [ERROR] ${message}`, ...optionalParams);
  }

  private get timestamp(): string {
    return new Date().toISOString();
  }
}