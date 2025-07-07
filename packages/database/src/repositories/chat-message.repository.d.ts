import { ChatMessage } from '../types';
import { PrismaService } from '../prisma.service';
export declare class ChatMessageRepository {
    private prisma;
    constructor(prisma: PrismaService);
    private mapDatabaseMessageToChatMessage;
    private getMessageSelect;
    findById(id: string): Promise<ChatMessage | null>;
    findMany(filters?: any): Promise<ChatMessage[]>;
    create(data: any): Promise<ChatMessage>;
    update(id: string, data: any): Promise<ChatMessage>;
    delete(id: string): Promise<ChatMessage>;
    findByUserId(userId: string): Promise<ChatMessage[]>;
    findBySessionId(sessionId: string): Promise<ChatMessage[]>;
    findByRole(role: string): Promise<ChatMessage[]>;
    getRecentMessages(userId: string, limit?: number): Promise<ChatMessage[]>;
    searchMessages(userId: string, query: string): Promise<ChatMessage[]>;
    getMessageStats(userId?: string): Promise<any>;
    getConversationMessages(sessionId: string, limit?: number): Promise<ChatMessage[]>;
    deleteMessagesBySessionId(sessionId: string): Promise<number>;
    getMessagesByDateRange(from: Date, to: Date): Promise<ChatMessage[]>;
}
//# sourceMappingURL=chat-message.repository.d.ts.map