/**
 * WebSocket Server Manager
 * 
 * Handles starting, stopping, and monitoring the WebSocket server
 */

interface ServerConfig {
  port: number;
  saveLogsToFile: boolean;
  logPath: string;
}

let serverProcess: any = null;
let isServerRunning = false;
let connectedClients = 0;
let serverLogs: string[] = [];
let serverLogListeners: ((log: string, type?: string) => void)[] = [];
let serverStatusListeners: ((status: string, state: string) => void)[] = [];

function broadcastLog(logEntry: string, type: string = 'info') {
  serverLogs.push(`[${type.toUpperCase()}] ${logEntry}`);
  if (serverLogs.length > 1000) {
    serverLogs.shift();
  }
  // Send to Chrome runtime listeners (content scripts)
  chrome.runtime.sendMessage({ type: 'SERVER_LOG', log: logEntry, logType: type }).catch(e => {});
  // Call direct listeners (e.g., popup)
  serverLogListeners.forEach(listener => listener(logEntry, type));
}

function broadcastStatus(status: string, state: string) {
  // Send to Chrome runtime listeners (content scripts)
  chrome.runtime.sendMessage({ type: 'WEBSOCKET_SERVER_STATUS', status, state }).catch(e => {});
  // Call direct listeners
  serverStatusListeners.forEach(listener => listener(status, state));
  // Also log status changes
  broadcastLog(`Server status changed: ${status} (${state})`, 'system');
}
/**
 * Start the WebSocket server
 */
export async function startWebSocketServer(config: ServerConfig): Promise<{ success: boolean; error?: string }> {
  if (isServerRunning) {
    broadcastLog('Attempted to start server, but it is already running.', 'warn');
    return { success: false, error: 'Server is already running' };
  }

  broadcastLog(`Attempting to start WebSocket server on port ${config.port}...`, 'info');
  // This is where the actual server process should be started.
  // Since a service worker cannot directly spawn a Node.js process,
  // this function in the background script is now more of a "request" or "trigger".
  // The actual process spawning should be handled by the VS Code extension part
  // or the user needs to run it manually.

  // For now, we'll simulate a successful start for UI purposes
  // and assume something else is starting test-websocket-server-3710.cjs
  
  // Placeholder: In a real scenario, you'd communicate with the VS Code extension
  // or use a native messaging host to start the Node.js server.
  // For example:
  // try {
  //   await chrome.runtime.sendNativeMessage('com.your.native.host', { command: 'start_server', port: config.port });
  //   isServerRunning = true; // Assuming success, actual status might come via another message
  //   serverProcess = { port: config.port, on: () => {}, stop: () => {} }; // Mock serverProcess
  //   broadcastStatus('Starting...', 'starting'); // Initial status
  //   // Wait for a confirmation message from the native host or a timeout
  // } catch (error) {
  //   console.error('Failed to send native message to start server:', error);
  //   broadcastLog(\`Failed to request server start: ${(error as Error).message}\`, 'error');
  //   broadcastStatus('Failed to Start', 'stopped');
  //   return { success: false, error: 'Failed to request server start' };
  // }

  // SIMULATED START for now:
  // We will assume the server starts successfully elsewhere and will update its status
  // via a ping or a direct message if it were a real process.
  // The content script's checkServerStatus will attempt to connect.

  // To make the UI responsive, let's set it to 'starting'
  // and then rely on the content script's check or a manual "connect"
  // to determine the actual "running" state.
  
  // The serverProcess object here is a mock since the background script doesn't control the Node process directly.
  serverProcess = { 
    port: config.port, 
    // Mock methods that might have been used by launchWebSocketServer.js
    on: (event, callback) => {
      if (event === 'log') {
        // This would have been for logs from the server process itself
        // We'll use broadcastLog for logs from this manager
      } else if (event === 'connection') {
        // This would have been for client connection counts from the server
      }
    },
    stop: async () => { 
      // This would signal the actual server process to stop
      console.log("Mock server stop called");
    }
  };
  isServerRunning = true; // Assume it will start, actual check is needed
  broadcastStatus('Attempting to Start', 'starting');
  broadcastLog(`WebSocket server start initiated for port ${config.port}. Manual start of 'test-websocket-server-3710.cjs' might be required.`, 'info');

  // After a short delay, let's assume it's "Running" to allow the content script to try connecting.
  // In a real scenario, a health check or a message from the server process would confirm this.
  setTimeout(() => {
    // This is an optimistic update. The content script's WebSocket connection attempt
    // will be the real test.
    if (isServerRunning && serverProcess) { // Check if it wasn't stopped in the meantime
        broadcastStatus('Running (Assumed)', 'running');
        broadcastLog('Server assumed to be running. Content script will attempt connection.', 'info');
    }
  }, 2000);


  return { success: true }; // Indicates the "start process" was initiated.
}

/**
 * Stop the WebSocket server
 */
export async function stopWebSocketServer(): Promise<{ success: boolean; error?: string }> {
  if (!isServerRunning && !serverProcess) { // check serverProcess too
    broadcastLog('Attempted to stop server, but it is not running or not managed.', 'warn');
    return { success: false, error: 'Server is not running or not managed by this extension' };
  }

  broadcastLog('Attempting to stop WebSocket server...', 'info');
  // Similar to starting, the background script can't directly kill a Node.js process
  // it didn't spawn. It should request the VS Code extension or native host to stop it.

  // Placeholder for native messaging:
  // try {
  //   await chrome.runtime.sendNativeMessage('com.your.native.host', { command: 'stop_server' });
  //   // Assume success, actual status might come via another message
  // } catch (error) {
  //   console.error('Failed to send native message to stop server:', error);
  //   broadcastLog(\`Failed to request server stop: ${(error as Error).message}\`, 'error');
  //   broadcastStatus('Failed to Stop', 'running'); // Remains running if stop command failed
  //   return { success: false, error: 'Failed to request server stop' };
  // }

  // SIMULATED STOP:
  if (serverProcess && typeof serverProcess.stop === 'function') {
    try {
      await serverProcess.stop(); // Call mock stop
    } catch (e) {
      console.error("Error in mock serverProcess.stop():", e);
    }
  }
  serverProcess = null;
  isServerRunning = false;
  connectedClients = 0;
  broadcastStatus('Stopped', 'stopped');
  broadcastLog('WebSocket server stop initiated. If running manually, it needs to be stopped manually.', 'info');
  return { success: true };
}

/**
 * Restart the WebSocket server
 */
export async function restartWebSocketServer(config: ServerConfig): Promise<{ success: boolean; error?: string }> {
  broadcastLog('Restarting WebSocket server...', 'info');
  const stopResult = await stopWebSocketServer();
  if (!stopResult.success && stopResult.error !== 'Server is not running or not managed by this extension') { // Allow restart if not running
    return stopResult;
  }
  await new Promise(resolve => setTimeout(resolve, 500)); // Brief pause
  const startResult = await startWebSocketServer({
    port: config.port,
    saveLogsToFile: config.saveLogsToFile || false,
    logPath: config.logPath || ''
  });
  return startResult;
}

/**
 * Get current server status
 */
export function getServerStatus(): { 
  running: boolean; 
  port?: number; 
  statusMessage: string; // Added for more descriptive status
  state: string; // Added 'starting', 'stopping', 'running', 'stopped', 'error'
  connectedClients: number;
  logs: string[] 
} {
  let statusMessage = 'Unknown';
  let state = 'stopped';

  if (serverProcess && isServerRunning) {
    // This is tricky because isServerRunning is optimistically set.
    // We need a way to get the *actual* status if the background script
    // isn't the one managing the process directly.
    // For now, reflect the assumed state.
    statusMessage = `Running (Assumed) on port ${serverProcess.port}`;
    state = 'running'; 
    // If serverProcess had a 'getStatus' method, we'd call it.
  } else if (serverProcess && !isServerRunning) { // e.g. if it was starting or stopping
    statusMessage = `Server on port ${serverProcess.port} is not active.`;
    state = 'stopped'; // Or could be 'starting'/'stopping' if we had more fine-grained states
  } else {
    statusMessage = 'Server is stopped or unmanaged.';
    state = 'stopped';
  }

  return {
    running: isServerRunning,
    port: serverProcess?.port,
    statusMessage,
    state,
    connectedClients, // This would ideally come from the actual server process
    logs: [...serverLogs]
  };
}

/**
 * Clear server logs
 */
export function clearServerLogs(): void {
  serverLogs = [];
}

/**
 * Setup message handlers for server management
 */
export function setupServerMessageHandlers() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const handleAsyncResponse = async () => {
      switch (message.type) {
        case 'START_WS_SERVER': {
          const result = await startWebSocketServer({
            port: message.port || 3710,
            saveLogsToFile: message.saveLogsToFile || false, // These options are not used by test-websocket-server-3710.cjs
            logPath: message.logPath || '' // These options are not used by test-websocket-server-3710.cjs
          });
          // sendResponse(result); // Send response after async operation
          return result;
        }
        
        case 'STOP_WS_SERVER': {
          const result = await stopWebSocketServer();
          // sendResponse(result);
          return result;
        }
        
        case 'RESTART_WS_SERVER': {
          broadcastLog('Restarting WebSocket server...', 'info');
          const stopResult = await stopWebSocketServer();
          if (!stopResult.success && stopResult.error !== 'Server is not running or not managed by this extension') { // Allow restart if not running
            // sendResponse(stopResult);
            return stopResult;
          }
          await new Promise(resolve => setTimeout(resolve, 500)); // Brief pause
          const startResult = await startWebSocketServer({
            port: message.port || 3710,
            saveLogsToFile: message.saveLogsToFile || false,
            logPath: message.logPath || ''
          });
          // sendResponse(startResult);
          return startResult;
        }
        
        case 'GET_SERVER_STATUS': { // This is for popup or options page
          const status = getServerStatus();
          // sendResponse(status);
          return status;
        }

        case 'GET_SERVER_STATUS_FROM_CONTENT_SCRIPT': { // For content script initialization
          const status = getServerStatus();
           // sendResponse({ status: status.statusMessage, state: status.state });
           return { status: status.statusMessage, state: status.state };
        }
        
        case 'CLEAR_SERVER_LOGS': {
          clearServerLogs();
          broadcastLog('Server logs cleared.', 'system');
          // sendResponse({ success: true });
          return { success: true };
        }
      }
      return null; // Explicitly return null if not handled
    };
    
    // Ensure sendResponse is called for async operations
    if (['START_WS_SERVER', 'STOP_WS_SERVER', 'RESTART_WS_SERVER', 
         'GET_SERVER_STATUS', 'CLEAR_SERVER_LOGS', 
         'GET_SERVER_STATUS_FROM_CONTENT_SCRIPT'].includes(message.type)) {
      handleAsyncResponse().then(response => {
        if (response !== null) { // Check if it was handled
          try {
            sendResponse(response);
          } catch (e) {
            // This can happen if the message port was closed, e.g., popup closed.
            console.log("SendResponse error, likely port closed:", e.message);
          }
        }
      }).catch(error => {
        console.error('Error handling server message:', message.type, error);
        try {
          sendResponse({ success: false, error: error.message });
        } catch (e) {
            console.log("SendResponse error (in catch), likely port closed:", e.message);
        }
      });
      return true; // Required for async sendResponse
    }
    // Return false or undefined if not handling the message or not using sendResponse asynchronously
    return false; 
  });

  // Initial status broadcast when background script loads
  setTimeout(() => {
    const initialStatus = getServerStatus();
    broadcastStatus(initialStatus.statusMessage, initialStatus.state);
  }, 500);
}

// Functions to allow other parts of the extension (e.g., popup) to listen to logs/status
export function addServerLogListener(listener: (log: string, type?: string) => void) {
  serverLogListeners.push(listener);
}
export function removeServerLogListener(listener: (log: string, type?: string) => void) {
  serverLogListeners = serverLogListeners.filter(l => l !== listener);
}
export function addServerStatusListener(listener: (status: string, state: string) => void) {
  serverStatusListeners.push(listener);
}
export function removeServerStatusListener(listener: (status: string, state: string) => void) {
  serverStatusListeners = serverStatusListeners.filter(l => l !== listener);
}