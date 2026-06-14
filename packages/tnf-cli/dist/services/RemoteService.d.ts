import { WebSocket } from 'ws';
export interface RemoteConnection {
    id: string;
    url: string;
    createdAt: string;
    lastActivity: string;
    bytesSent: number;
    bytesReceived: number;
}
export interface RelayMessage {
    id: string;
    type: 'session_update' | 'session_sync' | 'heartbeat' | 'command';
    payload: unknown;
    timestamp: string;
}
export declare class RemoteService {
    private httpServer;
    private wsServer;
    private clients;
    private connections;
    private options;
    constructor(options?: {
        port?: number;
        hostname?: string;
        mdns?: boolean;
        mdnsDomain?: string;
        cors?: string[];
    });
    enable(): Promise<{
        port: number;
        hostname: string;
        url: string;
    }>;
    disable(): Promise<void>;
    private handleHttpRequest;
    private handleWebSocketConnection;
    private handleRelayMessage;
    private handleCommand;
    broadcast(message: RelayMessage, exclude?: WebSocket): void;
    getConnections(): RemoteConnection[];
}
//# sourceMappingURL=RemoteService.d.ts.map