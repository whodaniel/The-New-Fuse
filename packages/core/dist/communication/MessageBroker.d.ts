import { EventEmitter2 } from '@nestjs/event-emitter';
export interface Message {
    id: string;
    topic: string;
    payload: any;
    timestamp: Date;
}
export interface MessageHandler {
    topic: string;
    handle(message: Message): Promise<void>;
}
export declare class MessageBroker {
    private eventEmitter;
    private handlers;
    private messageQueue;
    constructor(eventEmitter: EventEmitter2);
    publish(topic: string, payload: any): Promise<void>;
    subscribe(topic: string, handler: MessageHandler): Promise<void>;
    unsubscribe(topic: string, handler: MessageHandler): Promise<void>;
    private processMessage;
    getMessageHistory(topic?: string): Promise<Message[]>;
    clearMessages(): Promise<void>;
}
//# sourceMappingURL=MessageBroker.d.ts.map