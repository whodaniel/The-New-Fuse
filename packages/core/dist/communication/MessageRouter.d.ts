import { MessageBroker, Message } from './MessageBroker.js';
export interface RouteRule {
    topic: string;
    target: string;
    condition?: (message: Message) => boolean;
}
export declare class MessageRouter {
    private messageBroker;
    private rules;
    constructor(messageBroker: MessageBroker);
    addRule(rule: RouteRule): void;
    removeRule(topic: string, target: string): void;
    routeMessage(message: Message): Promise<void>;
    getRules(): RouteRule[];
}
//# sourceMappingURL=MessageRouter.d.ts.map