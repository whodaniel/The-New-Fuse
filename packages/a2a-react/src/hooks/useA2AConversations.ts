import { A2AMessageType, Conversation } from '@the-new-fuse/a2a-core';
import { useCallback, useState } from 'react';
import { useA2AContext } from '../A2AProvider.js';

export interface ConversationWithCount extends Conversation {
  participantCount: number;
}

export function useA2AConversations() {
  const { sendMessage } = useA2AContext();
  const [conversations, setConversations] = useState<ConversationWithCount[]>([]);

  const joinConversation = useCallback(
    async (conversationId: string) => {
      if (sendMessage) {
        await sendMessage({
          type: A2AMessageType.REQUEST,
          payload: { action: 'join_conversation', conversationId },
        });
      }
    },
    [sendMessage]
  );

  const leaveConversation = useCallback(
    async (conversationId: string) => {
      if (sendMessage) {
        await sendMessage({
          type: A2AMessageType.REQUEST,
          payload: { action: 'leave_conversation', conversationId },
        });
      }
    },
    [sendMessage]
  );

  return {
    conversations,
    joinConversation,
    leaveConversation,
  };
}
