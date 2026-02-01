import { useCallback, useEffect, useState } from 'react';
import { useRelay } from '../relay/RelayProvider';
import {
  BridgeState,
  createInitialBridgeState,
  createLoadingBridgeState,
  createSuccessBridgeState,
} from '../types/BridgeCommon';

export interface Agent {
  id: string;
  name?: string;
  type: string;
  status: 'idle' | 'busy' | 'offline' | 'error';
  capabilities: string[];
  lastSeen: string;
}

export interface UseAgentBridgeReturn {
  // Lists
  activeAgents: BridgeState<Agent[]>;

  // Actions
  refreshAgents: () => Promise<void>;
  sendMessageToAgent: (agentId: string, message: string) => Promise<void>;
}

/**
 * Bridge hook for interacting with the Agent Runtime.
 * Uses the Relay bridge for transport.
 */
export function useAgentBridge(): UseAgentBridgeReturn {
  const { sendMessage, subscribeToMessages, connectionState } = useRelay();

  const [activeAgents, setActiveAgents] = useState<BridgeState<Agent[]>>(
    createInitialBridgeState()
  );

  const refreshAgents = useCallback(async () => {
    setActiveAgents((prev) => createLoadingBridgeState(prev.data));

    // Request agent list via Relay
    // The response will be handled by the subscription below
    await sendMessage('AGENT_LIST_REQUEST', {});
  }, [sendMessage]);

  // Subscribe to agent updates
  useEffect(() => {
    if (connectionState.status !== 'connected') return;

    const sub = subscribeToMessages(
      { messageType: ['AGENT_LIST_UPDATE', 'AGENT_REGISTERED', 'AGENT_DISCONNECTED'] },
      (message) => {
        if (message.type === 'AGENT_LIST_UPDATE') {
          const agents = message.payload as Agent[];
          setActiveAgents(createSuccessBridgeState(agents));
        }
        // In a real implementation we would merge registered/disconnected events
        // For now we just rely on full list updates or re-fetch
        if (message.type === 'AGENT_REGISTERED' || message.type === 'AGENT_DISCONNECTED') {
          refreshAgents();
        }
      }
    );

    // Initial fetch
    refreshAgents();

    return () => {
      sub.unsubscribe();
    };
  }, [connectionState.status, subscribeToMessages, refreshAgents]);

  const sendMessageToAgent = useCallback(
    async (agentId: string, text: string) => {
      await sendMessage('AGENT_MESSAGE', { targetAgentId: agentId, content: text });
    },
    [sendMessage]
  );

  return {
    activeAgents,
    refreshAgents,
    sendMessageToAgent,
  };
}
