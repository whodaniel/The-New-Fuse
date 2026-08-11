import {
  FederationNodeClient,
  generateFederationId,
  type FederationChannel,
  type FederationChannelMessage,
  type FederationNodeEvent,
} from '../lib/sharedFederation';
import { EventEmitter } from './EventEmitter';

export type FederationNodeServiceEvent = FederationNodeEvent;

/** `platform` the TNF Chrome extension registers under on the relay. */
export const BROWSER_EXTENSION_PLATFORM = 'chrome-extension';

class FederationNodeServiceClass extends EventEmitter<FederationNodeServiceEvent> {
  private client: FederationNodeClient;
  private relayUrl = 'ws://127.0.0.1:3000/ws';

  constructor() {
    super();
    this.client = new FederationNodeClient({
      platform: 'tauri-desktop',
      agentName: 'TNF Operator Node',
      agentId: generateFederationId('tauri-node'),
      autoRegister: true,
    });
    this.bindClientEvents();
  }

  private bindClientEvents(): void {
    const events: FederationNodeEvent[] = [
      'connected',
      'disconnected',
      'registered',
      'registration_error',
      'agents_updated',
      'channels_updated',
      'channel_joined',
      'channel_message',
      'direct_message',
      'error',
      'activity',
    ];
    for (const event of events) {
      this.client.on(event, (...args: unknown[]) => {
        this.emit(event, args.length <= 1 ? args[0] : args);
      });
    }
  }

  setRelayUrl(url: string): void {
    this.relayUrl = url;
    this.client.setRelayUrl(url);
    if (this.client.isConnected()) {
      this.client.disconnect();
      void this.client.connect(url);
    }
  }

  getState() {
    return this.client.getState();
  }

  isConnected(): boolean {
    return this.client.isConnected();
  }

  isRegistered(): boolean {
    return this.client.isRegistered();
  }

  /**
   * Whether the TNF Chrome extension is present on the relay.
   *
   * The extension registers itself with `AGENT_REGISTER` and
   * `platform: 'chrome-extension'` (see apps/chrome-extension v6 background),
   * so its presence is observable only through the federation agent list.
   * Changes are announced by the `agents_updated` event.
   */
  isBrowserExtensionConnected(): boolean {
    return this.getState().agents.some(
      (agent) => String(agent.platform) === BROWSER_EXTENSION_PLATFORM
    );
  }

  async connect(relayUrl?: string): Promise<boolean> {
    return this.client.connect(relayUrl || this.relayUrl);
  }

  disconnect(): void {
    this.client.disconnect();
  }

  requestChannelList(): void {
    this.client.requestChannelList();
  }

  requestAgentList(): void {
    this.client.requestAgentList();
  }

  createChannel(name: string, description?: string, isPrivate?: boolean): void {
    this.client.createChannel(name, description, isPrivate);
  }

  joinChannel(channelId: string): void {
    this.client.joinChannel(channelId);
  }

  leaveChannel(channelId: string): void {
    this.client.leaveChannel(channelId);
  }

  sendChannelMessage(channelId: string, content: string, metadata?: Record<string, unknown>): void {
    this.client.sendChannelMessage(channelId, content, metadata);
  }

  publishDesktopPresence(presence: Record<string, unknown>): void {
    this.client.registerAgent({ metadata: { desktopPresence: presence } });
  }

  sendA2AMessage(targetAgentId: string, content: string, messageType = 'task'): void {
    const joined = this.client.getState().joinedChannels;
    const channelId = joined[0] || 'general';
    this.client.sendChannelMessage(channelId, content, {
      a2a: true,
      messageType,
      target: targetAgentId,
      to: targetAgentId,
    });
  }

  pauseChannel(channelId: string): void {
    this.client.pauseChannel(channelId);
  }

  resumeChannel(channelId: string): void {
    this.client.resumeChannel(channelId);
  }
}

export type { FederationChannel, FederationChannelMessage };
export const FederationNodeService = new FederationNodeServiceClass();
export default FederationNodeService;
