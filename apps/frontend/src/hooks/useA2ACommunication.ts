import { A2AMessage, a2aProtocolService } from '@/services/A2AProtocolService';
import { useCallback, useEffect, useState } from 'react';

export interface A2AAgent {
  id: string;
  name: string;
  capabilities: string[];
  status: 'online' | 'offline' | 'busy';
  lastSeen: number;
}

export const useA2ACommunication = () => {
  const [agents, setAgents] = useState<A2AAgent[]>([]);
  const [messages, setMessages] = useState<A2AMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Load agents
  const loadAgents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
      const response = await fetch(`${apiBaseUrl}/a2a/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load A2A agents: ${response.status} ${response.statusText}`);
      }

      const payload = await response.json();
      const onlineAgentIds: string[] = Array.isArray(payload?.onlineAgents)
        ? payload.onlineAgents
        : [];

      const liveAgents: A2AAgent[] = onlineAgentIds.map((agentId) => ({
        id: agentId,
        name: agentId,
        capabilities: [],
        status: 'online',
        lastSeen: Date.now(),
      }));

      setAgents(liveAgents);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load agents'));
      setAgents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Send message
  const sendMessage = useCallback(async (message: Omit<A2AMessage, 'id' | 'timestamp'>) => {
    setLoading(true);
    setError(null);

    try {
      // Create and send message using A2A protocol service
      const fullMessage = a2aProtocolService.createMessage(
        message.type,
        message.payload,
        message.sender,
        'recipient' in message ? message.recipient : undefined,
        {
          priority:
            'metadata' in message && message.metadata ? message.metadata.priority : 'medium',
          timeout: 'metadata' in message && message.metadata ? message.metadata.timeout : undefined,
          retryCount:
            'metadata' in message && message.metadata ? message.metadata.retryCount : undefined,
        }
      );

      // Send message
      await a2aProtocolService.sendMessage(fullMessage);

      // Add message to list
      setMessages((prev) => [...prev, fullMessage]);

      return fullMessage;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to send message'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Broadcast message
  const broadcastMessage = useCallback(
    async (message: Omit<A2AMessage, 'id' | 'timestamp' | 'recipient'>) => {
      setLoading(true);
      setError(null);

      try {
        // Create message using A2A protocol service
        const fullMessage = a2aProtocolService.createMessage(
          message.type,
          message.payload,
          message.sender,
          undefined, // No recipient for broadcast
          {
            priority:
              'metadata' in message && message.metadata ? message.metadata.priority : 'medium',
            timeout:
              'metadata' in message && message.metadata ? message.metadata.timeout : undefined,
            retryCount:
              'metadata' in message && message.metadata ? message.metadata.retryCount : undefined,
          }
        );

        // Broadcast message
        await a2aProtocolService.broadcastMessage(fullMessage);

        // Add message to list
        setMessages((prev) => [...prev, fullMessage]);

        return fullMessage;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to broadcast message'));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Request-response
  const sendRequestAndWaitForResponse = useCallback(
    async (message: Omit<A2AMessage, 'id' | 'timestamp'>, timeout = 30000) => {
      setLoading(true);
      setError(null);

      try {
        // Create message using A2A protocol service
        const fullMessage = a2aProtocolService.createMessage(
          message.type,
          message.payload,
          message.sender,
          'recipient' in message ? message.recipient : undefined,
          {
            priority:
              'metadata' in message && message.metadata ? message.metadata.priority : 'medium',
            timeout,
            retryCount:
              'metadata' in message && message.metadata ? message.metadata.retryCount : undefined,
          }
        );

        // Send request and wait for response
        const response = await a2aProtocolService.sendRequestAndWaitForResponse(
          fullMessage,
          timeout
        );

        // Add request and response to list
        setMessages((prev) => [...prev, fullMessage, response]);

        return response;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to get response'));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Load agents on mount
  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  return {
    agents,
    messages,
    loading,
    error,
    loadAgents,
    sendMessage,
    broadcastMessage,
    sendRequestAndWaitForResponse,
  };
};

export default useA2ACommunication;
