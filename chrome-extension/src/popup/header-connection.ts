/**
 * Header connection status handler for The New Fuse - AI Bridge
 */
import { Logger } from '../utils/logger.js';
import { ConnectionStatusManager } from './connection-status.js';

// Create a header-specific logger
const headerLogger = new Logger({
  name: 'HeaderConnection',
  level: 'info',
  saveToStorage: true
});

/**
 * Header connection status handler
 */
export class HeaderConnectionManager {
  private connectionManager: ConnectionStatusManager;
  private connectionDot: HTMLElement | null = null;
  private connectionText: HTMLElement | null = null;
  private connectButton: HTMLElement | null = null;
  private isConnecting: boolean = false;

  /**
   * Create a new HeaderConnectionManager
   * @param connectionManager - Connection status manager
   */
  constructor(connectionManager: ConnectionStatusManager) {
    this.connectionManager = connectionManager;
    
    headerLogger.info('Header connection manager initialized');
  }

  /**
   * Initialize header connection manager
   */
  initialize(): void {
    try {
      // Get UI elements
      this.connectionDot = document.getElementById('connection-dot');
      this.connectionText = document.getElementById('connection-text');
      this.connectButton = document.getElementById('connect-button');
      
      // Make sure UI elements exist
      if (!this.connectionDot || !this.connectionText || !this.connectButton) {
        headerLogger.error('Failed to find header UI elements');
        return;
      }
      
      // Update initial state
      this.updateConnectionStatus();
      
      // Add connect button event listener
      this.connectButton.addEventListener('click', () => {
        if (this.connectionManager.isConnectedToVSCode() || this.connectionManager.isConnectedToRelay()) {
          this.connectionManager.disconnect();
        } else {
          this.connectionManager.connect();
          this.setConnectingState(true);
        }
      });
      
      // Listen for connection changes
      this.connectionManager.addStatusChangeListener(() => {
        this.updateConnectionStatus();
        this.setConnectingState(false);
      });
    } catch (error) {
      headerLogger.error('Error initializing header connection manager', error);
      console.error('Error initializing header connection manager:', error);
    }
  }
  
  /**
   * Update connection status UI
   */
  private updateConnectionStatus(): void {
    const isConnected = this.connectionManager.isConnectedToVSCode() || this.connectionManager.isConnectedToRelay();
    
    if (this.connectionDot) {
      this.connectionDot.className = `status-dot ${isConnected ? 'connected' : this.isConnecting ? 'connecting' : 'disconnected'}`;
      this.connectionDot.title = isConnected ? 'Connected' : this.isConnecting ? 'Connecting...' : 'Disconnected';
    }
    
    if (this.connectionText) {
      this.connectionText.textContent = isConnected ? 'Connected' : this.isConnecting ? 'Connecting...' : 'Disconnected';
    }
    
    if (this.connectButton) {
      const icon = this.connectButton.querySelector('i');
      if (icon) {
        icon.className = isConnected ? 'fas fa-plug' : 'fas fa-plug-circle-exclamation';
      }
      this.connectButton.title = isConnected ? 'Disconnect' : 'Connect';
      // Update button style based on connection state
      this.connectButton.className = isConnected ? 'primary-button connected' : 'primary-button disconnected';
    }
    
    // Also update status indicator in the header
    const statusIndicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');
    
    if (statusIndicator && statusText) {
      if (isConnected) {
        statusIndicator.className = 'status-indicator online';
        statusText.textContent = 'Connected';
      } else if (this.isConnecting) {
        statusIndicator.className = 'status-indicator partial';
        statusText.textContent = 'Connecting...';
      } else {
        statusIndicator.className = 'status-indicator offline';
        statusText.textContent = 'Disconnected';
      }
    }
    
    headerLogger.debug(`Connection status updated: ${isConnected ? 'Connected' : 'Disconnected'}`);
  }
  
  /**
   * Set connecting state
   * @param isConnecting - Whether connecting is in progress
   */
  private setConnectingState(isConnecting: boolean): void {
    this.isConnecting = isConnecting;
    this.updateConnectionStatus();
    
    if (isConnecting && this.connectionDot) {
      this.connectionDot.className = 'status-dot connecting';
      this.connectionDot.title = 'Connecting...';
    }
    
    if (isConnecting && this.connectionText) {
      this.connectionText.textContent = 'Connecting...';
    }
  }
}
