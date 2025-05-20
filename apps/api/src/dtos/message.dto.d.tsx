export declare class CreateMessageDto {
    content: string;
    metadata?: Record<string, any>;
    attachments?: string[];
    parentMessageId?: string;
}
export declare class MessageResponseDto {
    id: string;
    content: string;
    sender: string;
    timestamp: Date;
    metadata?: Record<string, any>;
    attachments?: string[];
    parentMessageId?: string;
}
