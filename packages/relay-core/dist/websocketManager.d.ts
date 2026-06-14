import { z } from 'zod';
export declare const WebSocketMessageSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    type: z.ZodLiteral<"subscribe">;
    channel: z.ZodString;
    sessionId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"unsubscribe">;
    channel: z.ZodString;
    sessionId: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"publish">;
    channel: z.ZodString;
    payload: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    sessionId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"presence">;
    userId: z.ZodString;
    status: z.ZodEnum<{
        online: "online";
        away: "away";
        offline: "offline";
    }>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"ping">;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"pong">;
    timestamp: z.ZodNumber;
}, z.core.$strip>], "type">;
export type WebSocketMessage = z.infer<typeof WebSocketMessageSchema>;
export interface WebSocketConnection {
    id: string;
    userId?: string;
    channels: Set<string>;
    connectedAt: number;
    lastActivity: number;
}
export declare class WebSocketManager {
    private connections;
    private channelSubscribers;
    private messageHistory;
    private maxHistoryPerChannel;
    registerConnection(connectionId: string, userId?: string): WebSocketConnection;
    disconnect(connectionId: string): void;
    subscribe(connectionId: string, channel: string): boolean;
    unsubscribe(connectionId: string, channel: string): void;
    publish(channel: string, payload: Record<string, unknown>, excludeConnectionId?: string): string[];
    getConnectionCount(): number;
    getChannelSubscriberCount(channel: string): number;
    getActiveConnections(): WebSocketConnection[];
    getChannelHistory(channel: string): WebSocketMessage[];
}
//# sourceMappingURL=websocketManager.d.ts.map