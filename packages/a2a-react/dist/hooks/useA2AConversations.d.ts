import { Conversation } from '@the-new-fuse/a2a-core';
export interface ConversationWithCount extends Conversation {
    participantCount: number;
}
export declare function useA2AConversations(): {
    conversations: ConversationWithCount[];
    joinConversation: (conversationId: string) => Promise<void>;
    leaveConversation: (conversationId: string) => Promise<void>;
};
//# sourceMappingURL=useA2AConversations.d.ts.map