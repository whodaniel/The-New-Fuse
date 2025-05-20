import { EventEmitter } from 'events';
import { CommunicationOptions, PublishOptions, CommunicationEvents } from '../types/communication.js';
export declare class EnhancedCommunicationBus extends EventEmitter {
    private readonly options;
    private readonly activePublications;
    constructor(options?: CommunicationOptions);
    publish(topic: string, message: unknown, options?: PublishOptions): Promise<void>;
    private attemptPublish;
    private handlePublicationTimeout;
    private generateId;
    emit<K extends keyof CommunicationEvents>(event: K, ...args: Parameters<CommunicationEvents[K]>): boolean;
    on<K extends keyof CommunicationEvents>(event: K, listener: CommunicationEvents[K]): this;
    off<K extends keyof CommunicationEvents>(event: K, listener: CommunicationEvents[K]): this;
    once<K extends keyof CommunicationEvents>(event: K, listener: CommunicationEvents[K]): this;
}
