/**
 * @file The main entry point for the content script.
 * This script is injected into web pages. It is responsible for:
 * 1. Detecting the current website to determine which adapter to use.
 * 2. Instantiating the appropriate adapter (e.g., GeminiAdapter).
 * 3. Listening for messages from the background script (which come from the Core or Relay).
 * 4. Delegating tasks to the active adapter.
 */

import { BaseAdapter } from './adapters/base-adapter';
import { GeminiAdapter } from './adapters/gemini-adapter';
import { ClaudeAdapter } from './adapters/claude-adapter';

let activeAdapter: BaseAdapter | null = null;

/**
 * Determines which adapter to use based on the current page's hostname,
 * and initializes it.
 */
function initializeAdapter() {
  const hostname = window.location.hostname;

  if (hostname.includes('gemini.google.com')) {
    console.log('[The New Fuse] Gemini website detected. Initializing GeminiAdapter.');
    activeAdapter = new GeminiAdapter();
  } else if (hostname.includes('claude.ai')) {
    console.log('[The New Fuse] Claude website detected. Initializing ClaudeAdapter.');
    activeAdapter = new ClaudeAdapter();
  }
  else {
    console.log('[The New Fuse] No compatible adapter found for this website.');
  }
}

/**
 * Listens for incoming messages from other parts of the extension,
 * such as the background script.
 */
function messageListener(
  message: any,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
): boolean {
  if (!activeAdapter) {
    console.warn('[The New Fuse] Received message but no active adapter.');
    return false; // No adapter to handle the message.
  }

  switch (message.type) {
    // This case handles structured requests from the VS Code Core service.
    case 'EXECUTE_RPC_REQUEST':
      console.log('[The New Fuse] Received RPC request:', message.payload);
      activeAdapter.handleRpcRequest(message.payload).then(sendResponse);
      return true; // Indicates that the response will be sent asynchronously.

    // This case handles broadcasted messages, such as those from a CLI agent via the relay.
    case 'HANDLE_RELAY_BROADCAST':
      console.log('[The New Fuse] Received relay broadcast:', message.payload);
      if (message.payload?.type === 'web.chat.sendMessage' && message.payload?.payload?.text) {
        activeAdapter.handleTextMessage(message.payload.payload.text);
      }
      break;

    default:
      console.warn('[The New Fuse] Received unknown message type:', message.type);
      break;
  }

  return false; // No async response.
}

/**
 * Main initialization function.
 */
function main() {
  initializeAdapter();
  chrome.runtime.onMessage.addListener(messageListener);
}

main();