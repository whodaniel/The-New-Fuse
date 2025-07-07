/**
 * Connection status manager for The New Fuse - AI Bridge
 */
import { Logger } from '../utils/logger.js';

// Create a connection-specific logger
const connectionLogger = new Logger({
  name: 'ConnectionStatus',
  level: 'info',
  saveToStorage: true
});

/**
 * Connection status manager
 */
export class ConnectionStatusManager {
  private vscodeStatus: boolean = false;
  private relayStatus: boolean = false;
  private statusChangeListeners: Function[] = [];

  /**
   * Create a new ConnectionStatusManager
   */
  constructor() {
    // Listen for connection state messages
    chrome.runtime.onMessage.addListener((message) => {
      if (message && message.type === 'CONNECTION_STATE') {
        this.updateStatus(message.state);
      }
      return false;
    });
    
    // Get initial connection state
    this.getConnectionState();
    
    connectionLogger.info('Connection status manager initialized');
  }

  /**
   * Get connection state from background script
   */
  private getConnectionState(): void {
    chrome.runtime.sendMessage({ type: 'GET_CONNECTION_STATE' }, (response) => {
      if (response && response.success) {
        this.updateStatus(response.state);
      }
    });
  }

  /**
   * Update connection status
   * @param state - Connection state
   */
  private updateStatus(state: { vscode: boolean; relay: boolean }): void {
    const oldVscode = this.vscodeStatus;
    const oldRelay = this.relayStatus;
    
    this.vscodeStatus = state.vscode;
    this.relayStatus = state.relay;
    
    // Update UI
    this.updateUI();
    
    // Notify listeners if status changed
    if (oldVscode !== this.vscodeStatus || oldRelay !== this.relayStatus) {
      this.notifyStatusChangeListeners();
    }
    
    connectionLogger.debug(`Connection status updated: VS Code: ${this.vscodeStatus}, Relay: ${this.relayStatus}`);
  }

  /**
   * Update the UI based on connection status
   */
  private updateUI(): void {
    // Update VS Code status indicator
    const vscodeIndicator = document.getElementById('vscode-status');
    if (vscodeIndicator) {
      vscodeIndicator.className = `status-value ${this.vscodeStatus ? 'online' : 'offline'}`;
      vscodeIndicator.textContent = this.vscodeStatus ? 'Connected' : 'Disconnected';
    }
    
    // Update relay status indicator
    const relayIndicator = document.getElementById('relay-status');
    if (relayIndicator) {
      relayIndicator.className = `status-value ${this.relayStatus ? 'online' : 'offline'}`;
      relayIndicator.textContent = this.relayStatus ? 'Connected' : 'Disconnected';
    }
    
    // Update WebSocket status indicator in connection tab
    const websocketStatus = document.getElementById('websocket-status');
    if (websocketStatus) {
      websocketStatus.className = `status-value ${this.relayStatus ? 'online' : 'offline'}`;
      websocketStatus.textContent = this.relayStatus ? 'Connected' : 'Disconnected';
    }
    
    // Update connect button text
    const connectBtn = document.getElementById('connect-btn');
    if (connectBtn) {
      connectBtn.textContent = (this.vscodeStatus || this.relayStatus) ? 'Disconnect' : 'Connect';
      connectBtn.className = (this.vscodeStatus || this.relayStatus) ? 'primary-button connected' : 'primary-button';
    }
  }

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    chrome.runtime.sendMessage({ type: 'CONNECT' }, (response) => {
      if (response && response.success) {
        connectionLogger.info('Connection request sent');
      } else {
        connectionLogger.error('Failed to send connection request', response?.error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    chrome.runtime.sendMessage({ type: 'DISCONNECT' }, (response) => {
      if (response && response.success) {
        connectionLogger.info('Disconnection request sent');
      } else {
        connectionLogger.error('Failed to send disconnection request', response?.error);
      }
    });
  }

  /**
   * Check if connected to VS Code
   * @returns Whether connected to VS Code
   */
  isConnectedToVSCode(): boolean {
    return this.vscodeStatus;
  }

  /**
   * Check if connected to relay server
   * @returns Whether connected to relay server
   */
  isConnectedToRelay(): boolean {
    return this.relayStatus;
  }

  /**
   * Check if fully connected
   * @returns Whether fully connected
   */
  isFullyConnected(): boolean {
    return this.vscodeStatus && this.relayStatus;
  }

  /**
   * Get VS Code connection status (alias for better naming)
   * @returns Whether VS Code is connected
   */
  isVscodeConnected(): boolean {
    return this.vscodeStatus;
  }
  
  /**
   * Get relay connection status (alias for better naming)
   * @returns Whether relay is connected
   */
  isRelayConnected(): boolean {
    return this.relayStatus;
  }

  /**
   * Add a status change listener
   * @param listener - Status change listener
   */
  addStatusChangeListener(listener: Function): void {
    this.statusChangeListeners.push(listener);
  }

  /**
   * Remove a status change listener
   * @param listener - Status change listener
   */
  removeStatusChangeListener(listener: Function): void {
    this.statusChangeListeners = this.statusChangeListeners.filter(l => l !== listener);
  }

  /**
   * Notify status change listeners
   */
  private notifyStatusChangeListeners(): void {
    const status = {
      vscode: this.vscodeStatus,
      relay: this.relayStatus
    };
    
    this.statusChangeListeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        connectionLogger.error('Error in status change listener', error);
      }
    });
  }
}
