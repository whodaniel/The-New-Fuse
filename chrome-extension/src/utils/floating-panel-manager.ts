/**
 * Floating Panel Manager for The New Fuse Chrome Extension
 * Handles direct page injection of the floating UI panel
 */

import { Logger } from '../utils/logger';

const logger = new Logger({
  name: 'FloatingPanelManager',
  level: 'info',
  saveToStorage: true
});

export class FloatingPanelManager {
  private iframe: HTMLIFrameElement | null = null;
  private isVisible: boolean = false;
  private isInitialized: boolean = false;
  private position = { x: 20, y: 20 };

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the floating panel manager
   */
  private async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Wait for page to be ready
      if (document.readyState !== 'complete') {
        window.addEventListener('load', () => this.initialize());
        return;
      }

      // Create the iframe for the floating panel
      await this.createFloatingPanelIframe();
      
      // Set up message listeners
      this.setupMessageListeners();
      
      this.isInitialized = true;
      logger.info('Floating panel manager initialized');

      // Notify background script
      chrome.runtime.sendMessage({
        type: 'FLOATING_PANEL_READY',
        url: window.location.href
      });

    } catch (error) {
      logger.error('Failed to initialize floating panel manager:', error);
    }
  }

  /**
   * Create the floating panel iframe
   */
  private async createFloatingPanelIframe(): Promise<void> {
    // Remove existing iframe if any
    if (this.iframe) {
      this.iframe.remove();
    }

    // Create iframe element
    this.iframe = document.createElement('iframe');
    this.iframe.id = 'tnf-floating-panel-iframe';
    this.iframe.src = chrome.runtime.getURL('floatingPanel.html');
    
    // Style the iframe
    Object.assign(this.iframe.style, {
      position: 'fixed',
      top: `${this.position.y}px`,
      left: `${this.position.x}px`,
      width: '380px',
      height: '600px',
      border: 'none',
      borderRadius: '12px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      zIndex: '2147483647', // Maximum z-index
      background: 'transparent',
      display: 'none', // Initially hidden
      pointerEvents: 'auto',
      resize: 'both',
      overflow: 'hidden'
    });

    // Make iframe draggable
    this.makeDraggable();

    // Inject into page
    document.body.appendChild(this.iframe);
    
    logger.info('Floating panel iframe created and injected');
  }

  /**
   * Make the iframe draggable
   */
  private makeDraggable(): void {
    if (!this.iframe) return;

    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialX = 0;
    let initialY = 0;

    const handleMouseDown = (e: MouseEvent) => {
      // Only allow dragging from the header area (top 40px)
      const rect = this.iframe!.getBoundingClientRect();
      if (e.clientY - rect.top > 40) return;

      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      initialX = this.position.x;
      initialY = this.position.y;

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      e.preventDefault();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      this.position.x = Math.max(0, Math.min(window.innerWidth - 380, initialX + deltaX));
      this.position.y = Math.max(0, Math.min(window.innerHeight - 600, initialY + deltaY));
      
      if (this.iframe) {
        this.iframe.style.left = `${this.position.x}px`;
        this.iframe.style.top = `${this.position.y}px`;
      }
    };

    const handleMouseUp = () => {
      isDragging = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      // Save position
      this.savePosition();
    };

    this.iframe.addEventListener('mousedown', handleMouseDown);
  }

  /**
   * Setup message listeners
   */
  private setupMessageListeners(): void {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      switch (request.type) {
        case 'TOGGLE_FLOATING_PANEL':
          this.toggle();
          sendResponse({ success: true, visible: this.isVisible });
          break;

        case 'SHOW_FLOATING_PANEL':
          this.show();
          sendResponse({ success: true, visible: true });
          break;

        case 'HIDE_FLOATING_PANEL':
          this.hide();
          sendResponse({ success: true, visible: false });
          break;

        case 'GET_FLOATING_PANEL_STATE':
          sendResponse({ 
            success: true, 
            isVisible: this.isVisible, 
            position: this.position 
          });
          break;

        case 'SET_FLOATING_PANEL_POSITION':
          this.setPosition(request.position);
          sendResponse({ success: true });
          break;

        case 'CONTROL_IFRAME_VISIBILITY':
          if (request.visible) {
            this.show();
          } else {
            this.hide();
          }
          sendResponse({ success: true, visible: request.visible });
          break;
      }
      
      return true;
    });
  }

  /**
   * Show the floating panel
   */
  public show(): void {
    if (!this.iframe) {
      logger.warn('Cannot show floating panel - iframe not created');
      return;
    }

    this.iframe.style.display = 'block';
    this.isVisible = true;
    
    // Send message to iframe content
    this.sendMessageToIframe('SHOW_PANEL');
    
    logger.info('Floating panel shown');
  }

  /**
   * Hide the floating panel
   */
  public hide(): void {
    if (!this.iframe) {
      logger.warn('Cannot hide floating panel - iframe not created');
      return;
    }

    this.iframe.style.display = 'none';
    this.isVisible = false;
    
    // Send message to iframe content
    this.sendMessageToIframe('HIDE_PANEL');
    
    logger.info('Floating panel hidden');
  }

  /**
   * Toggle the floating panel visibility
   */
  public toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Set panel position
   */
  public setPosition(position: { x: number; y: number }): void {
    this.position = { ...position };
    
    if (this.iframe) {
      this.iframe.style.left = `${this.position.x}px`;
      this.iframe.style.top = `${this.position.y}px`;
    }
    
    this.savePosition();
  }

  /**
   * Save position to storage
   */
  private savePosition(): void {
    chrome.storage.local.set({
      'floatingPanelPosition': this.position
    });
  }

  /**
   * Load position from storage
   */
  private async loadPosition(): Promise<void> {
    try {
      const result = await chrome.storage.local.get('floatingPanelPosition');
      if (result.floatingPanelPosition) {
        this.position = result.floatingPanelPosition;
      }
    } catch (error) {
      logger.warn('Failed to load panel position:', error);
    }
  }

  /**
   * Send message to iframe content
   */
  private sendMessageToIframe(type: string, payload?: any): void {
    if (!this.iframe || !this.iframe.contentWindow) {
      return;
    }

    try {
      this.iframe.contentWindow.postMessage({
        type,
        payload,
        source: 'tnf-content-script'
      }, '*');
    } catch (error) {
      logger.warn('Failed to send message to iframe:', error);
    }
  }

  /**
   * Get current visibility state
   */
  public isFloatingPanelVisible(): boolean {
    return this.isVisible;
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    if (this.iframe) {
      this.iframe.remove();
      this.iframe = null;
    }
    
    this.isVisible = false;
    this.isInitialized = false;
    
    logger.info('Floating panel manager destroyed');
  }
}

// Export singleton instance
export const floatingPanelManager = new FloatingPanelManager();
