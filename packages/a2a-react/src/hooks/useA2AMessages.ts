import { useState, useCallback } from 'react';

export interface A2AMessage {
  id: string;
  type: string;
  fromAgent?: string;
  toAgent?: string;
  payload: any;
  timestamp: string;
}

export function useA2AMessages() {
  const [messages, setMessages] = useState<A2AMessage[]>([]);

  const sendMessage = useCallback(async (message: Partial<A2AMessage>) => {
    // Mock implementation - in real scenario this would send via A2A service
    const newMessage: A2AMessage = {
      id: Date.now().toString(),
      type: message.type || 'message',
      fromAgent: message.fromAgent,
      toAgent: message.toAgent,
      payload: message.payload,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  const sendRequest = useCallback(async (request: any) => {
    return sendMessage({ type: 'request', payload: request });
  }, [sendMessage]);

  const broadcast = useCallback(async (payload: any, _options?: any) => {
    return sendMessage({ type: 'broadcast', payload });
  }, [sendMessage]);

  return {
    messages,
    sendMessage,
    sendRequest,
    broadcast
  };
}