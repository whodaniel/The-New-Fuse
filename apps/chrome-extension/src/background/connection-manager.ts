import { handleRpcRequestFromCore, handleBroadcastFromRelay } from './message-handler';
import { JsonRpcRequest, JsonRpcResponse } from '../types';

// --- Type Definitions ---
export type WebSocketMessage =
  | JsonRpcRequest
  | JsonRpcResponse
  | { type: 'PING' }
  | { type: 'PONG' }
  // JSON-RPC Notification for broadcast
  | { jsonrpc: '2.0'; method: string; params: any };

/**
 * Manages the WebSocket connection, including reconnection logic and message queuing.
 * This is implemented as a singleton to ensure a single connection instance.
 */
class ConnectionManager {
  // --- Configuration ---
  private readonly DEFAULT_WEBSOCKET_URL = 'ws://localhost:3710';
  private readonly MAX_RECONNECT_ATTEMPTS = 10;
  private readonly PING_INTERVAL_MS = 30000; // 30 seconds
  private readonly PONG_TIMEOUT_MS = 5000; // 5 seconds

  // --- State ---
  private ws: WebSocket | null = null;
  private connectionUrl: string = this.DEFAULT_WEBSOCKET_URL;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private pendingMessages: WebSocketMessage[] = [];
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private pongTimeout: ReturnType<typeof setTimeout> | null = null;

  /**
   * Initializes the connection manager.
   * This should be called from the main background script entry point.
   */
  public init() {
    chrome.storage.local.get(['webSocketUrl'], (result) => {
      this.connectionUrl = result.webSocketUrl || this.DEFAULT_WEBSOCKET_URL;
      this.connect();
    });
  }

  /**
   * Updates the WebSocket URL, saves it, and triggers a reconnection.
   * @param newUrl The new WebSocket URL.
   */
  public updateConnectionUrl(newUrl: string) {
    if (newUrl === this.connectionUrl) {
      console.log(`[ConnManager] URL is already set to ${newUrl}. No change.`);
      return;
    }

    console.log(`[ConnManager] Updating WebSocket URL to: ${newUrl}`);
    this.connectionUrl = newUrl;
    chrome.storage.local.set({ webSocketUrl: newUrl });

    if (this.ws) {
      this.reconnectAttempts = 0; // Reset for a quick reconnect
      this.ws.close();
    } else {
      this.connect(); // If not connected, connect immediately
    }
  }

  /**
   * Sends a message over the WebSocket. If disconnected, queues the message.
   * @param message The message object to send.
   */
  public sendMessage(message: WebSocketMessage) {
    if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
        console.log('[ConnManager] Sent message:', message);
      } catch (error) {
        console.error('[ConnManager] Failed to send message, queuing:', error);
        this.queueMessage(message);
      }
    } else {
      console.log('[ConnManager] WebSocket not connected, queuing message.');
      this.queueMessage(message);
    }
  }

  private connect = () => {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      console.log('[ConnManager] WebSocket is already open or connecting.');
      return;
    }

    console.log(`[ConnManager] Attempting to connect to ${this.connectionUrl}...`);
    try {
      this.ws = new WebSocket(this.connectionUrl);
      this.ws.onopen = this.onOpen;
      this.ws.onmessage = this.onMessage;
      this.ws.onclose = this.onClose;
      this.ws.onerror = this.onError;
    } catch (error) {
      console.error('[ConnManager] WebSocket instantiation failed:', error);
      this.scheduleReconnect();
    }
  };

  private onOpen = () => {
    console.log(`[ConnManager] WebSocket connection established to ${this.connectionUrl}.`);
    this.isConnected = true;
    this.reconnectAttempts = 0;
    this.startPing();
    this.processPendingMessages();
  };

  private onMessage = (event
    }
  } catch (error) {
    console.error('[ConnManager] Error processing incoming message:', error);
  }
}

/**
 * Handles the WebSocket connection closing.
 */
function onClose() {
  console.log('[ConnManager] WebSocket connection closed.');
  isConnected = false;
  stopPing();
  ws = null; // Clear the instance
  scheduleReconnect();
}

/**
 * Handles WebSocket errors.
 */
function onError(event: Event) {
  console.error('[ConnManager] WebSocket error:', event);
  // The onClose event will be triggered after an error, so reconnection is handled there.
}

/**
 * Schedules a reconnection attempt with exponential backoff.
 */
function scheduleReconnect() {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.error('[ConnManager] Max reconnection attempts reached. Stopping.');
    return;
  }
  reconnectAttempts++;
  const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 60000); // Exponential backoff up to 1 minute
  console.log(`[ConnManager] Scheduling reconnect attempt ${reconnectAttempts} in ${delay}ms.`);
  setTimeout(connect, delay);
}

/**
 * Updates the WebSocket connection URL, saves it to storage, and triggers a reconnection.
 * @param newUrl The new WebSocket URL to connect to.
 */
export function updateConnectionUrl(newUrl: string) {
  if (newUrl === connectionUrl) {
    console.log(`[ConnManager] URL is already set to ${newUrl}. No change.`);
    return;
  }

  console.log(`[ConnManager] Updating WebSocket URL to: ${newUrl}`);
  connectionUrl = newUrl;

  // Persist the new URL for future sessions.
  chrome.storage.local.set({ webSocketUrl: newUrl });

  // If there's an active connection, close it to trigger a reconnect to the new URL.
  if (ws) {
    reconnectAttempts = 0; // Reset attempts to ensure a quick reconnect.
    ws.close();
  }
}

/**
 * Sends a message over the WebSocket. If disconnected, queues the message.
 * @param message The message object to send.
 */
export function sendMessage(message: any) {
  if (isConnected && ws?.readyState === WebSocket.OPEN) {
    try {
      ws.send(JSON.stringify(message));
      console.log('[ConnManager] Sent message:', message);
    } catch (error) {
      console.error('[ConnManager] Failed to send message, queuing:', error);
      queueMessage(message);
    }
  } else {
    console.log('[ConnManager] WebSocket not connected, queuing message.');
    queueMessage(message);
  }
}

/**
 * Adds a message to the pending queue.
 */
function queueMessage(message: any) {
  pendingMessages.push(message);
}

/**
 * Sends all queued messages.
 */
function processPendingMessages() {
  while (pendingMessages.length > 0) {
    const message = pendingMessages.shift();
    sendMessage(message);
  }
}

/**
 * Starts the ping-pong heartbeat to keep the connection alive.
 */
function startPing() {
  stopPing(); // Ensure no multiple intervals are running
  pingInterval = setInterval(() => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      stopPing();
      return;
    }

    try {
      // Set a timeout for the PONG response
      pongTimeout = setTimeout(() => {
        console.warn(`[ConnManager] PONG response not received within ${PONG_TIMEOUT_MS}ms. Terminating connection.`);
        ws?.close(); // This will trigger the onClose and reconnect logic
      }, PONG_TIMEOUT_MS);

      sendMessage({ type: 'PING' });
    } catch (error) {
      console.error('[ConnManager] Failed to send PING:', error);
      stopPing();
    }
  }, PING_INTERVAL_MS);
}

/**
 * Stops the ping-pong heartbeat.
 */
function stopPing() {
  if (pingInterval) clearInterval(pingInterval);
  if (pongTimeout) clearTimeout(pongTimeout);
  pingInterval = null;
  pongTimeout = null;
}