import { ChatService } from '../services/chat.service';
import { CreateMessageDto } from '../dtos/message.dto';
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    getRooms(): Promise<any>;
    getRoom(roomId: string): Promise<any>;
    getMessages(roomId: string, limit: number, offset: number): Promise<any>;
    sendMessage(roomId: string, createMessageDto: CreateMessageDto): Promise<any>;
    getAnalytics(): Promise<any>;
}
//# sourceMappingURL=chat.controller.d.ts.map