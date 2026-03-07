/**
 * Configuration for API clients
 */
export interface ApiConfig {
  /**
   * Base URL for API requests
   */
  baseURL: string;
  
  /**
   * Request timeout in milliseconds
   * @default 30000
   */
  timeout?: number;
  
  /**
   * Default headers to include with every request
   */
  headers?: Record<string, string>;
  
  /**
   * Additional configuration options
   */
  options?: Record<string, any>;
}