export interface PubSubCallback {
    (message: string, channel: string): void;
}
export declare class PubSubService {
    private subscriptions;
    subscribe(channel: string, callback: PubSubCallback): Promise<void>;
    unsubscribe(channel: string, callback: PubSubCallback): Promise<void>;
    publish(channel: string, message: string): Promise<void>;
    unsubscribeAll(channel: string): Promise<void>;
}
//# sourceMappingURL=pubsub.service.d.ts.map