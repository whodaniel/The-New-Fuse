import { Prisma } from '@the-new-fuse/database/client';
export declare const ChatService: {
    addMessage(userId: string, role: "user" | "assistant", content: string): Promise<Prisma.ChatMessageCreateInput>;
    getChatHistory(userId: string, page?: number): Promise<{
        messages: any;
        total: any;
        hasMore: boolean;
    }>;
    clearChatHistory(userId: string): Promise<Prisma.BatchPayload>;
    cleanupOldMessages(): Promise<Prisma.BatchPayload>;
};
