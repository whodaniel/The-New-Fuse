/**
 * Lightweight logger utility for the application
 */
export class Logger {
  private context: string;
  private enableTimestamp: boolean;
  
  constructor(context: string, enableTimestamp: boolean = true) {
    this.context = context;
    this.enableTimestamp = enableTimestamp;
  }
  
  private getPrefix(): string {
    const timestamp = this.enableTimestamp ? `[${new Date().toISOString()}] ` : '';
    return `${timestamp}[${this.context}] `;
  }
  
  log(message: any, ...optionalParams: any[]): void {
    console.log(this.getPrefix() + message, ...optionalParams);
  }
  
  error(message: any, ...optionalParams: any[]): void {
    console.error(this.getPrefix() + message, ...optionalParams);
  }
  
  warn(message: any, ...optionalParams: any[]): void {
    console.warn(this.getPrefix() + message, ...optionalParams);
  }
  
  debug(message: any, ...optionalParams: any[]): void {
    console.debug(this.getPrefix() + message, ...optionalParams);
  }
  
  verbose(message: any, ...optionalParams: any[]): void {
    console.info(this.getPrefix() + message, ...optionalParams);
  }
  
  setContext(context: string): void {
    this.context = context;
  }
}
