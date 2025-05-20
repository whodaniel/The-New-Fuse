import EventEmitter from 'events';
declare class WebSocketService extends EventEmitter {
    private socket;
    private reconnectAttempts;
    private maxReconnectAttempts;
    private reconnectTimeout;
    constructor();
    private connect;
    private handleReconnect;
    send(type: string, payload: any): void;
}
export declare const webSocketService: WebSocketService;
export {};
