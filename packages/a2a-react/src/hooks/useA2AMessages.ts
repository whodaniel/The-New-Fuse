import { A2AMessage, A2AMessageType, A2APriority } from '@the-new-fuse/a2a-core';
import { useCallback } from 'react';
import { useA2AContext } from '../A2AProvider';

export function useA2AMessages() {
  const { messages, sendMessage: contextSendMessage } = useA2AContext();

  const sendMessage = useCallback(
    async (message: Partial<A2AMessage>) => {
      return contextSendMessage(message);
    },
    [contextSendMessage]
  );

  const sendRequest = useCallback(
    async (request: any) => {
      return contextSendMessage({
        type: A2AMessageType.REQUEST,
        payload: request,
        timestamp: Date.now(),
        priority: A2APriority.MEDIUM,
      });
    },
    [contextSendMessage]
  );

  const broadcast = useCallback(
    async (payload: any, options?: any) => {
      return contextSendMessage({
        type: A2AMessageType.NOTIFICATION,
        payload,
        priority: A2APriority.MEDIUM,
        timestamp: Date.now(),
        ...options,
      });
    },
    [contextSendMessage]
  );

  return {
    messages,
    sendMessage,
    sendRequest,
    broadcast,
  };
}
