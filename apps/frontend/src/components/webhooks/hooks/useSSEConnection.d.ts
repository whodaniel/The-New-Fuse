import { BusinessEventType } from '@the-new-fuse/types';
export interface SSEConnectionOptions {
    eventTypes?: BusinessEventType[];
    filters?: Record<string, unknown>;
    autoReconnect?: boolean;
    reconnectInterval?: number;
    maxReconnectAttempts?: number;
}
export interface SSEConnectionState {
    isConnected: boolean;
    isReconnecting: boolean;
    reconnectAttempts: number;
    lastEventTime: Date | null;
    error: string | null;
}
export interface SSEEvent {
    type: string;
    data: Record<string, unknown>;
    timestamp: Date;
}
export declare function useSSEConnection(options?: SSEConnectionOptions): {
    connectionState: SSEConnectionState;
    events: SSEEvent[];
    latestEvent: SSEEvent | null;
    connect: () => void;
    disconnect: () => void;
    addEventListener: (eventType: string, listener: (event: SSEEvent) => void) => () => void;
    clearEvents: () => void;
};
