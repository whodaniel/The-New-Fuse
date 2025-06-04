import { EventEmitter } from 'events';
export declare class EnhancedAgent extends EventEmitter {
    private readonly name;
    private readonly redisUrl;
    private pubClient;
    private subClient;
    private readonly channels;
    constructor(name: string, redisUrl: string);
    initialize(): Promise<void>;
    publish(channel: string, message: unknown): Promise<void>;
    on(event: string, callback: (data: any) => void): this;
    cleanup(): Promise<void>;
}
