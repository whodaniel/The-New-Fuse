import { Message } from '../../generated/prisma';
import { PrismaService } from '../prisma.service';
import { Prisma } from '../../generated/prisma';
export declare class ChatMessageRepository {
    private prisma;
    constructor(prisma: PrismaService);
    private mapDatabaseMessageToChatMessage;
    private getMessageSelect;
    findById(id: string): Promise<Message | null>;
    findMany(filters?: Prisma.MessageWhereInput): Promise<Message[]>;
    create(data: Prisma.MessageCreateInput | Prisma.MessageUncheckedCreateInput): Promise<Message>;
    update(id: string, data: Prisma.MessageUpdateInput | Prisma.MessageUncheckedUpdateInput): Promise<Message>;
    delete(id: string): Promise<Message>;
    findByUserId(userId: string): Promise<Message[]>;
    findBySessionId(sessionId: string): Promise<Message[]>;
    findByRole(role: string): Promise<Message[]>;
    getRecentMessages(userId: string, limit?: number): Promise<Message[]>;
    searchMessages(userId: string, query: string): Promise<Message[]>;
    getMessageStats(userId?: string): Promise<{
        total: number;
        recent: number;
        byRole: Record<string, number>;
    }>;
    getConversationMessages(sessionId: string, limit?: number): Promise<Message[]>;
    deleteMessagesBySessionId(sessionId: string): Promise<number>;
    getMessagesByDateRange(from: Date, to: Date): Promise<Message[]>;
}
//# sourceMappingURL=chat-message.repository.d.ts.map