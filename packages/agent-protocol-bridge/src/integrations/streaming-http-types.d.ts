/**
 * Streaming HTTP Integration Types
 *
 * Comprehensive type definitions for Streaming HTTP (e.g., long polling, server-sent events over HTTP)
 * integration with The New Fuse AI Agent framework.
 */
export interface StreamingHttpEvent {
    id?: string;
    type: string;
    data: string;
    retry?: number;
}
export interface StreamingHttpClientConfig {
    url: string;
    headers?: Record<string, string>;
    method?: 'GET' | 'POST';
    body?: string;
    timeout?: number;
    reconnectInterval?: number;
    withCredentials?: boolean;
}
export declare enum StreamingHttpConnectionStatus {
    CONNECTING = "CONNECTING",
    OPEN = "OPEN",
    CLOSED = "CLOSED",
    ERROR = "ERROR",
    RECONNECTING = "RECONNECTING"
}
export interface StreamingHttpConnection {
    id: string;
    clientId?: string;
    status: StreamingHttpConnectionStatus;
    connectedAt: Date;
    lastActivityAt: Date;
    remoteAddress?: string;
    userAgent?: string;
}
export interface StreamingHttpConnectRequest {
    config: StreamingHttpClientConfig;
    agentId?: string;
    metadata?: Record<string, any>;
}
export interface StreamingHttpConnectResponse {
    success: boolean;
    connectionId?: string;
    error?: string;
}
export interface StreamingHttpSendEventRequest {
    connectionId: string;
    event: StreamingHttpEvent;
}
export interface StreamingHttpSendEventResponse {
    success: boolean;
    error?: string;
}
export interface StreamingHttpDisconnectRequest {
    connectionId: string;
    reason?: string;
}
export interface StreamingHttpDisconnectResponse {
    success: boolean;
    error?: string;
}
export interface StreamingHttpBridge {
    connect(request: StreamingHttpConnectRequest): Promise<StreamingHttpConnectResponse>;
    sendEvent(request: StreamingHttpSendEventRequest): Promise<StreamingHttpSendEventResponse>;
    disconnect(request: StreamingHttpDisconnectRequest): Promise<StreamingHttpDisconnectResponse>;
    onEvent(listener: (connectionId: string, event: StreamingHttpEvent) => void): void;
    onStatusChange(listener: (connectionId: string, status: StreamingHttpConnectionStatus, error?: string) => void): void;
}
//# sourceMappingURL=streaming-http-types.d.ts.map