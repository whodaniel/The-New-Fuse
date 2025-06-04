import { ChatService } from '../services/chat.service.js';
import { CreateMessageDto } from '../dtos/message.dto.js';
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    getRooms(): Promise<import("../entities/chat-room.entity.js").ChatRoom[]>;
    getRoom(roomId: string): Promise<import("../entities/chat-room.entity.js").ChatRoom>;
    getMessages(roomId: string, limit: number, offset: number): Promise<import("../entities/message.entity.js").Message[]>;
    sendMessage(roomId: string, createMessageDto: CreateMessageDto): Promise<import("../entities/message.entity.js").Message>;
    getAnalytics(): Promise<any>;
}
