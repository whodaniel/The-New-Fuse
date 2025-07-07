import { Message, Provider } from './message_handler/;';
export declare class ChatStreamManager {
    provider: Provider;
    model: string;
    messages: Message[];
    constructor(options: {
        provider: Provider;
        model: string;
    });
    addMessage(message: Message): void;
}
