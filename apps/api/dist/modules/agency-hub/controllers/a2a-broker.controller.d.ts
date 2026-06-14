import { A2AMessageBrokerService, A2AMessageType, A2APriority } from '../services/a2a-message-broker.service';
export declare class A2AMessageBrokerController {
    private readonly brokerService;
    constructor(brokerService: A2AMessageBrokerService);
    sendMessage(body: {
        from: string;
        to: string;
        type: A2AMessageType;
        payload: any;
        priority?: A2APriority;
        correlationId?: string;
        ttl?: number;
    }): Promise<{
        success: boolean;
        messageId: string;
    }>;
    broadcastMessage(body: {
        from: string;
        type: A2AMessageType;
        payload: any;
        priority?: A2APriority;
    }): Promise<{
        success: boolean;
        messageId: string;
    }>;
    getPendingMessages(agentId: string, limit?: number): Promise<{
        agentId: string;
        count: number;
        messages: import("../services/a2a-message-broker.service").A2AMessage[];
    }>;
    peekMessages(agentId: string, limit?: number): Promise<{
        agentId: string;
        count: number;
        messages: import("../services/a2a-message-broker.service").A2AMessage[];
    }>;
    createChannel(body: {
        name: string;
        participants?: string[];
    }): Promise<{
        success: boolean;
        channel: import("../services/a2a-message-broker.service").A2AChannel;
    }>;
    joinChannel(channelName: string, body: {
        agentId: string;
    }): Promise<{
        success: boolean;
        channel: string;
        agentId: string;
    }>;
    leaveChannel(channelName: string, body: {
        agentId: string;
    }): Promise<{
        success: boolean;
        channel: string;
        agentId: string;
    }>;
    sendToChannel(channelName: string, body: {
        from: string;
        type: A2AMessageType;
        payload: any;
        priority?: A2APriority;
    }): Promise<{
        success: boolean;
        messageId: string;
        channel: string;
    }>;
    startConversation(body: {
        initiatorId: string;
        participantIds: string[];
        topic?: string;
    }): Promise<{
        success: boolean;
        conversationId: string;
    }>;
    sendConversationMessage(conversationId: string, body: {
        fromAgent: string;
        content: any;
    }): Promise<{
        success: boolean;
        messageId: string;
        conversationId: string;
    }>;
    registerOnline(body: {
        agentId: string;
    }): Promise<{
        success: boolean;
        agentId: string;
        status: string;
    }>;
    registerOffline(body: {
        agentId: string;
    }): Promise<{
        success: boolean;
        agentId: string;
        status: string;
    }>;
    getOnlineAgents(): Promise<{
        count: number;
        agents: string[];
    }>;
    getStatus(): Promise<{
        status: string;
        metrics: {
            onlineAgents: number;
            pendingMessages: number;
            queueBackend: string;
            channels: string[];
            messagesSent: number;
            messagesDelivered: number;
            messagesFailed: number;
            activeChannels: number;
            activeSubscriptions: number;
        };
        channels: {
            name: string;
            participants: number;
            messageCount: number;
            lastActivity: Date;
        }[];
        onlineAgents: string[];
    }>;
    getMetrics(): Promise<{
        onlineAgents: number;
        pendingMessages: number;
        queueBackend: string;
        channels: string[];
        messagesSent: number;
        messagesDelivered: number;
        messagesFailed: number;
        activeChannels: number;
        activeSubscriptions: number;
    }>;
}
//# sourceMappingURL=a2a-broker.controller.d.ts.map