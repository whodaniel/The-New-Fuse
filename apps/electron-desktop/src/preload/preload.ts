import { contextBridge, ipcRenderer } from 'electron';
import type { WindowAPI } from '../shared/types';

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
  chromeElementDetected: (elementData) =>
    ipcRenderer.invoke('chrome:element-detected', elementData),
  chromeSendMessage: (message) => ipcRenderer.invoke('chrome:send-message', message),

  // System methods
  systemStatus: () => ipcRenderer.invoke('system:status'),

  // Chat methods
  chatSend: (message) => ipcRenderer.invoke('chat:send', message),
  chatHistory: () => ipcRenderer.invoke('chat:history'),

  // Shell integration
  openExternal: (url) => ipcRenderer.invoke('shell:open-external', url),

  // Event listeners
  onSystemEvent: (callback) => {
    const subscription = (_: any, event: string, data: any) => callback(event, data);
    ipcRenderer.on('system-event', subscription);

    // Return unsubscribe function
    return () => ipcRenderer.removeListener('system-event', subscription);
  },

  offSystemEvent: (_callback) => {
    ipcRenderer.removeAllListeners('system-event');
  },
};

// Expose the API securely
contextBridge.exposeInMainWorld('api', api);

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
  getBookmarks: () => ipcRenderer.invoke('browser:get-bookmarks'),
  addBookmark: (bookmark: any) => ipcRenderer.invoke('browser:add-bookmark', bookmark),
  removeBookmark: (id: string) => ipcRenderer.invoke('browser:remove-bookmark', id),
  showHistory: () => ipcRenderer.invoke('browser:show-history'),
  getHistory: () => ipcRenderer.invoke('browser:get-history'),
  addHistory: (item: any) => ipcRenderer.invoke('browser:add-history', item),
  clearHistory: () => ipcRenderer.invoke('browser:clear-history'),
  showDownloads: () => ipcRenderer.invoke('browser:show-downloads'),
  showMore: () => ipcRenderer.invoke('browser:show-more'),
  // App integrations
  openTheia: () => ipcRenderer.invoke('app:open-theia'),
  startTheiaServer: () => ipcRenderer.invoke('app:start-theia'),
  openVSCode: () => ipcRenderer.invoke('app:open-vscode'),
  openTerminal: () => ipcRenderer.invoke('terminal:open'),
  openFileExplorer: () => ipcRenderer.invoke('app:open-file-explorer'),
  openTheiaTerminal: () => ipcRenderer.invoke('app:open-theia-terminal'),
  openTheiaGit: () => ipcRenderer.invoke('app:open-theia-git'),
  openTheiaDebugger: () => ipcRenderer.invoke('app:open-theia-debugger'),
  refreshServices: () => ipcRenderer.invoke('app:refresh-services'),
  // Terminal integration
  getTerminalOutput: () => ipcRenderer.invoke('terminal:get-output'),
  clearTerminal: () => ipcRenderer.invoke('terminal:clear'),
  // AI integration
  sendAIMessage: (provider: string, message: string) =>
    ipcRenderer.invoke('ai:send-message', provider, message),
  setAPIKey: (provider: string, key: string) => ipcRenderer.invoke('ai:set-api-key', provider, key),
  // Prompt management
  getPromptTemplates: () => ipcRenderer.invoke('prompt:get-templates'),
  createPromptTemplate: (template: any) => ipcRenderer.invoke('prompt:create-template', template),
  generatePrompt: (templateId: string, variables: any) =>
    ipcRenderer.invoke('prompt:generate', templateId, variables),
  // Workflow Builder
  createWorkflow: (workflow: any) => ipcRenderer.invoke('workflow:create', workflow),
  saveWorkflow: (workflow: any) => ipcRenderer.invoke('workflow:save', workflow),
  loadWorkflow: (workflowId: string) => ipcRenderer.invoke('workflow:load', workflowId),
  executeWorkflow: (workflow: any) => ipcRenderer.invoke('workflow:execute', workflow),
  listWorkflows: () => ipcRenderer.invoke('workflow:list'),
  // Extensions
  loadUnpackedExtension: () => ipcRenderer.invoke('extensions:load-unpacked'),
  installExtensionFromStore: (urlOrId: string) =>
    ipcRenderer.invoke('extensions:install-from-store', urlOrId),
  getLoadedExtensions: () => ipcRenderer.invoke('extensions:get-loaded'),
  // Playwright integration
  playwright: {
    open: (url: string) => ipcRenderer.invoke('playwright:open', url),
  },

  // Local Dev Tools
  runCommand: (command: string, cwd?: string) =>
    ipcRenderer.invoke('dev:run-command', command, cwd),
  scanPorts: () => ipcRenderer.invoke('dev:scan-ports'),
  killPort: (port: number) => ipcRenderer.invoke('dev:kill-port', port),
  getServiceStatus: () => ipcRenderer.invoke('dev:service-status'),

  // Dev Server Control
  startService: (service: string) => ipcRenderer.invoke('dev:start-service', service),
  stopService: (service: string) => ipcRenderer.invoke('dev:stop-service', service),
  restartService: (service: string) => ipcRenderer.invoke('dev:restart-service', service),

  // Quick Dev Commands
  buildAll: () => ipcRenderer.invoke('dev:build-all'),
  runTests: () => ipcRenderer.invoke('dev:run-tests'),
  runLint: () => ipcRenderer.invoke('dev:run-lint'),
  startDevMode: () => ipcRenderer.invoke('dev:start-dev-mode'),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
