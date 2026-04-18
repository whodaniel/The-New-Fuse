/**
 * Federation Manager for TNF Chrome Extension
 *
 * Manages channel membership, message routing, and coordination
 * between browser tabs running AI chat sessions.
 */

import { Logger } from '../utils/logger.js';

// ============================================================================
// TYPES (Inline to avoid import issues - mirrors shared types)
// ============================================================================

export type MemberType =
  | 'browser_tab'
  | 'vscode'
  | 'tauri'
  | 'local_llm'
  | 'mcp_server'
  | 'api_endpoint';
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
export type MemberStatus = 'active' | 'idle' | 'responding' | 'offline' | 'error';
export type ChannelMode =
  | 'broadcast'
  | 'round-robin'
  | 'first-responder'
  | 'orchestrated'
  | 'primary-only';

export interface FederationChannel {
  id: string;
  name: string;
  federationId: string;
  members: ChannelMember[];
  mode: ChannelMode;
  settings: ChannelSettings;
  createdAt: string;
  lastActivity: string;
  messageCount: number;
}

export interface ChannelMember {
  id: string;
  type: MemberType;
  platform?: AIPlatform;
  tabId?: number;
  windowId?: number;
  url?: string;
  name: string;
  status: MemberStatus;
  capabilities: string[];
  joinedAt: string;
  lastSeen: string;
}

export interface ChannelSettings {
  autoRoute: boolean;
  shareContext: boolean;
  syncMessages: boolean;
  primaryMemberId?: string;
}

export interface ChannelMessage {
  id: string;
  channelId: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  sourceMemberId: string;
  sourcePlatform?: AIPlatform;
  timestamp: string;
  requestResponse?: boolean;
}

// ============================================================================
// FEDERATION MANAGER
// ============================================================================

export class FederationManager {
  private logger: Logger;
  private channels: Map<string, FederationChannel> = new Map();
  private localMember: ChannelMember | null = null;
  private tabPlatformMap: Map<number, AIPlatform> = new Map();
  private relayConnection: WebSocket | null = null;
  private messageHandlers: Map<string, (message: any) => void> = new Map();
  private federationId: string = 'default';

  constructor() {
    this.logger = new Logger({
      name: 'FederationManager',
      level: 'info',
      saveToStorage: true,
    });
  }

  /**
   * Initialize the federation manager with relay connection
   */
  async initialize(relayUrl: string = 'ws://localhost:3000'): Promise<boolean> {
    try {
      this.logger.info('Initializing Federation Manager');

      // Connect to relay
      await this.connectToRelay(relayUrl);

      // Set up tab tracking
      this.setupTabTracking();

      // Load saved state
      await this.loadSavedState();

      this.logger.info('Federation Manager initialized');
      return true;
    } catch (error) {
      this.logger.error('Failed to initialize Federation Manager:', error);
      return false;
    }
  }

  /**
   * Connect to TNF Relay for federation coordination
   */
  private async connectToRelay(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.relayConnection = new WebSocket(url);

        this.relayConnection.onopen = () => {
          this.logger.info('Connected to TNF Relay for federation');
          this.registerWithRelay();
          resolve();
        };

        this.relayConnection.onmessage = (event) => {
          this.handleRelayMessage(JSON.parse(event.data));
        };

        this.relayConnection.onclose = () => {
          this.logger.warn('Disconnected from TNF Relay');
          // Attempt reconnection after delay
          setTimeout(() => this.connectToRelay(url), 5000);
        };

        this.relayConnection.onerror = (error) => {
          this.logger.error('Relay connection error:', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Register this extension instance with the relay
   */
  private registerWithRelay(): void {
    this.sendToRelay({
      type: 'FEDERATION_REGISTER',
      payload: {
        type: 'chrome_extension',
        capabilities: ['browser_control', 'chat_automation', 'tab_management'],
        version: '1.0.0',
      },
    });
  }

  /**
   * Handle incoming relay messages
   */
  private handleRelayMessage(message: any): void {
    this.logger.debug('Received relay message:', message.type);

    switch (message.type) {
      case 'FEDERATION_CHANNEL_CREATE':
        this.handleChannelCreate(message.payload);
        break;
      case 'FEDERATION_CHANNEL_UPDATE':
        this.handleChannelUpdate(message.payload);
        break;
      case 'FEDERATION_CHANNEL_DELETE':
        this.handleChannelDelete(message.payload);
        break;
      case 'FEDERATION_MEMBER_JOIN':
        this.handleMemberJoin(message.payload);
        break;
      case 'FEDERATION_MEMBER_LEAVE':
        this.handleMemberLeave(message.payload);
        break;
      case 'FEDERATION_CHANNEL_MESSAGE':
        this.handleChannelMessage(message.payload);
        break;
      case 'FEDERATION_CONTEXT_SYNC':
        this.handleContextSync(message.payload);
        break;
      case 'FEDERATION_ROUTE_REQUEST':
        this.handleRouteRequest(message.payload);
        break;
      case 'FEDERATION_STATUS_RESPONSE':
        this.handleStatusResponse(message.payload);
        break;
    }

    // Notify registered handlers
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      handler(message);
    }
  }

  /**
   * Send message to relay
   */
  private sendToRelay(message: any): void {
    if (this.relayConnection?.readyState === WebSocket.OPEN) {
      this.relayConnection.send(
        JSON.stringify({
          ...message,
          timestamp: new Date().toISOString(),
          source: {
            type: 'chrome_extension',
            memberId: this.localMember?.id,
          },
        })
      );
    }
  }

  // ============================================================================
  // CHANNEL MANAGEMENT
  // ============================================================================

  /**
   * Create a new channel
   */
  async createChannel(name: string, mode: ChannelMode = 'broadcast'): Promise<FederationChannel> {
    const channel: FederationChannel = {
      id: `channel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      federationId: this.federationId,
      members: [],
      mode,
      settings: {
        autoRoute: true,
        shareContext: true,
        syncMessages: true,
      },
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      messageCount: 0,
    };

    this.channels.set(channel.id, channel);

    // Notify relay
    this.sendToRelay({
      type: 'FEDERATION_CHANNEL_CREATE',
      payload: channel,
    });

    // Save state
    await this.saveState();

    this.logger.info(`Created channel: ${name} (${channel.id})`);
    return channel;
  }

  /**
   * Delete a channel
   */
  async deleteChannel(channelId: string): Promise<void> {
    this.channels.delete(channelId);

    this.sendToRelay({
      type: 'FEDERATION_CHANNEL_DELETE',
      payload: { channelId },
    });

    await this.saveState();
    this.logger.info(`Deleted channel: ${channelId}`);
  }

  /**
   * Get all channels
   */
  getChannels(): FederationChannel[] {
    return Array.from(this.channels.values());
  }

  /**
   * Get channel by ID
   */
  getChannel(channelId: string): FederationChannel | undefined {
    return this.channels.get(channelId);
  }

  // ============================================================================
  // MEMBER MANAGEMENT
  // ============================================================================

  /**
   * Add a browser tab to a channel
   */
  async addTabToChannel(tabId: number, channelId: string): Promise<ChannelMember | null> {
    const channel = this.channels.get(channelId);
    if (!channel) {
      this.logger.error(`Channel not found: ${channelId}`);
      return null;
    }

    // Get tab info
    const tab = await this.getTabInfo(tabId);
    if (!tab) {
      this.logger.error(`Tab not found: ${tabId}`);
      return null;
    }

    // Detect AI platform
    const platform = this.detectPlatform(tab.url || '');

    // Create member
    const member: ChannelMember = {
      id: `member_${tabId}_${Date.now()}`,
      type: 'browser_tab',
      platform,
      tabId,
      windowId: tab.windowId,
      url: tab.url,
      name: this.getPlatformDisplayName(platform) || tab.title || `Tab ${tabId}`,
      status: 'active',
      capabilities: this.getPlatformCapabilities(platform),
      joinedAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
    };

    // Add to channel
    channel.members.push(member);
    this.tabPlatformMap.set(tabId, platform);

    // Notify relay
    this.sendToRelay({
      type: 'FEDERATION_MEMBER_JOIN',
      payload: {
        channelId,
        member,
      },
    });

    await this.saveState();
    this.logger.info(`Added tab ${tabId} (${platform}) to channel ${channel.name}`);

    return member;
  }

  /**
   * Remove a tab from a channel
   */
  async removeTabFromChannel(tabId: number, channelId: string): Promise<void> {
    const channel = this.channels.get(channelId);
    if (!channel) return;

    const memberIndex = channel.members.findIndex((m) => m.tabId === tabId);
    if (memberIndex >= 0) {
      const member = channel.members[memberIndex];
      channel.members.splice(memberIndex, 1);

      this.sendToRelay({
        type: 'FEDERATION_MEMBER_LEAVE',
        payload: {
          channelId,
          memberId: member.id,
        },
      });

      await this.saveState();
      this.logger.info(`Removed tab ${tabId} from channel ${channel.name}`);
    }
  }

  /**
   * Get tabs in a channel
   */
  getChannelTabs(channelId: string): ChannelMember[] {
    const channel = this.channels.get(channelId);
    return channel?.members.filter((m) => m.type === 'browser_tab') || [];
  }

  /**
   * Find which channel a tab belongs to
   */
  findTabChannel(tabId: number): FederationChannel | undefined {
    for (const channel of this.channels.values()) {
      if (channel.members.some((m) => m.tabId === tabId)) {
        return channel;
      }
    }
    return undefined;
  }

  // ============================================================================
  // MESSAGE ROUTING
  // ============================================================================

  /**
   * Send a message to a channel
   */
  async sendChannelMessage(
    channelId: string,
    content: string,
    options?: {
      role?: 'user' | 'assistant' | 'system';
      requestResponse?: boolean;
      sourceTabId?: number;
    }
  ): Promise<void> {
    const channel = this.channels.get(channelId);
    if (!channel) {
      this.logger.error(`Channel not found: ${channelId}`);
      return;
    }

    const message: ChannelMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      channelId,
      content,
      role: options?.role || 'user',
      sourceMemberId: this.findMemberByTabId(options?.sourceTabId)?.id || 'unknown',
      sourcePlatform: options?.sourceTabId
        ? this.tabPlatformMap.get(options.sourceTabId)
        : undefined,
      timestamp: new Date().toISOString(),
      requestResponse: options?.requestResponse,
    };

    // Update channel stats
    channel.messageCount++;
    channel.lastActivity = message.timestamp;

    // Route based on channel mode
    switch (channel.mode) {
      case 'broadcast':
        await this.broadcastToChannel(channel, message);
        break;
      case 'round-robin':
        await this.roundRobinRoute(channel, message);
        break;
      case 'first-responder':
        await this.firstResponderRoute(channel, message);
        break;
      case 'primary-only':
        await this.primaryOnlyRoute(channel, message);
        break;
      case 'orchestrated':
        await this.orchestratedRoute(channel, message);
        break;
    }

    // Notify relay
    this.sendToRelay({
      type: 'FEDERATION_CHANNEL_MESSAGE',
      payload: message,
    });
  }

  /**
   * Broadcast message to all channel members
   */
  private async broadcastToChannel(
    channel: FederationChannel,
    message: ChannelMessage
  ): Promise<void> {
    for (const member of channel.members) {
      if (member.id !== message.sourceMemberId && member.type === 'browser_tab' && member.tabId) {
        await this.sendToTab(member.tabId, message);
      }
    }
  }

  /**
   * Round-robin routing to channel members
   */
  private async roundRobinRoute(
    channel: FederationChannel,
    message: ChannelMessage
  ): Promise<void> {
    // Get eligible members (not the source)
    const eligible = channel.members.filter(
      (m) => m.id !== message.sourceMemberId && m.type === 'browser_tab' && m.status === 'active'
    );

    if (eligible.length === 0) return;

    // Simple round-robin based on timestamp
    const index = channel.messageCount % eligible.length;
    const target = eligible[index];

    if (target.tabId) {
      await this.sendToTab(target.tabId, message);
    }
  }

  /**
   * First responder routing
   */
  private async firstResponderRoute(
    channel: FederationChannel,
    message: ChannelMessage
  ): Promise<void> {
    // Send to all, first response wins
    await this.broadcastToChannel(channel, {
      ...message,
      requestResponse: true,
    });
  }

  /**
   * Primary-only routing
   */
  private async primaryOnlyRoute(
    channel: FederationChannel,
    message: ChannelMessage
  ): Promise<void> {
    const primaryId = channel.settings.primaryMemberId;
    const primary = channel.members.find((m) => m.id === primaryId);

    if (primary?.tabId && primary.id !== message.sourceMemberId) {
      await this.sendToTab(primary.tabId, message);
    }
  }

  /**
   * Orchestrated routing (delegates to relay/orchestrator)
   */
  private async orchestratedRoute(
    channel: FederationChannel,
    message: ChannelMessage
  ): Promise<void> {
    this.sendToRelay({
      type: 'FEDERATION_ROUTE_REQUEST',
      payload: {
        channelId: channel.id,
        message,
        members: channel.members,
      },
    });
  }

  /**
   * Send message to a specific tab
   */
  private async sendToTab(tabId: number, message: ChannelMessage): Promise<void> {
    try {
      await chrome.tabs.sendMessage(tabId, {
        type: 'FEDERATION_MESSAGE',
        payload: message,
      });
    } catch (error) {
      this.logger.warn(`Failed to send to tab ${tabId}:`, error);
      // Update member status
      this.updateMemberStatus(tabId, 'offline');
    }
  }

  // ============================================================================
  // CONTEXT SYNCHRONIZATION
  // ============================================================================

  /**
   * Sync context across channel members
   */
  async syncContext(
    channelId: string,
    context: {
      messages: Array<{ role: string; content: string }>;
      summary?: string;
    }
  ): Promise<void> {
    const channel = this.channels.get(channelId);
    if (!channel || !channel.settings.shareContext) return;

    this.sendToRelay({
      type: 'FEDERATION_CONTEXT_SYNC',
      payload: {
        channelId,
        context,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // ============================================================================
  // MESSAGE HANDLERS
  // ============================================================================

  private handleChannelCreate(payload: any): void {
    const channel = payload as FederationChannel;
    if (!this.channels.has(channel.id)) {
      this.channels.set(channel.id, channel);
      this.logger.info(`Channel created externally: ${channel.name}`);
    }
  }

  private handleChannelUpdate(payload: any): void {
    const { channelId, updates } = payload;
    const channel = this.channels.get(channelId);
    if (channel) {
      Object.assign(channel, updates);
    }
  }

  private handleChannelDelete(payload: any): void {
    const { channelId } = payload;
    this.channels.delete(channelId);
    this.logger.info(`Channel deleted externally: ${channelId}`);
  }

  private handleMemberJoin(payload: any): void {
    const { channelId, member } = payload;
    const channel = this.channels.get(channelId);
    if (channel && !channel.members.find((m) => m.id === member.id)) {
      channel.members.push(member);
      this.logger.info(`Member joined externally: ${member.name} -> ${channel.name}`);
    }
  }

  private handleMemberLeave(payload: any): void {
    const { channelId, memberId } = payload;
    const channel = this.channels.get(channelId);
    if (channel) {
      channel.members = channel.members.filter((m) => m.id !== memberId);
    }
  }

  private async handleChannelMessage(payload: ChannelMessage): Promise<void> {
    // Route incoming message to appropriate tab
    const channel = this.channels.get(payload.channelId);
    if (!channel) return;

    // Find local tabs in this channel
    for (const member of channel.members) {
      if (member.type === 'browser_tab' && member.tabId) {
        await this.sendToTab(member.tabId, payload);
      }
    }
  }

  private handleContextSync(payload: any): void {
    // Handle context sync from other members
    this.logger.debug('Context sync received:', payload);
  }

  private handleRouteRequest(payload: any): void {
    // Handle orchestrated routing decisions
    this.logger.debug('Route request received:', payload);
  }

  private handleStatusResponse(payload: any): void {
    this.logger.debug('Status response received:', payload);
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Set up tab tracking
   */
  private setupTabTracking(): void {
    // Track tab updates
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete') {
        this.updateTabInfo(tabId, tab);
      }
    });

    // Track tab removal
    chrome.tabs.onRemoved.addListener((tabId) => {
      this.handleTabRemoved(tabId);
    });
  }

  /**
   * Update tab info when it changes
   */
  private updateTabInfo(tabId: number, tab: chrome.tabs.Tab): void {
    const platform = this.detectPlatform(tab.url || '');
    this.tabPlatformMap.set(tabId, platform);

    // Update member info in all channels
    for (const channel of this.channels.values()) {
      const member = channel.members.find((m) => m.tabId === tabId);
      if (member) {
        member.platform = platform;
        member.url = tab.url;
        member.lastSeen = new Date().toISOString();
      }
    }
  }

  /**
   * Handle tab removal
   */
  private handleTabRemoved(tabId: number): void {
    this.tabPlatformMap.delete(tabId);

    // Remove from all channels
    for (const channel of this.channels.values()) {
      channel.members = channel.members.filter((m) => m.tabId !== tabId);
    }

    this.saveState();
  }

  /**
   * Get tab info
   */
  private async getTabInfo(tabId: number): Promise<chrome.tabs.Tab | null> {
    try {
      return await chrome.tabs.get(tabId);
    } catch {
      return null;
    }
  }

  /**
   * Detect AI platform from URL
   */
  private detectPlatform(url: string): AIPlatform {
    const hostname = new URL(url).hostname.toLowerCase();

    if (hostname.includes('chat.openai.com') || hostname.includes('chatgpt.com')) {
      return 'chatgpt';
    }
    if (hostname.includes('claude.ai')) {
      return 'claude';
    }
    if (hostname.includes('gemini.google.com') || hostname.includes('bard.google.com')) {
      return 'gemini';
    }
    if (hostname.includes('perplexity.ai')) {
      return 'perplexity';
    }
    if (hostname.includes('deepseek.com')) {
      return 'deepseek';
    }
    if (hostname.includes('chat.qianwen.com') || hostname.includes('tongyi.aliyun.com')) {
      return 'qwen';
    }

    return 'custom';
  }

  /**
   * Get platform display name
   */
  private getPlatformDisplayName(platform: AIPlatform): string {
    const names: Record<AIPlatform, string> = {
      chatgpt: 'ChatGPT',
      claude: 'Claude',
      gemini: 'Gemini',
      perplexity: 'Perplexity',
      deepseek: 'DeepSeek',
      qwen: 'Qwen',
      copilot: 'Copilot',
      ollama: 'Ollama',
      custom: 'Custom AI',
    };
    return names[platform];
  }

  /**
   * Get platform capabilities
   */
  private getPlatformCapabilities(platform: AIPlatform): string[] {
    const baseCapabilities = ['chat', 'text_generation'];

    const platformCapabilities: Record<AIPlatform, string[]> = {
      chatgpt: [
        ...baseCapabilities,
        'code_generation',
        'image_generation',
        'web_search',
        'file_analysis',
      ],
      claude: [...baseCapabilities, 'code_generation', 'file_analysis', 'vision', 'artifacts'],
      gemini: [...baseCapabilities, 'code_generation', 'image_analysis', 'web_search'],
      perplexity: [...baseCapabilities, 'web_search', 'citations'],
      deepseek: [...baseCapabilities, 'code_generation', 'reasoning'],
      qwen: [...baseCapabilities, 'code_generation'],
      copilot: [...baseCapabilities, 'code_generation', 'web_search'],
      ollama: [...baseCapabilities],
      custom: [...baseCapabilities],
    };

    return platformCapabilities[platform];
  }

  /**
   * Find member by tab ID
   */
  private findMemberByTabId(tabId?: number): ChannelMember | undefined {
    if (!tabId) return undefined;

    for (const channel of this.channels.values()) {
      const member = channel.members.find((m) => m.tabId === tabId);
      if (member) return member;
    }
    return undefined;
  }

  /**
   * Update member status
   */
  private updateMemberStatus(tabId: number, status: MemberStatus): void {
    for (const channel of this.channels.values()) {
      const member = channel.members.find((m) => m.tabId === tabId);
      if (member) {
        member.status = status;
        member.lastSeen = new Date().toISOString();
      }
    }
  }

  /**
   * Register message handler
   */
  onMessage(type: string, handler: (message: any) => void): void {
    this.messageHandlers.set(type, handler);
  }

  /**
   * Save state to storage
   */
  private async saveState(): Promise<void> {
    try {
      await chrome.storage.local.set({
        federationChannels: Array.from(this.channels.entries()),
        federationId: this.federationId,
      });
    } catch (error) {
      this.logger.error('Failed to save federation state:', error);
    }
  }

  /**
   * Load saved state
   */
  private async loadSavedState(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(['federationChannels', 'federationId']);

      if (result.federationChannels) {
        this.channels = new Map(result.federationChannels);
      }

      if (result.federationId) {
        this.federationId = result.federationId;
      }

      this.logger.info(`Loaded ${this.channels.size} channels from storage`);
    } catch (error) {
      this.logger.error('Failed to load federation state:', error);
    }
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const federationManager = new FederationManager();
