import { ChatService } from './chat.service';
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    getChats(): Promise<never[]>;
    getChat(id: string): Promise<{
        id: string;
        messages: never[];
    }>;
    createChat(createChatDto: any): Promise<any>;
}
