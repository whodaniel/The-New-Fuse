/**
 * DevTools Bridge Service
 *
 * Exposes CloudRuntime-hosted browsers to Chrome DevTools Protocol (CDP)
 * for real-time monitoring via Antigravity
 */

import CDP from 'chrome-remote-interface';
import { WebSocketServer, WebSocket } from 'ws';
import { EventEmitter } from 'events';

interface BrowserInstance {
  id: string;
  wsEndpoint: string;
  cdpClient?: CDP.Client;
  status: 'active' | 'idle' | 'error';
  lastActivity: Date;
  agentType?: string;
}

export class DevToolsBridge extends EventEmitter {
  private browsers: Map<string, BrowserInstance> = new Map();
  private wss: WebSocketServer;
  private cdpPort: number;

  constructor(port: number = 9223) {
    super();
    this.cdpPort = port;
    this.wss = new WebSocketServer({ port: this.cdpPort });
    this.setupWebSocketServer();
  }

  /**
   * Setup WebSocket server for Antigravity to connect to
   */
  private setupWebSocketServer() {
    this.wss.on('connection', (ws: WebSocket, req) => {
      console.log('[DevTools Bridge] Antigravity client connected');

      // Send list of available browsers
      this.sendBrowserList(ws);

      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          await this.handleAntigravityMessage(ws, message);
        } catch (error) {
          console.error('[DevTools Bridge] Message handling error:', error);
        }
      });

      ws.on('close', () => {
        console.log('[DevTools Bridge] Antigravity client disconnected');
      });
    });

    console.log(`[DevTools Bridge] WebSocket server listening on ws://0.0.0.0:${this.cdpPort}`);
  }

  /**
   * Register a new browser instance
   */
  async registerBrowser(browserId: string, wsEndpoint: string, agentType?: string) {
    const instance: BrowserInstance = {
      id: browserId,
      wsEndpoint,
      status: 'idle',
      lastActivity: new Date(),
      agentType
    };

    try {
      // Connect to browser via CDP
      instance.cdpClient = await CDP({
        target: wsEndpoint
      });

      const { Runtime, Console, Network, Performance, Page } = instance.cdpClient;

      // Enable all necessary domains
      await Promise.all([
        Runtime.enable(),
        Console.enable(),
        Network.enable(),
        Performance.enable(),
        Page.enable()
      ]);

      // Listen to console messages
      Console.messageAdded((params) => {
        this.broadcastToAntigravity('console', {
          browserId,
          message: params.message,
          timestamp: new Date()
        });
      });

      // Listen to network requests
      Network.requestWillBeSent((params) => {
        this.broadcastToAntigravity('network', {
          browserId,
          request: params.request,
          timestamp: new Date()
        });
      });

      // Listen to page load events
      Page.loadEventFired(() => {
        this.broadcastToAntigravity('pageLoad', {
          browserId,
          timestamp: new Date()
        });
      });

      instance.status = 'active';
      this.browsers.set(browserId, instance);

      console.log(`[DevTools Bridge] Browser registered: ${browserId} (${agentType || 'unknown'})`);

      // Broadcast updated browser list
      this.broadcastBrowserList();

      return true;
    } catch (error) {
      console.error(`[DevTools Bridge] Failed to register browser ${browserId}:`, error);
      instance.status = 'error';
      this.browsers.set(browserId, instance);
      return false;
    }
  }

  /**
   * Unregister a browser instance
   */
  async unregisterBrowser(browserId: string) {
    const instance = this.browsers.get(browserId);
    if (instance?.cdpClient) {
      await instance.cdpClient.close();
    }
    this.browsers.delete(browserId);
    this.broadcastBrowserList();
    console.log(`[DevTools Bridge] Browser unregistered: ${browserId}`);
  }

  /**
   * Take screenshot of a specific browser
   */
  async takeScreenshot(browserId: string): Promise<Buffer | null> {
    const instance = this.browsers.get(browserId);
    if (!instance?.cdpClient) {
      console.error(`[DevTools Bridge] Browser not found: ${browserId}`);
      return null;
    }

    try {
      const { Page } = instance.cdpClient;
      const { data } = await Page.captureScreenshot({
        format: 'png',
        quality: 80
      });

      const buffer = Buffer.from(data, 'base64');

      // Broadcast screenshot to Antigravity
      this.broadcastToAntigravity('screenshot', {
        browserId,
        data,
        timestamp: new Date()
      });

      return buffer;
    } catch (error) {
      console.error(`[DevTools Bridge] Screenshot failed for ${browserId}:`, error);
      return null;
    }
  }

  /**
   * Evaluate script in a specific browser
   */
  async evaluateScript(browserId: string, script: string): Promise<any> {
    const instance = this.browsers.get(browserId);
    if (!instance?.cdpClient) {
      throw new Error(`Browser not found: ${browserId}`);
    }

    try {
      const { Runtime } = instance.cdpClient;
      const result = await Runtime.evaluate({
        expression: script,
        returnByValue: true
      });

      if (result.exceptionDetails) {
        throw new Error(result.exceptionDetails.text || 'Script evaluation failed');
      }

      return result.result.value;
    } catch (error) {
      console.error(`[DevTools Bridge] Script evaluation failed for ${browserId}:`, error);
      throw error;
    }
  }

  /**
   * Get list of console messages from a browser
   */
  async getConsoleMessages(browserId: string): Promise<any[]> {
    const messages = await this.evaluateScript(browserId, `
      (function() {
        const messages = [];
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;

        window.__consoleMessages = window.__consoleMessages || [];
        return window.__consoleMessages;
      })()
    `);

    return messages || [];
  }

  /**
   * Send browser list to a specific WebSocket client
   */
  private sendBrowserList(ws: WebSocket) {
    const browserList = Array.from(this.browsers.values()).map(b => ({
      id: b.id,
      status: b.status,
      agentType: b.agentType,
      lastActivity: b.lastActivity,
      wsEndpoint: b.wsEndpoint
    }));

    ws.send(JSON.stringify({
      type: 'browserList',
      browsers: browserList
    }));
  }

  /**
   * Broadcast browser list to all connected Antigravity clients
   */
  private broadcastBrowserList() {
    const browserList = Array.from(this.browsers.values()).map(b => ({
      id: b.id,
      status: b.status,
      agentType: b.agentType,
      lastActivity: b.lastActivity
    }));

    this.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'browserList',
          browsers: browserList
        }));
      }
    });
  }

  /**
   * Broadcast data to all Antigravity clients
   */
  private broadcastToAntigravity(type: string, data: any) {
    const message = JSON.stringify({ type, data });

    this.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });

    // Also emit as event for internal listeners
    this.emit(type, data);
  }

  /**
   * Handle messages from Antigravity
   */
  private async handleAntigravityMessage(ws: WebSocket, message: any) {
    const { type, browserId, payload } = message;

    switch (type) {
      case 'getBrowserList':
        this.sendBrowserList(ws);
        break;

      case 'takeScreenshot':
        const screenshot = await this.takeScreenshot(browserId);
        ws.send(JSON.stringify({
          type: 'screenshot',
          browserId,
          data: screenshot?.toString('base64'),
          timestamp: new Date()
        }));
        break;

      case 'evaluateScript':
        try {
          const result = await this.evaluateScript(browserId, payload.script);
          ws.send(JSON.stringify({
            type: 'scriptResult',
            browserId,
            result,
            success: true
          }));
        } catch (error) {
          ws.send(JSON.stringify({
            type: 'scriptResult',
            browserId,
            error: error.message,
            success: false
          }));
        }
        break;

      case 'getConsoleMessages':
        const messages = await this.getConsoleMessages(browserId);
        ws.send(JSON.stringify({
          type: 'consoleMessages',
          browserId,
          messages
        }));
        break;

      default:
        console.warn(`[DevTools Bridge] Unknown message type: ${type}`);
    }
  }

  /**
   * Get all registered browsers
   */
  getBrowsers(): BrowserInstance[] {
    return Array.from(this.browsers.values());
  }

  /**
   * Get endpoint for a specific browser
   */
  getBrowserEndpoint(browserId: string): string | null {
    return this.browsers.get(browserId)?.wsEndpoint || null;
  }

  /**
   * Cleanup
   */
  async close() {
    // Close all CDP connections
    for (const instance of this.browsers.values()) {
      if (instance.cdpClient) {
        await instance.cdpClient.close();
      }
    }

    // Close WebSocket server
    this.wss.close();
    console.log('[DevTools Bridge] Closed');
  }
}
