import { useCallback, useEffect, useRef, useState } from 'react';
import { FederationRelayClient } from '../lib/federation-relay-client';

export interface TnfFederationState {
  connected: boolean;
  registered: boolean;
  authenticated: boolean;
  agents: Map<string, any>;
  channels: Map<string, any>;
  messages: TnfChannelMessage[];
  heartbeatStatus: 'healthy' | 'degraded' | 'not-connected';
  governanceStatus: Record<string, boolean>;
}

export interface TnfChannelMessage {
  id: string;
  senderId: string;
  channelId: string;
  content: string;
  timestamp: number;
}

/**
 * TNF Federation Relay (packages/relay-core standalone-relay.ts).
 * Live deployment currently runs on :3007 (`--port` / RELAY_PORT override);
 * code default is :3000. Override via relayUrl argument or env.
 */
const DEFAULT_RELAY_URL =
  (typeof process !== 'undefined' && process.env?.TNF_RELAY_URL) || 'ws://127.0.0.1:3007/ws';

const MAX_BUFFERED_MESSAGES = 100;

export function useTnfFederation(relayUrl?: string) {
  const [state, setState] = useState<TnfFederationState>({
    connected: false,
    registered: false,
    authenticated: false,
    agents: new Map(),
    channels: new Map(),
    messages: [],
    heartbeatStatus: 'not-connected',
    governanceStatus: {},
  });

  const clientRef = useRef<FederationRelayClient | null>(null);

  const connect = useCallback(async () => {
    const url = relayUrl || DEFAULT_RELAY_URL;
    const client = new FederationRelayClient({
      relayUrl: url,
      agentId: `browser-control-surface-${Date.now()}`,
      platform: 'web-browser',
      provider: 'TNF_NATIVE',
      capabilities: ['federation-channels', 'browser-control', 'terminal-heartbeat'],
      daccRole: 'broker',
    });

    try {
      await client.connect(url);
      clientRef.current = client;

      client.on('connected', () => {
        setState((prev) => ({ ...prev, connected: true }));
      });

      client.on('registered', () => {
        setState((prev) => ({
          ...prev,
          registered: true,
          authenticated: client.authenticated,
          heartbeatStatus: 'healthy',
        }));
        console.log('[TNF Federation] Registered successfully');
      });

      // Relay broadcasts AGENT_LIST / CHANNEL_LIST (mapped to these events)
      client.on('agents_updated', (agents: any[]) => {
        setState((prev) => ({
          ...prev,
          agents: new Map((agents ?? []).map((a) => [a.id ?? a.agentId, a])),
        }));
      });

      client.on('channels_updated', (channels: any[]) => {
        setState((prev) => ({
          ...prev,
          channels: new Map((channels ?? []).map((c) => [c.id, c])),
        }));
      });

      // Inbound CHANNEL_MESSAGE payload: { id, from, channel, content, timestamp }
      client.on('channel_message', (message: any) => {
        setState((prev) => ({
          ...prev,
          messages: [
            ...prev.messages.slice(-(MAX_BUFFERED_MESSAGES - 1)),
            {
              id: message?.id ?? `${Date.now()}`,
              senderId: message?.from ?? 'unknown',
              channelId: message?.channel ?? '',
              content: message?.content ?? '',
              timestamp: message?.timestamp ?? Date.now(),
            },
          ],
        }));
      });

      client.on('heartbeat_ack', () => {
        setState((prev) =>
          prev.heartbeatStatus === 'healthy' ? prev : { ...prev, heartbeatStatus: 'healthy' }
        );
      });

      client.on('disconnected', () => {
        setState((prev) => ({
          ...prev,
          connected: false,
          registered: false,
          heartbeatStatus: 'not-connected',
        }));
      });

      client.on('agent_left', (agentId: string) => {
        setState((prev) => {
          const next = new Map(prev.agents);
          next.delete(agentId);
          return { ...prev, agents: next };
        });
      });

      return true;
    } catch (error) {
      console.error('[TNF Federation] Connection failed:', error);
      return false;
    }
  }, [relayUrl]);

  const disconnect = useCallback(async () => {
    if (clientRef.current) {
      await clientRef.current.close();
      clientRef.current = null;
      setState({
        connected: false,
        registered: false,
        authenticated: false,
        agents: new Map(),
        channels: new Map(),
        messages: [],
        heartbeatStatus: 'not-connected',
        governanceStatus: {},
      });
    }
  }, []);

  const sendMessage = useCallback(async (payload: { channelId: string; content: string }) => {
    if (!clientRef.current?.connected) {
      throw new Error('Not connected to federation relay');
    }

    return clientRef.current.sendChannelMessage(payload.channelId, payload.content);
  }, []);

  const createChannel = useCallback(async (name: string, description: string) => {
    if (!clientRef.current?.connected) {
      throw new Error('Not connected to federation relay');
    }

    return clientRef.current.createChannel(name, description);
  }, []);

  const joinChannel = useCallback((channelId: string) => {
    if (!clientRef.current?.connected) {
      throw new Error('Not connected to federation relay');
    }
    clientRef.current.joinChannel(channelId);
  }, []);

  useEffect(() => {
    return () => {
      if (clientRef.current) {
        clientRef.current.close().catch(console.error);
      }
    };
  }, []);

  return {
    ...state,
    connect,
    disconnect,
    sendMessage,
    createChannel,
    joinChannel,
    getState: () => clientRef.current?.getState(),
  };
}
