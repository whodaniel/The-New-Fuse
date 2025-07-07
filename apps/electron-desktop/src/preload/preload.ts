import { contextBridge, ipcRenderer } from 'electron'
import type { WindowAPI } from '../shared/types'

// Create the API object with proper typing
const api: WindowAPI = {
  // TNF Relay methods
  tnfConnect: (config) => ipcRenderer.invoke('tnf:connect', config),
  tnfDisconnect: () => ipcRenderer.invoke('tnf:disconnect'),
  tnfStatus: () => ipcRenderer.invoke('tnf:status'),
  
  // MCP methods
  mcpConnect: (config) => ipcRenderer.invoke('mcp:connect', config),
  mcpDisconnect: () => ipcRenderer.invoke('mcp:disconnect'),
  mcpStatus: () => ipcRenderer.invoke('mcp:status'),
  
  // Port monitoring methods
  portsAdd: (port) => ipcRenderer.invoke('ports:add', port),
  portsRemove: (port) => ipcRenderer.invoke('ports:remove', port),
  portsList: () => ipcRenderer.invoke('ports:list'),
  portsStatus: () => ipcRenderer.invoke('ports:status'),
  
  // Native command methods
  nativeExecute: (command, args) => ipcRenderer.invoke('native:execute', command, args),
  
  // Chrome extension methods
  chromeElementDetected: (elementData) => ipcRenderer.invoke('chrome:element-detected', elementData),
  chromeSendMessage: (message) => ipcRenderer.invoke('chrome:send-message', message),
  
  // System methods
  systemStatus: () => ipcRenderer.invoke('system:status'),
  
  // Chat methods
  chatSend: (message) => ipcRenderer.invoke('chat:send', message),
  chatHistory: () => ipcRenderer.invoke('chat:history'),
  
  // Event listeners
  onSystemEvent: (callback) => {
    const subscription = (_: any, event: string, data: any) => callback(event, data)
    ipcRenderer.on('system-event', subscription)
    
    // Return unsubscribe function
    return () => ipcRenderer.removeListener('system-event', subscription)
  },
  
  offSystemEvent: (_callback) => {
    ipcRenderer.removeAllListeners('system-event')
  }
}

// Expose the API securely
contextBridge.exposeInMainWorld('api', api)
