import { ChatService } from './chat.service';
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    getChatHistory(user: any, page?: number): Promise<import("../entities/message.entity").Message[]>;
    addMessage(user: any, role: string, content: string): Promise<import("../entities/message.entity").Message>;
    clearHistory(user: any): Promise<{
        success: boolean;
    }>;
}
//# sourceMappingURL=chat.controller.d.ts.map