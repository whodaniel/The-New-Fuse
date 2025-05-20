/**
 * WebSocket tester for The New Fuse - AI Bridge
 */
import { Logger } from '../utils/logger.js';

// Create a debug-specific logger
const debugLogger = new Logger({
  name: 'WebSocketTester',
  level: 'debug',
  saveToStorage: true
});

/**
 * Log entry
 */
interface LogEntry {
  type: 'system' | 'sent' | 'received' | 'error';
  message: any;
  timestamp: string;
}

/**
 * WebSocket connection tester
 */
export class WebSocketTester {
  private ws: WebSocket | null = null;
  private connectionState: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected';
  private messageLog: LogEntry[] = [];
  private maxLogSize: number = 100;

  /**
   * Connect to a WebSocket server
   * @param url - WebSocket URL
   * @returns Whether connection was successful
   */
  connect(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        debugLogger.info(`Connecting to WebSocket at ${url}`);
        this.connectionState = 'connecting';
        this.updateUI();
        
        this.ws = new WebSocket(url);
        
        this.ws.onopen = () => {
          debugLogger.info('WebSocket connected');
          this.connectionState = 'connected';
          this.updateUI();
          this.logMessage('system', 'Connected to WebSocket server');
          resolve(true);
        };
        
        this.ws.onclose = (event) => {
          debugLogger.info(`WebSocket disconnected: ${event.code} - ${event.reason || 'No reason'}`);
          this.connectionState = 'disconnected';
          this.updateUI();
          this.logMessage('system', `Disconnected: ${event.code} - ${event.reason || 'No reason'}`);
          resolve(false);
        };
        
        this.ws.onerror = (error) => {
          debugLogger.error('WebSocket error', error);
          this.connectionState = 'error';
          this.updateUI();
          this.logMessage('error', `Error: ${error}`);
          resolve(false);
        };
        
        this.ws.onmessage = (event) => {
          let data = event.data;
          try {
            // Try to parse as JSON
            data = JSON.parse(data);
            debugLogger.debug('Received message', data);
            this.logMessage('received', data);
          } catch (error) {
            // Not JSON, use as is
            debugLogger.debug('Received raw message', data);
            this.logMessage('received', data);
          }
        };
      } catch (error) {
        debugLogger.error('Error creating WebSocket', error);
        this.connectionState = 'error';
        this.updateUI();
        this.logMessage('error', `Error: ${(error as Error).message}`);
        resolve(false);
      }
    });
  }
  
  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    if (this.ws) {
      debugLogger.info('Disconnecting from WebSocket');
      this.ws.close(1000, 'User initiated disconnect');
      this.ws = null;
    }
  }
  
  /**
   * Send a message to the WebSocket server
   * @param message - Message to send
   * @returns Whether the message was sent
   */
  send(message: any): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      debugLogger.error('Cannot send message: WebSocket not connected');
      this.logMessage('error', 'Cannot send message: WebSocket not connected');
      return false;
    }
    
    try {
      const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
      this.ws.send(messageStr);
      debugLogger.debug('Sent message', message);
      this.logMessage('sent', message);
      return true;
    } catch (error) {
      debugLogger.error('Error sending message', error);
      this.logMessage('error', `Error sending message: ${(error as Error).message}`);
      return false;
    }
  }
  
  /**
   * Log a message
   * @param type - Message type ('system', 'sent', 'received', 'error')
   * @param message - Message content
   */
  logMessage(type: 'system' | 'sent' | 'received' | 'error', message: any): void {
    const logEntry: LogEntry = {
      type,
      message,
      timestamp: new Date().toISOString()
    };
    
    this.messageLog.push(logEntry);
    
    // Trim log if needed
    if (this.messageLog.length > this.maxLogSize) {
      this.messageLog = this.messageLog.slice(-this.maxLogSize);
    }
    
    this.updateMessageLog();
  }
  
  /**
   * Update the UI based on connection state
   */
  updateUI(): void {
    const statusElement = document.getElementById('ws-test-status');
    const connectButton = document.getElementById('ws-connect') as HTMLButtonElement;
    const disconnectButton = document.getElementById('ws-disconnect') as HTMLButtonElement;
    const sendButton = document.getElementById('ws-send') as HTMLButtonElement;
    
    if (!statusElement || !connectButton || !disconnectButton || !sendButton) {
      return;
    }
    
    // Update status display
    statusElement.textContent = this.connectionState.charAt(0).toUpperCase() + this.connectionState.slice(1);
    statusElement.className = `status-text ${this.connectionState}`;
    
    // Update buttons
    connectButton.disabled = this.connectionState === 'connected' || this.connectionState === 'connecting';
    disconnectButton.disabled = this.connectionState !== 'connected';
    sendButton.disabled = this.connectionState !== 'connected';
  }
  
  /**
   * Update the message log display
   */
  updateMessageLog(): void {
    const logElement = document.getElementById('ws-test-log');
    if (!logElement) {
      return;
    }
    
    // Clear log
    logElement.innerHTML = '';
    
    // Add messages
    for (const entry of this.messageLog) {
      const messageElement = document.createElement('div');
      messageElement.className = `log-entry ${entry.type}`;
      
      const timestamp = document.createElement('span');
      timestamp.className = 'log-timestamp';
      timestamp.textContent = new Date(entry.timestamp).toLocaleTimeString();
      
      const content = document.createElement('span');
      content.className = 'log-content';
      
      if (typeof entry.message === 'object') {
        content.textContent = JSON.stringify(entry.message, null, 2);
      } else {
        content.textContent = entry.message as string;
      }
      
      messageElement.appendChild(timestamp);
      messageElement.appendChild(content);
      logElement.appendChild(messageElement);
    }
    
    // Scroll to bottom
    logElement.scrollTop = logElement.scrollHeight;
  }
  
  /**
   * Clear the message log
   */
  clearLog(): void {
    this.messageLog = [];
    this.updateMessageLog();
  }
}
