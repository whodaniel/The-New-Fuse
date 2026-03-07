/**
 * TNF Federation Types
 *
 * Defines the data structures for the Federation system that enables
 * grouping browser tabs (AI chats) into channels for coordinated
 * multi-AI conversations.
 */

// ============================================================================
// FEDERATION CORE TYPES
// ============================================================================

/**
 * Top-level federation grouping
 */
export interface Federation {
  id: string;
  name: string;
  description?: string;
  channels: FederationChannel[];
  createdAt: string;
  updatedAt: string;
  createdBy: 'user' | 'system';
  status: 'active' | 'paused' | 'archived';
  settings: FederationSettings;
  metadata?: Record<string, any>;
}

export interface FederationSettings {
  allowAutoJoin: boolean; // New tabs auto-join based on rules
  defaultChannelId?: string; // Default channel for new members
  persistSessions: boolean; // Save sessions to backend
  shareContextGlobally: boolean; // Share context across all channels
}

/**
 * A communication channel within a federation
 */
export interface FederationChannel {
  id: string;
  name: string;
  description?: string;
  federationId: string;
  members: ChannelMember[];
  mode: ChannelMode;
  settings: ChannelSettings;
  createdAt: string;
  lastActivity: string;
  messageCount: number;
}

export type ChannelMode =
  | 'broadcast' // Message goes to all members
  | 'round-robin' // Messages distributed evenly
  | 'first-responder' // First member to respond wins
  | 'orchestrated' // AI orchestrator decides routing
  | 'primary-only'; // Only primary member receives

export interface ChannelSettings {
  autoRoute: boolean; // Auto-route to best member
  shareContext: boolean; // Share conversation context
  syncMessages: boolean; // Sync messages across members
  primaryMemberId?: string; // Default responder
  routingRules?: RoutingRule[]; // Custom routing logic
  maxConcurrent?: number; // Max concurrent requests
}

export interface RoutingRule {
  id: string;
  condition: RoutingCondition;
  targetMemberId?: string;
  targetPlatform?: AIPlatform;
  priority: number;
}

export interface RoutingCondition {
  type: 'keyword' | 'regex' | 'capability' | 'all';
  value: string;
}

// ============================================================================
// CHANNEL MEMBER TYPES
// ============================================================================

/**
 * A member of a federation channel
 */
export interface ChannelMember {
  id: string;
  type: MemberType;
  platform?: AIPlatform;
  source: MemberSource;
  name: string;
  status: MemberStatus;
  capabilities: string[];
  joinedAt: string;
  lastSeen: string;
  connectionInfo: ConnectionInfo;
  metadata?: Record<string, any>;
}

export type MemberType =
  | 'browser_tab' // Chrome/browser tab with AI chat
  | 'vscode' // VS Code extension
  | 'tauri' // Tauri desktop app agent
  | 'local_llm' // Local LLM (Ollama, etc.)
  | 'mcp_server' // MCP server tool
  | 'api_endpoint'; // Direct API connection

export type AIPlatform =
  | 'chatgpt'
  | 'claude'
  | 'gemini'
  | 'perplexity'
  | 'deepseek'
  | 'qwen'
  | 'copilot'
  | 'ollama'
  | 'custom';

export interface MemberSource {
  appType: 'chrome_extension' | 'vscode_extension' | 'tauri_app' | 'relay_direct';
  instanceId: string;
}

export type MemberStatus =
  | 'active' // Ready and responsive
  | 'idle' // Connected but not in use
  | 'responding' // Currently generating response
  | 'offline' // Disconnected
  | 'error'; // In error state

export interface ConnectionInfo {
  // For browser tabs
  tabId?: number;
  windowId?: number;
  url?: string;

  // For VS Code
  workspaceId?: string;

  // For Tauri
  windowLabel?: string;

  // For all
  relayClientId?: string;
  lastHeartbeat?: string;
}

// ============================================================================
// FEDERATION MESSAGE TYPES
// ============================================================================

/**
 * Message types for federation communication
 */
export enum FederationMessageType {
  // Channel Management
  CHANNEL_CREATE = 'FEDERATION_CHANNEL_CREATE',
  CHANNEL_UPDATE = 'FEDERATION_CHANNEL_UPDATE',
  CHANNEL_DELETE = 'FEDERATION_CHANNEL_DELETE',

  // Member Management
  MEMBER_JOIN = 'FEDERATION_MEMBER_JOIN',
  MEMBER_LEAVE = 'FEDERATION_MEMBER_LEAVE',
  MEMBER_UPDATE = 'FEDERATION_MEMBER_UPDATE',
  MEMBER_STATUS = 'FEDERATION_MEMBER_STATUS',

  // Message Routing
  CHANNEL_MESSAGE = 'FEDERATION_CHANNEL_MESSAGE',
  DIRECT_MESSAGE = 'FEDERATION_DIRECT_MESSAGE',
  BROADCAST = 'FEDERATION_BROADCAST',

  // Context Sync
  CONTEXT_SYNC = 'FEDERATION_CONTEXT_SYNC',
  CONTEXT_REQUEST = 'FEDERATION_CONTEXT_REQUEST',

  // Orchestration
  ROUTE_REQUEST = 'FEDERATION_ROUTE_REQUEST',
  ROUTE_RESPONSE = 'FEDERATION_ROUTE_RESPONSE',
  TASK_ASSIGN = 'FEDERATION_TASK_ASSIGN',
  TASK_COMPLETE = 'FEDERATION_TASK_COMPLETE',

  // Status
  HEARTBEAT = 'FEDERATION_HEARTBEAT',
  STATUS_REQUEST = 'FEDERATION_STATUS_REQUEST',
  STATUS_RESPONSE = 'FEDERATION_STATUS_RESPONSE',
}

/**
 * Base federation message
 */
export interface FederationMessage {
  id: string;
  type: FederationMessageType;
  federationId: string;
  channelId?: string;
  source: FederationMessageSource;
  target?: FederationMessageTarget;
  payload: any;
  timestamp: string;
  correlationId?: string;
  metadata?: Record<string, any>;
}

export interface FederationMessageSource {
  memberId: string;
  memberType: MemberType;
  platform?: AIPlatform;
}

export interface FederationMessageTarget {
  memberId?: string; // Specific member
  channelId?: string; // All channel members
  federationId?: string; // All federation members
  memberType?: MemberType; // All of a certain type
  platform?: AIPlatform; // All of a certain platform
}

// ============================================================================
// CHANNEL MESSAGE PAYLOAD TYPES
// ============================================================================

export interface ChannelMessagePayload {
  content: string;
  role: 'user' | 'assistant' | 'system';
  originalPlatform?: AIPlatform;
  attachments?: MessageAttachment[];
  requestResponse?: boolean; // Expect a response
}

export interface MessageAttachment {
  type: 'code' | 'file' | 'image' | 'url';
  content: string;
  filename?: string;
  language?: string;
}

export interface ContextSyncPayload {
  conversationId: string;
  messages: SyncedMessage[];
  summary?: string;
  metadata?: Record<string, any>;
}

export interface SyncedMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  platform?: AIPlatform;
  timestamp: string;
}

// ============================================================================
// UNIFIED SESSION TYPES (Backend Integration)
// ============================================================================

/**
 * Extends standard ChatSession with federation capabilities
 */
export interface UnifiedChatSession {
  // Core session fields
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;

  // Messages
  messages: UnifiedChatMessage[];

  // Federation integration
  federationId?: string;
  channelId?: string;
  syncEnabled: boolean;

  // Participants
  participants: SessionParticipant[];

  // Source tracking
  source: 'tauri' | 'vscode' | 'chrome' | 'api';

  // Metadata
  metadata?: {
    purpose?: string;
    tags?: string[];
    customData?: Record<string, any>;
  };
}

export interface UnifiedChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'agent';
  content: string;
  timestamp: string;

  // Source tracking
  source: MessageSource;

  // Federation sync
  syncedFrom?: string; // Original member ID if synced
  syncedAt?: string;

  // Attachments
  attachments?: MessageAttachment[];

  // Metadata
  metadata?: Record<string, any>;
}

export interface MessageSource {
  participantId: string;
  participantType: MemberType;
  platform?: AIPlatform;
  model?: string;
}

export interface SessionParticipant {
  id: string;
  type: 'user' | 'agent' | 'browser_tab' | 'mcp_tool';
  name: string;
  platform?: AIPlatform;
  provider?: string;
  joinedAt: string;
  lastActive?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a new federation message
 */
export function createFederationMessage(
  type: FederationMessageType,
  federationId: string,
  source: FederationMessageSource,
  payload: any,
  options?: {
    channelId?: string;
    target?: FederationMessageTarget;
    correlationId?: string;
  }
): FederationMessage {
  return {
    id: `fed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    federationId,
    channelId: options?.channelId,
    source,
    target: options?.target,
    payload,
    timestamp: new Date().toISOString(),
    correlationId: options?.correlationId,
  };
}

/**
 * Create a new channel member
 */
export function createChannelMember(
  type: MemberType,
  name: string,
  source: MemberSource,
  connectionInfo: ConnectionInfo,
  options?: {
    platform?: AIPlatform;
    capabilities?: string[];
    metadata?: Record<string, any>;
  }
): ChannelMember {
  const now = new Date().toISOString();
  return {
    id: `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    platform: options?.platform,
    source,
    name,
    status: 'active',
    capabilities: options?.capabilities || [],
    joinedAt: now,
    lastSeen: now,
    connectionInfo,
    metadata: options?.metadata,
  };
}

/**
 * Create a new federation
 */
export function createFederation(
  name: string,
  options?: {
    description?: string;
    settings?: Partial<FederationSettings>;
  }
): Federation {
  const now = new Date().toISOString();
  return {
    id: `fed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    description: options?.description,
    channels: [],
    createdAt: now,
    updatedAt: now,
    createdBy: 'user',
    status: 'active',
    settings: {
      allowAutoJoin: true,
      persistSessions: true,
      shareContextGlobally: false,
      ...options?.settings,
    },
  };
}

/**
 * Create a new channel
 */
export function createChannel(
  name: string,
  federationId: string,
  options?: {
    description?: string;
    mode?: ChannelMode;
    settings?: Partial<ChannelSettings>;
  }
): FederationChannel {
  const now = new Date().toISOString();
  return {
    id: `channel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    description: options?.description,
    federationId,
    members: [],
    mode: options?.mode || 'broadcast',
    settings: {
      autoRoute: true,
      shareContext: true,
      syncMessages: true,
      ...options?.settings,
    },
    createdAt: now,
    lastActivity: now,
    messageCount: 0,
  };
}
