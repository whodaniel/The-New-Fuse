import { Repository } from 'typeorm';
import { Message } from '../entities/message.entity';
export declare class ChatService {
    private readonly messageRepository;
    constructor(messageRepository: Repository<Message>);
    getChatHistory(userId: string, page?: number): Promise<Message[]>;
    addMessage(userId: string, role: string, content: string): Promise<Message>;
    clearChatHistory(userId: string): Promise<{
        success: boolean;
    }>;
}
