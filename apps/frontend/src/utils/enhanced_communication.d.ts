export declare class EnhancedCommunicationBus extends EventEmitter {
    constructor(options?: {});
    publish(topic: any, message: any, options?: {}): Promise<void>;
    attemptPublish(publication: any, remainingAttempts: any): any;
    handlePublicationTimeout(publicationId: any): void;
    generateId(): string;
    emit(event: any, ...args: any[]): any;
    on(event: any, listener: any): any;
    off(event: any, listener: any): any;
    once(event: any, listener: any): any;
}
