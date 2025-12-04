interface Conversation {
    id: string;
    title: string;
    messages: Array<{
        id: string;
        content: string;
        sender: 'user' | 'agent';
        timestamp: string;
    }>;
    createdAt: string;
    updatedAt: string;
}
interface ChatState {
    conversations: Conversation[];
    loading: boolean;
    error: string | null;
}
export declare const fetchConversationsStart: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"chat/fetchConversationsStart">, fetchConversationsSuccess: import("@reduxjs/toolkit").ActionCreatorWithPayload<Conversation[], "chat/fetchConversationsSuccess">, fetchConversationsFailure: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "chat/fetchConversationsFailure">, updateConversationSuccess: import("@reduxjs/toolkit").ActionCreatorWithPayload<Conversation, "chat/updateConversationSuccess">, createConversationSuccess: import("@reduxjs/toolkit").ActionCreatorWithPayload<Conversation, "chat/createConversationSuccess">;
export declare const fetchConversations: (userId: string) => any;
export declare const updateConversation: (conversationId: string, conversationData: Partial<Conversation>) => any;
export declare const createConversation: (userId: string) => any;
declare const _default: import("redux").Reducer<ChatState>;
export default _default;
