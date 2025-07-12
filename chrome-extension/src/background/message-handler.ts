import { JsonRpcRequest, JsonRpcResponse } from '../types';
// Assume a connection manager exists and is imported.
// This file would be responsible for the actual WebSocket send/receive logic.
import * as webSocketManager from './connection-manager';

/**
 * @file Manages message routing between the WebSocket, background script, and content scripts.
 */

const MESSAGE_TYPES = {
  EXECUTE_RPC_REQUEST: 'EXECUTE_RPC_REQUEST',
  HANDLE_RELAY_BROADCAST: 'HANDLE_RELAY_BROADCAST',
  SEND_BROADCAST_TO_RELAY: 'SEND_BROADCAST_TO_RELAY',
  UPDATE_WEBSOCKET_URL: 'UPDATE_WEBSOCKET_URL',
};

async function getActiveTabId(): Promise<number | undefined> {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return activeTab?.id;
}

/**
 * Handles structured JSON-RPC requests received from the Core service via WebSocket.
 * It forwards the request to the content script of the active tab and
 * sends the response back to the Core.
 * @param request The JSON-RPC request from the Core.
 */
export async function handleRpcRequestFromCore(request: JsonRpcRequest): Promise<void> {
  const tabId = await getActiveTabId();
  if (tabId) {
    try {
      console.log(`[Background] Forwarding RPC request (ID: ${request.id}) to tab ${tabId}`);
      const response: JsonRpcResponse = await chrome.tabs.sendMessage(tabId, {
        type: MESSAGE_TYPES.EXECUTE_RPC_REQUEST,
        payload: request,
      });
      console.log(`[Background] Received response for ID ${request.id}. Sending back to Core.`);
      webSocketManager.sendMessage(response);
    } catch (error: unknown) {
      console.error(`[Background] Error forwarding RPC request to tab ${tabId}:`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorResponse: JsonRpcResponse = {
        jsonrpc: '2.0',
        error: { code: -32003, message: 'Failed to communicate with content script', data: errorMessage },
        id: request.id,
      };
      webSocketManager.sendMessage(errorResponse);
    }
  } else {
    console.warn('[Background] No active tab found for RPC request.');
    const errorResponse: JsonRpcResponse = {
      jsonrpc: '2.0',
      error: { code: -32004, message: 'No active tab found to execute request' },
      id: request.id,
    };
    webSocketManager.sendMessage(errorResponse);
  }
}

/**
 * Handles broadcast messages received from the Relay (e.g., from a CLI agent).
 * @param message The full broadcast message from the WebSocket.
 */
export async function handleBroadcastFromRelay(message: any): Promise<void> {
  const tabId = await getActiveTabId();
  if (tabId) {
    console.log(`[Background] Forwarding relay broadcast to tab ${tabId}`);
    chrome.tabs.sendMessage(tabId, {
      type: MESSAGE_TYPES.HANDLE_RELAY_BROADCAST,
      // The actual payload is inside the 'params' of the JSON-RPC notification
      payload: message.params,
    });
  } else {
    console.warn('[Background] No active tab to forward broadcast to.');
  }
}

/**
 * Listens for and handles messages coming from other parts of the extension,
 * primarily the content scripts.
 * @param message The message object.
 * @param sender The sender of the message.
 * @param sendResponse The function to call to send a response.
 * @returns `true` to indicate that the response will be sent asynchronously.
 */
export function handleRuntimeMessage(
  message: any,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
): boolean {
  (async () => {
    switch (message.type) {
      case MESSAGE_TYPES.SEND_BROADCAST_TO_RELAY:
        console.log('[Background] Received request to broadcast to relay:', message.payload);
        const broadcastMessage = {
          jsonrpc: '2.0',
          method: 'BROADCAST', // This could be more specific, e.g., 'web.chat.sendMessage'
          params: message.payload,
        };
        webSocketManager.sendMessage(broadcastMessage);
        sendResponse({ success: true, message: 'Broadcast forwarded to relay.' });
        break;

      case MESSAGE_TYPES.UPDATE_WEBSOCKET_URL:
        if (typeof message.payload?.url === 'string') {
          console.log('[Background] Received request to update WebSocket URL:', message.payload.url);
          webSocketManager.updateConnectionUrl(message.payload.url);
          sendResponse({ success: true, message: 'WebSocket URL update initiated.' });
        } else {
          sendResponse({ success: false, message: 'Invalid URL payload for UPDATE_WEBSOCKET_URL.' });
        }
        break;

      default:
        // Not returning a value or calling sendResponse for unhandled messages.
        break;
    }
  })();

  // Return true to keep the message channel open for the asynchronous response.
  return true;
}