import { useCallback, useEffect, useMemo, useState } from 'react';
import FederationNodeService, {
  type FederationChannel,
  type FederationChannelMessage,
} from '../services/FederationNodeService';
import { useSettingsStore } from '../stores/settingsStore';

export interface FederationNodeState {
  relayConnected: boolean;
  registered: boolean;
  connecting: boolean;
  agentId: string;
  agentName: string;
  channels: FederationChannel[];
  joinedChannels: string[];
  agents: Array<{ id: string; name: string; platform: string; status: string }>;
  messages: FederationChannelMessage[];
  activityLog: string[];
  selectedChannelId: string | null;
  lastError: string | null;
}

const INITIAL: FederationNodeState = {
  relayConnected: false,
  registered: false,
  connecting: false,
  agentId: '',
  agentName: '',
  channels: [],
  joinedChannels: [],
  agents: [],
  messages: [],
  activityLog: [],
  selectedChannelId: null,
  lastError: null,
};

function pushMessage(prev: FederationChannelMessage[], message: FederationChannelMessage) {
  return [message, ...prev].slice(0, 200);
}

const RELAY_BY_ENV: Record<string, string> = {
  local: 'ws://127.0.0.1:3000/ws',
  sandbox: 'wss://api-gateway-241337102384.us-central1.run.app/ws',
  production: 'wss://thenewfuse.com/ws',
};

export function useFederationNode(relayUrl?: string) {
  const { environment } = useSettingsStore();
  const effectiveRelayUrl = relayUrl || RELAY_BY_ENV[environment] || 'ws://127.0.0.1:3000/ws';
  const [state, setState] = useState<FederationNodeState>(INITIAL);

  const syncFromService = useCallback(() => {
    const snapshot = FederationNodeService.getState();
    setState((prev) => ({
      ...prev,
      relayConnected: snapshot.connected,
      registered: snapshot.registered,
      connecting: snapshot.connecting,
      agentId: snapshot.agentId,
      agentName: snapshot.agentName,
      channels: snapshot.channels,
      joinedChannels: snapshot.joinedChannels,
      agents: snapshot.agents.map(
        (agent: { id: string; name: string; platform: string; status: string }) => ({
          id: agent.id,
          name: agent.name,
          platform: String(agent.platform),
          status: String(agent.status),
        })
      ),
      activityLog: snapshot.activityLog,
    }));
  }, []);

  const connect = useCallback(async () => {
    setState((prev) => ({ ...prev, connecting: true, lastError: null }));
    FederationNodeService.setRelayUrl(effectiveRelayUrl);
    const ok = await FederationNodeService.connect(effectiveRelayUrl);
    syncFromService();
    setState((prev) => ({
      ...prev,
      connecting: false,
      relayConnected: ok,
      lastError: ok ? null : 'Federation relay connection failed',
    }));
    return ok;
  }, [effectiveRelayUrl, syncFromService]);

  useEffect(() => {
    FederationNodeService.setRelayUrl(effectiveRelayUrl);

    const handlers: Array<[string, (...args: unknown[]) => void]> = [
      ['connected', () => syncFromService()],
      [
        'disconnected',
        () => setState((prev) => ({ ...prev, relayConnected: false, registered: false })),
      ],
      ['registered', () => setState((prev) => ({ ...prev, registered: true }))],
      [
        'registration_error',
        (payload) => {
          setState((prev) => ({
            ...prev,
            registered: false,
            lastError: JSON.stringify(payload),
          }));
        },
      ],
      [
        'channels_updated',
        (channels) => {
          const list = (channels as FederationChannel[]) || [];
          setState((prev) => ({
            ...prev,
            channels: list,
            selectedChannelId: prev.selectedChannelId || list[0]?.id || null,
          }));
        },
      ],
      [
        'agents_updated',
        (agents) => {
          setState((prev) => ({
            ...prev,
            agents: ((agents as FederationNodeState['agents']) || []).map((agent) => ({
              id: agent.id,
              name: agent.name,
              platform: agent.platform,
              status: agent.status,
            })),
          }));
        },
      ],
      [
        'channel_joined',
        (channel) => {
          const joined = channel as FederationChannel;
          setState((prev) => ({
            ...prev,
            selectedChannelId: joined.id,
            joinedChannels: [...new Set([...prev.joinedChannels, joined.id])],
          }));
        },
      ],
      [
        'channel_message',
        (message) => {
          setState((prev) => ({
            ...prev,
            messages: pushMessage(prev.messages, message as FederationChannelMessage),
          }));
        },
      ],
      [
        'activity',
        (line) => {
          setState((prev) => ({
            ...prev,
            activityLog: [String(line), ...prev.activityLog].slice(0, 120),
          }));
        },
      ],
      [
        'error',
        (error) => {
          const message = error instanceof Error ? error.message : String(error);
          setState((prev) => ({ ...prev, lastError: message }));
        },
      ],
    ];

    for (const [event, handler] of handlers) {
      FederationNodeService.on(event as any, handler);
    }

    if (FederationNodeService.isConnected()) {
      syncFromService();
    } else {
      void connect();
    }

    return () => {
      for (const [event, handler] of handlers) {
        FederationNodeService.off(event as any, handler);
      }
    };
  }, [connect, effectiveRelayUrl, syncFromService]);

  const actions = useMemo(
    () => ({
      connect,
      refresh: () => {
        FederationNodeService.requestChannelList();
        FederationNodeService.requestAgentList();
        syncFromService();
      },
      selectChannel: (channelId: string) => {
        setState((prev) => ({ ...prev, selectedChannelId: channelId }));
      },
      createChannel: (name: string) => FederationNodeService.createChannel(name),
      joinChannel: (channelId: string) => FederationNodeService.joinChannel(channelId),
      leaveChannel: (channelId: string) => FederationNodeService.leaveChannel(channelId),
      sendMessage: (content: string, channelId?: string) => {
        const target = channelId || state.selectedChannelId;
        if (!target || !content.trim()) return;
        FederationNodeService.sendChannelMessage(target, content.trim());
      },
      pauseChannel: (channelId: string) => FederationNodeService.pauseChannel(channelId),
      resumeChannel: (channelId: string) => FederationNodeService.resumeChannel(channelId),
    }),
    [connect, state.selectedChannelId, syncFromService]
  );

  return { state, ...actions };
}

export default useFederationNode;
