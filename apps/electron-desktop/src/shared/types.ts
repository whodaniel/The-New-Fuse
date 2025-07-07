/**
 * Shared Types and Protocols for The New Fuse Hybrid Desktop System
 */

// Connection States
export interface ConnectionState {
  isConnected: boolean
  status: 'connecting' | 'connected' | 'disconnected' | 'error'
  lastConnected?: Date
  error?: string
}

// TNF Relay Types
export interface TNFRelayConfig {
  url: string
  port: number
  autoReconnect: boolean
  maxReconnectAttempts: number
}

export interface TNFRelayStatus extends ConnectionState {
  relayUrl?: string
  aiSessionActive: boolean
  currentPageMapping?: PageElementMapping
}

// MCP Types
export interface MCPConfig {
  host: string
  port: number
  protocol: 'http' | 'ws'
}

export interface MCPStatus extends ConnectionState {
  host?: string
  port?: number
  activeServers: string[]
}

// Element Detection Types (from background.ts)
export interface PageElementMapping {
  chatInput?: ElementInfo
  sendButton?: ElementInfo
  chatOutput?: ElementInfo
  messageContainer?: ElementInfo
  timestamp: number
  url: string
  domain: string
}

export interface ElementInfo {
  selector: string
  xpath: string
  tag: string
  id?: string
  classes: string[]
  text: string
  placeholder?: string
  type?: string
  role?: string
  ariaLabel?: string
  position: { x: number; y: number; width: number; height: number }
  isVisible: boolean
  isInteractable: boolean
  confidence: number
  elementType: 'input' | 'button' | 'output' | 'unknown'
}

// Port Monitoring Types
export interface PortStatus {
  port: number
  isOpen: boolean
  service?: string
  lastChecked: Date
  responseTime?: number
}

// Chat Types
export interface ChatMessage {
  id: string
  content: string
  timestamp: Date
  sender: 'user' | 'system' | 'ai' | 'chrome'
  metadata?: {
    platform?: string
    confidence?: number
    tabId?: number
    url?: string
  }
}

// Native Command Types
export interface NativeCommand {
  command: string
  args?: string[]
  description: string
}

export interface NativeCommandResult {
  success: boolean
  output?: string
  error?: string
  exitCode?: number
}

// System Status
export interface SystemStatus {
  tnfRelay: TNFRelayStatus
  mcp: MCPStatus
  ports: PortStatus[]
  nativeHost: ConnectionState
  chrome: ConnectionState
  uptime: number
  version: string
}

// Redux Store Types
export interface AppState {
  connections: {
    tnfRelay: TNFRelayStatus
    mcp: MCPStatus
    chrome: ConnectionState
  }
  elements: {
    mapping: PageElementMapping | null
    detectionActive: boolean
    selectedElement: ElementInfo | null
  }
  chat: {
    messages: ChatMessage[]
    isActive: boolean
  }
  ports: {
    monitored: number[]
    statuses: PortStatus[]
  }
  system: {
    status: SystemStatus | null
    settings: AppSettings
  }
}

// Settings Types
export interface AppSettings {
  autoConnectRelay: boolean
  enableAIAutomation: boolean
  saveElementMappings: boolean
  monitoredPorts: number[]
  theme: 'light' | 'dark'
  debugMode: boolean
}

// IPC Types for Electron communication
export interface IpcResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

// Window API types (exposed through preload)
export interface WindowAPI {
  // TNF Relay
  tnfConnect: (config: TNFRelayConfig) => Promise<IpcResponse<boolean>>
  tnfDisconnect: () => Promise<IpcResponse<boolean>>
  tnfStatus: () => Promise<IpcResponse<TNFRelayStatus>>
  
  // MCP
  mcpConnect: (config: MCPConfig) => Promise<IpcResponse<boolean>>
  mcpDisconnect: () => Promise<IpcResponse<boolean>>
  mcpStatus: () => Promise<IpcResponse<MCPStatus>>
  
  // Port monitoring
  portsAdd: (port: number) => Promise<IpcResponse<boolean>>
  portsRemove: (port: number) => Promise<IpcResponse<boolean>>
  portsList: () => Promise<IpcResponse<number[]>>
  portsStatus: () => Promise<IpcResponse<PortStatus[]>>
  
  // Native commands
  nativeExecute: (command: string, args?: string[]) => Promise<IpcResponse<NativeCommandResult>>
  
  // Chrome extension
  chromeElementDetected: (elementData: ElementInfo) => Promise<IpcResponse<boolean>>
  chromeSendMessage: (message: any) => Promise<IpcResponse<any>>
  
  // System
  systemStatus: () => Promise<IpcResponse<SystemStatus>>
  
  // Chat
  chatSend: (message: string) => Promise<IpcResponse<ChatMessage>>
  chatHistory: () => Promise<IpcResponse<ChatMessage[]>>
  
  // Events
  onSystemEvent: (callback: (event: string, data: any) => void) => void
  offSystemEvent: (callback: (event: string, data: any) => void) => void
}

declare global {
  interface Window {
    api: WindowAPI
  }
}
