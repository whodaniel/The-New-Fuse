import { useCallback, useEffect, useRef, useState } from 'react';
import { FederationRelayClient } from '../lib/federation-relay-client';

export interface TnfFederationState {
  connected: boolean;
  agents: Map<string, any>;
  channels: Map<string, any>;
  heartbeatStatus: 'healthy' | 'degraded' | 'not-connected';
  governanceStatus: Record<string, boolean>;
}

const DEFAULT_RELAY_URL = 'ws://127.0.0.1:3007/ws';

export function useTnfFederation(relayUrl?: string) {
  const [state, setState] = useState<TnfFederationState>({
    connected: false,
    agents: new Map(),
    channels: new Map(),
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
        console.log('[TNF Federation] Registered successfully');
      });

      client.on('agents_updated', (agents: any[]) => {
        setState((prev) => ({
          ...prev,
          agents: new Map(agents.map((a) => [a.id, a])),
        }));
      });

      client.on('channels_updated', (channels: any[]) => {
        setState((prev) => ({
          ...prev,
          channels: new Map(channels.map((c) => [c.id, c])),
        }));
      });

      client.on('channel_message', (message: any) => {
        console.log('[TNF] Message received:', message);
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
        agents: new Map(),
        channels: new Map(),
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

    clientRef.current.createChannel(name, description);
  }, []);

  const joinChannel = useCallback((channelId: string) => {
    if (clientRef.current) {
      clientRef.current.joinChannel(channelId);
    }
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
