/**
 * Fuse Connect v6 - Native Messaging Client
 * Controls TNF services from the Chrome extension
 */

export interface ServiceStatus {
  name: string;
  running: boolean;
  port: number;
  pid: number | null;
}

export interface NativeHostResponse {
  action: string;
  services?: Record<string, ServiceStatus>;
  result?: {
    success: boolean;
    message: string;
    port?: number;
    pid?: number;
    error?: string;
  };
  results?: Record<string, any>;
  logs?: string[];
  config?: any;
  error?: string;
  message?: string;
  timestamp?: number;
}

const NATIVE_HOST_NAME = 'com.thenewfuse.native_host';

class NativeMessaging {
  private isConnected = false;
  private callbacks: Map<string, (response: NativeHostResponse) => void> = new Map();

  /**
   * Check if native messaging is available
   */
  isAvailable(): boolean {
    return (
      typeof chrome !== 'undefined' &&
      typeof chrome.runtime !== 'undefined' &&
      typeof chrome.runtime.connectNative !== 'undefined'
    );
  }

  /**
   * Send a message to the native host
   */
  async sendMessage(message: Record<string, unknown>): Promise<NativeHostResponse> {
    if (!this.isAvailable()) {
      return { action: 'error', message: 'Native messaging not available' };
    }

    return new Promise((resolve) => {
      try {
        chrome.runtime.sendNativeMessage(NATIVE_HOST_NAME, message, (response) => {
          if (chrome.runtime.lastError) {
            console.error('[NativeMessaging] Error:', chrome.runtime.lastError);
            resolve({
              action: 'error',
              message: chrome.runtime.lastError.message || 'Native messaging failed',
            });
          } else {
            resolve(response);
          }
        });
      } catch (error) {
        console.error('[NativeMessaging] Exception:', error);
        resolve({
          action: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });
  }

  /**
   * Ping the native host to check if it's working
   */
  async ping(): Promise<boolean> {
    const response = await this.sendMessage({ action: 'ping' });
    return response.action === 'pong';
  }

  /**
   * Get status of all services
   */
  async getStatus(): Promise<Record<string, ServiceStatus> | null> {
    const response = await this.sendMessage({ action: 'status' });
    if (response.action === 'status_response' && response.services) {
      return response.services;
    }
    return null;
  }

  /**
   * Start a service
   */
  async startService(
    service: 'relay' | 'backend' | 'frontend' | 'all'
  ): Promise<NativeHostResponse> {
    return this.sendMessage({ action: 'start', service });
  }

  /**
   * Stop a service
   */
  async stopService(
    service: 'relay' | 'backend' | 'frontend' | 'all'
  ): Promise<NativeHostResponse> {
    return this.sendMessage({ action: 'stop', service });
  }

  /**
   * Restart a service
   */
  async restartService(service: 'relay' | 'backend' | 'frontend'): Promise<NativeHostResponse> {
    return this.sendMessage({ action: 'restart', service });
  }

  /**
   * Get recent logs
   */
  async getLogs(lines: number = 50): Promise<string[]> {
    const response = await this.sendMessage({ action: 'logs', lines });
    return response.logs || [];
  }

  /**
   * Get native host configuration
   */
  async getConfig(): Promise<any> {
    const response = await this.sendMessage({ action: 'config' });
    return response.config || null;
  }
}

// Export singleton
export const nativeMessaging = new NativeMessaging();
