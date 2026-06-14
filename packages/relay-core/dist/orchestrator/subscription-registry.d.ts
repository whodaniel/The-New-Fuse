export interface Subscription {
    agentId: string;
    topic: string;
    priority?: number;
}
export declare class SubscriptionRegistry {
    private subscriptions;
    private agentSubscriptions;
    register(agentId: string, topic: string): void;
    unregister(agentId: string, topic: string): void;
    getSubscribers(topic: string): string[];
    getAgentSubscriptions(agentId: string): string[];
    clearAgent(agentId: string): void;
}
//# sourceMappingURL=subscription-registry.d.ts.map