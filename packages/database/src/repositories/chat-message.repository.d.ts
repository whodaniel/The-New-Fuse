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
    findBySenderId(senderId: string): Promise<Message[]>;
    findByChatId(chatId: string): Promise<Message[]>;
    findByRole(role: string): Promise<Message[]>;
    getRecentMessages(senderId: string, limit?: number): Promise<Message[]>;
    searchMessages(senderId: string, query: string): Promise<Message[]>;
    getMessageStats(senderId?: string): Promise<{
        total: number;
        recent: number;
        byRole: Record<string, number>;
    }>;
    getConversationMessages(chatId: string, limit?: number): Promise<Message[]>;
    deleteMessagesByChatId(chatId: string): Promise<number>;
    getMessagesByDateRange(from: Date, to: Date): Promise<Message[]>;
}
//# sourceMappingURL=chat-message.repository.d.ts.map