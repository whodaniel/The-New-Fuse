import { ChatService } from './chat.service';
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    private requireUserId;
    getChats(req: any): Promise<any>;
    getChat(id: string, req: any): Promise<any>;
    createChat(createChatDto: {
        agentId: string;
        title?: string;
    }, req: any): Promise<any>;
    deleteChat(id: string, req: any): Promise<{
        success: boolean;
    }>;
    getMessages(chatId: string, limit?: number, cursor?: string): Promise<any>;
    addMessage(chatId: string, messageData: {
        content: string;
        role?: 'USER' | 'AGENT' | 'SYSTEM';
        agentId?: string;
        metadata?: Record<string, unknown>;
    }, req: any): Promise<any>;
    generateResponse(chatId: string, generateDto: {
        prompt: string;
        agentId: string;
    }, req: any): Promise<{
        response: void;
        chatId: string;
    }>;
}
//# sourceMappingURL=chat.controller.d.ts.map