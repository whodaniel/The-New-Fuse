/**
 * Tests for WebSocketManager
 */
import { WebSocketManager } from '../../utils/websocket-manager.js';

describe('WebSocketManager', () => {
  let wsManager: WebSocketManager;
  const mockUrl = 'ws://localhost:3712';

  beforeEach(() => {
    jest.clearAllMocks();
    wsManager = new WebSocketManager(mockUrl, {
      debug: true,
      reconnectAttempts: 3,
      reconnectDelay: 100,
      useCompression: false
    });
  });

  test('should create a WebSocketManager instance', () => {
    expect(wsManager).toBeInstanceOf(WebSocketManager);
  });

  test('should connect to WebSocket server', async () => {
    const connected = await wsManager.connect();
    expect(connected).toBe(true);
    expect(wsManager.isConnected()).toBe(true);
    expect(wsManager.getState()).toEqual({
      connected: true,
      reconnecting: false,
      lastError: null
    });
  });

  test('should disconnect from WebSocket server', async () => {
    await wsManager.connect();
    wsManager.disconnect();
    expect(wsManager.isConnected()).toBe(false);
    expect(wsManager.getState()).toEqual({
      connected: false,
      reconnecting: false,
      lastError: null
    });
  });

  test('should send a message', async () => {
    await wsManager.connect();
    const sendSpy = jest.spyOn(WebSocket.prototype, 'send');
    
    const message = { type: 'test', data: 'Hello, world!' };
    const sent = wsManager.send(message);
    
    expect(sent).toBe(true);
    expect(sendSpy).toHaveBeenCalledWith(JSON.stringify(message));
  });

  test('should queue messages when not connected', () => {
    const message = { type: 'test', data: 'Hello, world!' };
    const sent = wsManager.send(message);
    
    expect(sent).toBe(false);
    
    // Connect and check if the message is sent
    const sendSpy = jest.spyOn(WebSocket.prototype, 'send');
    wsManager.connect();
    
    // Wait for the next tick to allow the connection to be established
    return new Promise<void>(resolve => {
      setTimeout(() => {
        expect(sendSpy).toHaveBeenCalledWith(JSON.stringify(message));
        resolve();
      }, 10);
    });
  });

  test('should add and remove event listeners', async () => {
    const openHandler = jest.fn();
    wsManager.addListener('open', openHandler);
    
    await wsManager.connect();
    expect(openHandler).toHaveBeenCalled();
    
    wsManager.removeListener('open', openHandler);
    
    // Reset the mock and reconnect
    openHandler.mockReset();
    wsManager.disconnect();
    await wsManager.connect();
    
    // The callback should not be called again
    expect(openHandler).not.toHaveBeenCalled();
  });

  test('should handle one-time event listeners', async () => {
    const openHandler = jest.fn();
    wsManager.addListener('open', openHandler);
    
    await wsManager.connect();
    expect(openHandler).toHaveBeenCalled();
    
    // Reset the mock and reconnect
    openHandler.mockReset();
    wsManager.disconnect();
    await wsManager.connect();
    
    // The callback should not be called again
    expect(openHandler).not.toHaveBeenCalled();
  });

  test('should handle WebSocket errors', () => {
    // Mock WebSocket to trigger an error
    const originalWebSocket = global.WebSocket;
    (global as any).WebSocket = class ErrorWebSocket {
      url: string;
      readyState: number = 0;
      onerror: ((event: Event) => any) | null = null;
      onopen: ((event: Event) => any) | null = null;
      onclose: ((event: CloseEvent) => any) | null = null;
      onmessage: ((event: MessageEvent) => any) | null = null;

      constructor(url: string) {
        this.url = url;
        // Trigger error in next event loop
        setTimeout(() => {
          if (this.onerror) {
            this.onerror(new ErrorEvent('error', { message: 'WebSocket error' }));
          }
        }, 0);
      }

      close(code?: number, reason?: string): void {}
      send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {}
    } as any;
    
    const errorHandler = jest.fn();
    wsManager.addListener('error', errorHandler);
    
    return wsManager.connect().then(connected => {
      expect(connected).toBe(false);
      expect(errorHandler).toHaveBeenCalled();
      expect(wsManager.getState()).toEqual({
        connected: false,
        reconnecting: false,
        lastError: expect.any(Error)
      });
      
      // Restore original WebSocket
      (global as any).WebSocket = originalWebSocket;
    });
  });
});
