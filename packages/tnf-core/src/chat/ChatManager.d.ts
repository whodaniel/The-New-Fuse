import { EventEmitter } from 'events';
export interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}
export declare class ChatManager extends EventEmitter {
    private _messages;
    get messages(): Message[];
    clearChat(): void;
    addMessage(message: Message): void;
}
//# sourceMappingURL=ChatManager.d.ts.map