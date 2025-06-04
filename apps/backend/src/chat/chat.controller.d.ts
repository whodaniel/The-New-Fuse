import { ChatService } from './chat.service.js';
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    getChatHistory(user: any, page?: number): Promise<import("../entities/message.entity.js").Message[]>;
    addMessage(user: any, role: string, content: string): Promise<import("../entities/message.entity.js").Message>;
    clearHistory(user: any): Promise<{
        success: boolean;
    }>;
}
