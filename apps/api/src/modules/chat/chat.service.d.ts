export declare class ChatService {
    findAll(): Promise<never[]>;
    findOne(id: string): Promise<{
        id: string;
        messages: never[];
    }>;
    create(createChatDto: any): Promise<any>;
}
