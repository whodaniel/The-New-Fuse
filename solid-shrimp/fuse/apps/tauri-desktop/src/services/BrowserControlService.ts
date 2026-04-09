/**
 * Browser Control Service for Tauri App
 *
 * Enables local AI agents to control websites through the TNF Chrome Extension.
 * Connects via WebSocket to the TNF Relay server, which bridges:
 * - Tauri Desktop App (this service)
 * - Chrome Extension (browser-side automation)
 * - Any AI Agents (LLMs, orchestrators, etc.)
 */

import {
  AnalyzePagePayload,
  AnalyzePageResult,
  BrowserControlMessage,
  BrowserControlMessageType,
  CascadeStartPayload,
  CascadeStatusPayload,
  ChatElementMapping,
  ClickPayload,
  GetChatMessagesPayload,
  NavigatePayload,
  NavigateResult,
  OverlayPayload,
  ScreenshotPayload,
  ScreenshotResult,
  ScrollPayload,
  SendChatMessagePayload,
  TabInfo,
  TypePayload,
  createMessage,
  generateMessageId,
} from '@the-new-fuse/shared/browser-control/protocol';
import { EventEmitter } from './EventEmitter';

// ============================================================================
// TYPES
// ============================================================================

export type BrowserControlEvent =
  | 'connected'
  | 'disconnected'
  | 'extension_connected'
  | 'extension_disconnected'
  | 'message'
  | 'error'
  | 'cascade_update'
  | 'chat_response'
  | 'screenshot'
  | 'tab_changed';

interface PendingRequest {
  resolve: (result: any) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
}

// ============================================================================
// BROWSER CONTROL SERVICE
// ============================================================================

class BrowserControlServiceClass extends EventEmitter<BrowserControlEvent> {
  private ws: WebSocket | null = null;
  private relayUrl: string = 'ws://localhost:3000';
  private connected: boolean = false;

  setRelayUrl(url: string) {
    this.relayUrl = url;
    if (this.ws) {
      console.log(`🔄 Relay URL updated to ${url}, reconnecting...`);
      this.disconnect();
      this.connect();
    }
  }
  private extensionConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private defaultTimeout: number = 30000;
  private clientId: string = `tauri-${generateMessageId()}`;

  constructor() {
    super();
  }

  // ============================================================================
  // CONNECTION MANAGEMENT
  // ============================================================================

  /**
   * Connect to the TNF Relay server
   */
  async connect(relayUrl?: string): Promise<boolean> {
    if (relayUrl) {
      this.relayUrl = relayUrl;
    }

    console.log(`🔌 Connecting to TNF Relay at ${this.relayUrl}...`);

    return new Promise((resolve) => {
      try {
        this.ws = new WebSocket(this.relayUrl);

        this.ws.onopen = () => {
          console.log('✅ Connected to TNF Relay');
          this.connected = true;
          this.reconnectAttempts = 0;

          // Register with the relay
          this.sendMessage(BrowserControlMessageType.REGISTER, {
            clientType: 'tauri_app',
            clientId: this.clientId,
            capabilities: [
              'browser_control',
              'ai_orchestration',
              'cascade_execution',
              'session_management',
            ],
            version: '4.0.0',
          });

          this.emit('connected');
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(JSON.parse(event.data));
        };

        this.ws.onclose = () => {
          console.log('❌ TNF Relay connection closed');
          this.connected = false;
          this.emit('disconnected');
          this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('TNF Relay error:', error);
          this.emit('error', error);
          resolve(false);
        };
      } catch (error) {
        console.error('Failed to connect to TNF Relay:', error);
        resolve(false);
      }
    });
  }

  /**
   * Disconnect from the TNF Relay server
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.connected = false;
    this.extensionConnected = false;
  }

  /**
   * Check if connected to relay
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Check if Chrome extension is connected
   */
  isExtensionConnected(): boolean {
    return this.extensionConnected;
  }

  // ============================================================================
  // BROWSER NAVIGATION
  // ============================================================================

  /**
   * Navigate to a URL
   */
  async navigate(url: string, options?: Partial<NavigatePayload>): Promise<NavigateResult> {
    return this.sendRequest<NavigateResult>(BrowserControlMessageType.NAVIGATE, {
      url,
      ...options,
    });
  }

  /**
   * Go back in browser history
   */
  async goBack(tabId?: number): Promise<{ success: boolean }> {
    return this.sendRequest(BrowserControlMessageType.GO_BACK, { tabId });
  }

  /**
   * Go forward in browser history
   */
  async goForward(tabId?: number): Promise<{ success: boolean }> {
    return this.sendRequest(BrowserControlMessageType.GO_FORWARD, { tabId });
  }

  /**
   * Refresh the current page
   */
  async refresh(tabId?: number): Promise<{ success: boolean }> {
    return this.sendRequest(BrowserControlMessageType.REFRESH, { tabId });
  }

  /**
   * Get current URL
   */
  async getCurrentUrl(tabId?: number): Promise<{ url: string; title: string }> {
    return this.sendRequest(BrowserControlMessageType.GET_CURRENT_URL, { tabId });
  }

  // ============================================================================
  // PAGE ANALYSIS
  // ============================================================================

  /**
   * Analyze the current page
   */
  async analyzePage(options?: Partial<AnalyzePagePayload>): Promise<AnalyzePageResult> {
    return this.sendRequest<AnalyzePageResult>(BrowserControlMessageType.ANALYZE_PAGE, {
      analysisTypes: ['structure', 'interactive', 'chat', 'forms', 'content'],
      ...options,
    });
  }

  /**
   * Get page text content
   */
  async getPageContent(tabId?: number): Promise<{ content: string; wordCount: number }> {
    return this.sendRequest(BrowserControlMessageType.GET_PAGE_CONTENT, { tabId });
  }

  /**
   * Get DOM snapshot
   */
  async getDOMSnapshot(tabId?: number): Promise<{ html: string; snapshot: any }> {
    return this.sendRequest(BrowserControlMessageType.GET_DOM_SNAPSHOT, { tabId });
  }

  /**
   * Find elements by selector
   */
  async findElements(
    selector: string,
    tabId?: number
  ): Promise<{ elements: Array<{ selector: string; text: string; visible: boolean }> }> {
    return this.sendRequest(BrowserControlMessageType.FIND_ELEMENTS, { selector, tabId });
  }

  // ============================================================================
  // ELEMENT INTERACTION
  // ============================================================================

  /**
   * Click an element
   */
  async click(selector: string, options?: Partial<ClickPayload>): Promise<{ success: boolean }> {
    return this.sendRequest(BrowserControlMessageType.CLICK, {
      selector,
      ...options,
    });
  }

  /**
   * Type text into an element
   */
  async type(
    selector: string,
    text: string,
    options?: Partial<TypePayload>
  ): Promise<{ success: boolean }> {
    return this.sendRequest(BrowserControlMessageType.TYPE, {
      selector,
      text,
      ...options,
    });
  }

  /**
   * Scroll the page
   */
  async scroll(options: Partial<ScrollPayload>): Promise<{ success: boolean }> {
    return this.sendRequest(BrowserControlMessageType.SCROLL, options);
  }

  /**
   * Hover over an element
   */
  async hover(selector: string, tabId?: number): Promise<{ success: boolean }> {
    return this.sendRequest(BrowserControlMessageType.HOVER, { selector, tabId });
  }

  /**
   * Focus an element
   */
  async focus(selector: string, tabId?: number): Promise<{ success: boolean }> {
    return this.sendRequest(BrowserControlMessageType.FOCUS, { selector, tabId });
  }

  // ============================================================================
  // CHAT INTERFACE (AI Chat Sites like ChatGPT, Claude, etc.)
  // ============================================================================

  /**
   * Detect chat elements on the page (input, send button, output)
   */
  async detectChatElements(tabId?: number): Promise<{ mapping: ChatElementMapping | null }> {
    return this.sendRequest(BrowserControlMessageType.DETECT_CHAT_ELEMENTS, { tabId });
  }

  /**
   * Send a message in a chat interface
   */
  async sendChatMessage(
    message: string,
    options?: Partial<SendChatMessagePayload>
  ): Promise<{ success: boolean; responseReceived?: boolean; response?: string }> {
    return this.sendRequest(
      BrowserControlMessageType.SEND_CHAT_MESSAGE,
      { message, ...options },
      options?.responseTimeout || 60000 // Longer timeout for AI responses
    );
  }

  /**
   * Get chat messages from the page
   */
  async getChatMessages(
    options?: Partial<GetChatMessagesPayload>
  ): Promise<{ messages: Array<{ role: 'user' | 'assistant'; content: string }> }> {
    return this.sendRequest(BrowserControlMessageType.GET_CHAT_MESSAGES, options);
  }

  /**
   * Wait for a new response in chat
   */
  async waitForResponse(
    tabId?: number,
    timeout: number = 60000
  ): Promise<{ response: string; complete: boolean }> {
    return this.sendRequest(BrowserControlMessageType.WAIT_FOR_RESPONSE, { tabId }, timeout);
  }

  // ============================================================================
  // CASCADE ACTIONS (Multi-step automation)
  // ============================================================================

  /**
   * Start a cascade of actions
   */
  async startCascade(
    cascade: CascadeStartPayload
  ): Promise<{ cascadeId: string; started: boolean }> {
    return this.sendRequest(BrowserControlMessageType.CASCADE_START, cascade);
  }

  /**
   * Cancel a running cascade
   */
  async cancelCascade(cascadeId: string): Promise<{ success: boolean }> {
    return this.sendRequest(BrowserControlMessageType.CASCADE_CANCEL, { cascadeId });
  }

  /**
   * Get cascade status
   */
  async getCascadeStatus(cascadeId: string): Promise<CascadeStatusPayload> {
    return this.sendRequest(BrowserControlMessageType.CASCADE_STATUS, { cascadeId });
  }

  // ============================================================================
  // SCREENSHOTS & RECORDING
  // ============================================================================

  /**
   * Take a screenshot
   */
  async takeScreenshot(options?: Partial<ScreenshotPayload>): Promise<ScreenshotResult> {
    return this.sendRequest<ScreenshotResult>(BrowserControlMessageType.TAKE_SCREENSHOT, options);
  }

  /**
   * Start screen recording
   */
  async startRecording(tabId?: number): Promise<{ recordingId: string }> {
    return this.sendRequest(BrowserControlMessageType.START_RECORDING, { tabId });
  }

  /**
   * Stop screen recording
   */
  async stopRecording(): Promise<{ recordingId: string; dataUrl: string }> {
    return this.sendRequest(BrowserControlMessageType.STOP_RECORDING, {});
  }

  // ============================================================================
  // TAB MANAGEMENT
  // ============================================================================

  /**
   * Open a new tab
   */
  async newTab(url?: string): Promise<{ tabId: number }> {
    return this.sendRequest(BrowserControlMessageType.NEW_TAB, { url });
  }

  /**
   * Close a tab
   */
  async closeTab(tabId: number): Promise<{ success: boolean }> {
    return this.sendRequest(BrowserControlMessageType.CLOSE_TAB, { tabId });
  }

  /**
   * Switch to a tab
   */
  async switchTab(tabId: number): Promise<{ success: boolean }> {
    return this.sendRequest(BrowserControlMessageType.SWITCH_TAB, { tabId });
  }

  /**
   * List all tabs
   */
  async listTabs(): Promise<{ tabs: TabInfo[] }> {
    return this.sendRequest(BrowserControlMessageType.LIST_TABS, {});
  }

  // ============================================================================
  // OVERLAY CONTROLS
  // ============================================================================

  /**
   * Show an overlay on the browser page
   */
  async showOverlay(options: OverlayPayload): Promise<{ success: boolean }> {
    return this.sendRequest(BrowserControlMessageType.SHOW_OVERLAY, options);
  }

  /**
   * Hide the overlay
   */
  async hideOverlay(): Promise<{ success: boolean }> {
    return this.sendRequest(BrowserControlMessageType.HIDE_OVERLAY, {});
  }

  /**
   * Update overlay message/status
   */
  async updateOverlay(options: Partial<OverlayPayload>): Promise<{ success: boolean }> {
    return this.sendRequest(BrowserControlMessageType.UPDATE_OVERLAY, options);
  }

  // ============================================================================
  // SESSION MANAGEMENT
  // ============================================================================

  /**
   * Start a browser control session
   */
  async startSession(options?: {
    recordSession?: boolean;
    showOverlay?: boolean;
  }): Promise<{ sessionId: string }> {
    return this.sendRequest(BrowserControlMessageType.START_SESSION, options);
  }

  /**
   * End the current session
   */
  async endSession(): Promise<{ success: boolean }> {
    return this.sendRequest(BrowserControlMessageType.END_SESSION, {});
  }

  /**
   * Get current session status
   */
  async getSessionStatus(): Promise<{
    active: boolean;
    sessionId?: string;
    extensionConnected: boolean;
    tabCount: number;
  }> {
    return this.sendRequest(BrowserControlMessageType.GET_SESSION_STATUS, {});
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private sendMessage(type: BrowserControlMessageType, payload: any): void {
    if (!this.ws || !this.connected) {
      console.error('Cannot send message: not connected');
      return;
    }

    const message = createMessage(type, 'tauri_app', payload);
    this.ws.send(JSON.stringify(message));
  }

  private sendRequest<T>(
    type: BrowserControlMessageType,
    payload: any,
    timeout: number = this.defaultTimeout
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.ws || !this.connected) {
        reject(new Error('Not connected to TNF Relay'));
        return;
      }

      const messageId = generateMessageId();
      const message = createMessage(type, 'tauri_app', payload, { id: messageId });

      // Set up timeout
      const timeoutHandle = setTimeout(() => {
        this.pendingRequests.delete(messageId);
        reject(new Error(`Request timeout for ${type}`));
      }, timeout);

      // Store pending request
      this.pendingRequests.set(messageId, {
        resolve,
        reject,
        timeout: timeoutHandle,
      });

      // Send message
      this.ws.send(JSON.stringify(message));
    });
  }

  private handleMessage(message: BrowserControlMessage): void {
    console.log('📨 Received message:', message.type);

    // Handle registration acknowledgment
    if (message.type === BrowserControlMessageType.REGISTER_ACK) {
      console.log('✅ Registered with TNF Relay');

      // Check if extension is connected
      if (message.payload?.connectedClients?.includes('chrome_extension')) {
        this.extensionConnected = true;
        this.emit('extension_connected');
      }
      return;
    }

    // Handle extension connection status
    if (message.type === BrowserControlMessageType.NOTIFICATION) {
      if (
        message.payload?.event === 'client_connected' &&
        message.payload?.clientType === 'chrome_extension'
      ) {
        this.extensionConnected = true;
        this.emit('extension_connected');
      } else if (
        message.payload?.event === 'client_disconnected' &&
        message.payload?.clientType === 'chrome_extension'
      ) {
        this.extensionConnected = false;
        this.emit('extension_disconnected');
      }
      return;
    }

    // Handle responses to pending requests
    if (message.correlationId && this.pendingRequests.has(message.correlationId)) {
      const pending = this.pendingRequests.get(message.correlationId)!;
      clearTimeout(pending.timeout);
      this.pendingRequests.delete(message.correlationId);

      if (message.type === BrowserControlMessageType.ERROR) {
        pending.reject(new Error(message.payload?.error || 'Unknown error'));
      } else {
        pending.resolve(message.payload);
      }
      return;
    }

    // Handle push notifications
    switch (message.type) {
      case BrowserControlMessageType.CASCADE_STATUS:
        this.emit('cascade_update', message.payload);
        break;
      case BrowserControlMessageType.CHAT_RESPONSE_RECEIVED:
        this.emit('chat_response', message.payload);
        break;
      case BrowserControlMessageType.TAKE_SCREENSHOT_RESULT:
        this.emit('screenshot', message.payload);
        break;
      default:
        this.emit('message', message);
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.pow(2, this.reconnectAttempts) * 1000;

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const BrowserControlService = new BrowserControlServiceClass();
export default BrowserControlService;
