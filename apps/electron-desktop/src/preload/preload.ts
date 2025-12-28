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
  
  // Shell integration
  openExternal: (url) => ipcRenderer.invoke('shell:open-external', url),
  
  // Secure Storage / API Key Management
  secureStorageSave: (provider: string, apiKey: string, customName?: string, metadata?: Record<string, string>) => 
    ipcRenderer.invoke('secure-storage:save', provider, apiKey, customName, metadata),
  secureStorageGet: (provider: string) => 
    ipcRenderer.invoke('secure-storage:get', provider),
  secureStorageDelete: (provider: string) => 
    ipcRenderer.invoke('secure-storage:delete', provider),
  secureStorageList: () => 
    ipcRenderer.invoke('secure-storage:list'),
  secureStorageHas: (provider: string) => 
    ipcRenderer.invoke('secure-storage:has', provider),
  secureStorageStatus: () => 
    ipcRenderer.invoke('secure-storage:status'),
  secureStorageProviders: () => 
    ipcRenderer.invoke('secure-storage:providers'),
  
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

// Browser Hub compatibility API (expected by static Browser Hub HTML)
const electronAPI = {
  invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
  // Browser controls
  createNewTab: (options: any) => ipcRenderer.invoke('browser:new-tab', options),
  setBrowserEngine: (engine: string) => ipcRenderer.invoke('browser:set-engine', engine),
  navigateToUrl: (url: string) => ipcRenderer.invoke('browser:navigate', url),
  browserAction: (action: string) => ipcRenderer.invoke('browser:action', action),
  toggleDevTools: () => ipcRenderer.invoke('browser:toggle-devtools'),
  takeScreenshot: () => ipcRenderer.invoke('browser:screenshot'),
  generatePDF: () => ipcRenderer.invoke('browser:generate-pdf'),
  startRecording: () => ipcRenderer.invoke('browser:start-recording'),
  toggleBookmarks: () => ipcRenderer.invoke('browser:toggle-bookmarks'),
  showHistory: () => ipcRenderer.invoke('browser:show-history'),
  showDownloads: () => ipcRenderer.invoke('browser:show-downloads'),
  showMore: () => ipcRenderer.invoke('browser:show-more'),
  // App integrations
  openTheia: () => ipcRenderer.invoke('app:open-theia'),
  startTheiaServer: () => ipcRenderer.invoke('app:start-theia'),
  openVSCode: () => ipcRenderer.invoke('app:open-vscode'),
  openTerminal: () => ipcRenderer.invoke('app:open-terminal'),
  openFileExplorer: () => ipcRenderer.invoke('app:open-file-explorer'),
  openTheiaTerminal: () => ipcRenderer.invoke('app:open-theia-terminal'),
  openTheiaGit: () => ipcRenderer.invoke('app:open-theia-git'),
  openTheiaDebugger: () => ipcRenderer.invoke('app:open-theia-debugger'),
  refreshServices: () => ipcRenderer.invoke('app:refresh-services'),
  // Terminal integration
  getTerminalOutput: () => ipcRenderer.invoke('terminal:get-output'),
  clearTerminal: () => ipcRenderer.invoke('terminal:clear'),
  // Prompt management
  getPromptTemplates: () => ipcRenderer.invoke('prompt:get-templates'),
  createPromptTemplate: (template: any) => ipcRenderer.invoke('prompt:create-template', template),
  generatePrompt: (templateId: string, variables: any) => ipcRenderer.invoke('prompt:generate', templateId, variables),
  // Secure Storage / API Key Management
  secureStorage: {
    save: (provider: string, apiKey: string, customName?: string, metadata?: Record<string, string>) => 
      ipcRenderer.invoke('secure-storage:save', provider, apiKey, customName, metadata),
    get: (provider: string) => 
      ipcRenderer.invoke('secure-storage:get', provider),
    delete: (provider: string) => 
      ipcRenderer.invoke('secure-storage:delete', provider),
    list: () => 
      ipcRenderer.invoke('secure-storage:list'),
    has: (provider: string) => 
      ipcRenderer.invoke('secure-storage:has', provider),
    status: () => 
      ipcRenderer.invoke('secure-storage:status'),
    providers: () => 
      ipcRenderer.invoke('secure-storage:providers'),
  }
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
