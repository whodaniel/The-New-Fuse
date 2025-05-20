/**
 * WebSocket Server Manager
 * 
 * Handles starting, stopping, and monitoring the WebSocket server
 */

import type { ServerProcess } from '../../launchWebSocketServer.js';

interface ServerConfig {
  port: number;
  saveLogsToFile: boolean;
  logPath: string;
}

let serverProcess: any = null;
let isServerRunning = false;
let connectedClients = 0;
let serverLogs: string[] = [];

/**
 * Start the WebSocket server
 */
export async function startWebSocketServer(config: ServerConfig): Promise<{ success: boolean; error?: string }> {
  if (isServerRunning) {
    return { success: false, error: 'Server is already running' };
  }

  try {
    // Import the WebSocket server module
    const launchWebSocketServer = await import('../../launchWebSocketServer.js') as any;
    
    // Start the server with the provided config
    serverProcess = await launchWebSocketServer.launchServer({
      port: config.port,
      logToFile: config.saveLogsToFile,
      logFilePath: config.logPath
    });
    
    // Set up log handler
    if (serverProcess && serverProcess.on) {
      serverProcess.on('log', (logEntry: string) => {
        serverLogs.push(logEntry);
        // Limit log size to prevent memory issues
        if (serverLogs.length > 1000) {
          serverLogs.shift();
        }
        
        // Broadcast log to any listeners
        chrome.runtime.sendMessage({
          type: 'SERVER_LOG',
          log: logEntry
        }).catch(() => {
          // Ignore errors from sending messages when no listeners
        });
      });
      
      serverProcess.on('connection', (count: number) => {
        connectedClients = count;
        chrome.runtime.sendMessage({
          type: 'SERVER_CLIENTS_UPDATED',
          count: connectedClients
        }).catch(() => {
          // Ignore errors from sending messages when no listeners
        });
      });
    }
    
    isServerRunning = true;
    return { success: true };
  } catch (error) {
    console.error('Failed to start WebSocket server:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Stop the WebSocket server
 */
export async function stopWebSocketServer(): Promise<{ success: boolean; error?: string }> {
  if (!isServerRunning || !serverProcess) {
    return { success: false, error: 'Server is not running' };
  }

  try {
    // Stop the server
    if (serverProcess.stop) {
      await serverProcess.stop();
    } else if (serverProcess.kill) {
      serverProcess.kill();
    }
    
    serverProcess = null;
    isServerRunning = false;
    connectedClients = 0;
    
    return { success: true };
  } catch (error) {
    console.error('Failed to stop WebSocket server:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Restart the WebSocket server
 */
export async function restartWebSocketServer(config: ServerConfig): Promise<{ success: boolean; error?: string }> {
  // Stop the server first
  const stopResult = await stopWebSocketServer();
  if (!stopResult.success) {
    return stopResult;
  }
  
  // Wait a brief moment
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Start the server again
  return startWebSocketServer(config);
}

/**
 * Get current server status
 */
export function getServerStatus(): { 
  running: boolean; 
  port?: number; 
  connectedClients: number;
  logs: string[] 
} {
  return {
    running: isServerRunning,
    port: serverProcess?.port,
    connectedClients,
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
            port: message.port || 3712,
            saveLogsToFile: message.saveLogsToFile || false,
            logPath: message.logPath || ''
          });
          return result;
        }
        
        case 'STOP_WS_SERVER': {
          const result = await stopWebSocketServer();
          return result;
        }
        
        case 'RESTART_WS_SERVER': {
          const result = await restartWebSocketServer({
            port: message.port || 3712,
            saveLogsToFile: message.saveLogsToFile || false,
            logPath: message.logPath || ''
          });
          return result;
        }
        
        case 'GET_SERVER_STATUS': {
          return getServerStatus();
        }
        
        case 'CLEAR_SERVER_LOGS': {
          clearServerLogs();
          return { success: true };
        }
      }
      
      // Not handled by this module
      return null;
    };
    
    // Handle async responses
    if (['START_WS_SERVER', 'STOP_WS_SERVER', 'RESTART_WS_SERVER', 'GET_SERVER_STATUS', 'CLEAR_SERVER_LOGS'].includes(message.type)) {
      handleAsyncResponse().then(result => {
        if (result !== null) {
          sendResponse(result);
        }
      }).catch(error => {
        console.error('Error handling server message:', error);
        sendResponse({ 
          success: false, 
          error: error instanceof Error ? error.message : String(error)
        });
      });
      
      return true; // Indicates async response
    }
    
    return false; // Not handled by this module
  });
}