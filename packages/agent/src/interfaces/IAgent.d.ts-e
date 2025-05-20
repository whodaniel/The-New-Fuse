import { Message } from '@the-new-fuse/types';
export interface IAgent {
    id: string;
    name: string;
    type: string;
    capabilities: string[];
    initialize(): Promise<void>;
    process(message: Message): Promise<Message>;
    learn(data: unknown): Promise<void>;
    saveToMemory(key: string, value: unknown): Promise<void>;
    retrieveFromMemory(key: string): Promise<any>;
    getState(): Promise<any>;
    setState(state: unknown): Promise<void>;
    sendMessage(message: Message): Promise<void>;
    receiveMessage(message: Message): Promise<void>;
    handleError(error: Error): Promise<void>;
}
