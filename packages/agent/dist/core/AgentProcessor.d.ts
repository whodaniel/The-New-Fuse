import { Message, MessageType } from '@the-new-fuse/types';
import { UUID } from '@the-new-fuse/api-types';
export interface ProcessorRuntimeProcessor {
    id?: string;
    messageTypes?: Array<MessageType | string>;
    start?: () => Promise<void> | void;
    stop?: () => Promise<void> | void;
    canProcess?: (message: Message) => boolean;
    process: (message: Message) => Promise<unknown | null> | unknown | null;
}
export interface ProcessorRegistrationOptions {
    id?: string;
    messageTypes?: Array<MessageType | string>;
    replace?: boolean;
}
export interface RegisteredProcessor {
    id: string;
    messageTypes: Array<MessageType | string>;
    processor: ProcessorRuntimeProcessor;
}
/**
 * Main processor for an agent instance.
 * Routes incoming messages to the appropriate specialized processor (Command, Task, Notification).
 */
export declare class AgentProcessor {
    private logger;
    private agentId;
    private processors;
    private processorsByType;
    private running;
    constructor(agentId: UUID, processors?: ProcessorRuntimeProcessor[]);
    registerProcessor(processor: ProcessorRuntimeProcessor, options?: ProcessorRegistrationOptions): RegisteredProcessor;
    unregisterProcessor(id: string): boolean;
    getRegisteredProcessors(): RegisteredProcessor[];
    /**
     * Processes a single incoming message by routing it to the appropriate processor.
     * @param message The message to process.
     */
    processMessage(message: unknown): Promise<unknown[]>;
    /**
     * Starts the agent processor (e.g., connecting to message queues, starting listeners).
     */
    start(): Promise<void>;
    /**
     * Stops the agent processor gracefully.
     */
    stop(): Promise<void>;
    private resolveProcessors;
    private assertMessage;
}
//# sourceMappingURL=AgentProcessor.d.ts.map