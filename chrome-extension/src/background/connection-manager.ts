import { handleRpcRequestFromCore, handleBroadcastFromRelay } from './message-handler';

// --- Configuration ---
const DEFAULT_WEBSOCKET_URL = 'ws://localhost:3710'; // Default for VS Code Core
const MAX_RECONNECT_ATTEMPTS = 10;
const PING_INTERVAL_MS = 30000; // 30 seconds
const PONG_TIMEOUT_MS = 5000; // 5 seconds to wait for a PONG response

// --- State ---
let ws: WebSocket | null = null;
let connectionUrl: string = DEFAULT_WEBSOCKET_URL;
let isConnected: boolean = false;
let reconnectAttempts: number = 0;
let pendingMessages: any[] = [];
let pingInterval: ReturnType<typeof setInterval> | null = null;
let pongTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Initializes the WebSocket connection manager.
 * This should be called from the main background script entry point.
 */
export function init() {
  // Load the saved URL from storage, then connect.
  chrome.storage.local.get(['webSocketUrl'], (result) => {
    connectionUrl = result.webSocketUrl || DEFAULT_WEBSOCKET_URL;
    connect();
  });
}

/**
 * Establishes a WebSocket connection.
 */
function connect() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    console.log('[ConnManager] WebSocket is already open or connecting.');
    return;
  }

  console.log(`[ConnManager] Attempting to connect to ${connectionUrl}...`);
  try {
    ws = new WebSocket(connectionUrl);
    ws.onopen = onOpen;
    ws.onmessage = onMessage;
    ws.onclose = onClose;
    ws.onerror = onError;
  } catch (error) {
    console.error('[ConnManager] WebSocket instantiation failed:', error);
    scheduleReconnect();
  }
}

/**
 * Handles the WebSocket connection opening.
 */
function onOpen() {
  console.log(`[ConnManager] WebSocket connection established to ${connectionUrl}.`);
  isConnected = true;
  reconnectAttempts = 0;
  startPing();
  processPendingMessages();
}

/**
 * Handles incoming messages from the WebSocket server.
 * @param event The message event.
 */
function onMessage(event: MessageEvent) {
  try {
    const message = JSON.parse(event.data);

    // Handle PONG for heartbeat
    if (message.type === 'PONG') {
      if (pongTimeout) clearTimeout(pongTimeout);
      return;
    }

    console.log('[ConnManager] Received message:', message);

    // Delegate message handling based on its structure
    if (message.method && message.id) {
      handleRpcRequestFromCore(message);
    } else if (message.method && !message.id) {
      handleBroadcastFromRelay(message);
    } else if (message.result || message.error) {
      console.log('[ConnManager] Received JSON-RPC response:', message);
    } else {
      console.warn('[ConnManager] Received unhandled message format:', message);
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