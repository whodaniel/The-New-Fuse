import { EventEmitter2 } from '@nestjs/event-emitter';
export declare class MessageQueue {
    private eventEmitter;
    private queue;
    constructor(eventEmitter: EventEmitter2);
    enqueue(message: any): Promise<void>;
    dequeue(): Promise<any>;
    peek(): Promise<any>;
    size(): Promise<number>;
    clear(): Promise<void>;
    isEmpty(): Promise<boolean>;
    getStats(): Promise<any>;
}
//# sourceMappingURL=MessageQueue.d.ts.map