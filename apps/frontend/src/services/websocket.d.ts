import EventEmitter from 'events';
declare class WebSocketService extends EventEmitter {
    constructor();
    connect(): void;
    handleReconnect(): void;
    send(type: any, payload: any): void;
}
export declare const webSocketService: WebSocketService;
export {};
