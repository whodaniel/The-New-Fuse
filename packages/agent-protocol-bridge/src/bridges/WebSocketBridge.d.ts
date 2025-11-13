import { WebSocketBridge, WebSocketBridgeConfig, WebSocketConnection, WebSocketBroadcastTargets, WebSocketBroadcastResult } from '../types/integration-bridge-types';
export declare class WebSocketBridgeImplementation implements WebSocketBridge {
    private readonly config;
    constructor(config: WebSocketBridgeConfig);
    createConnection(socket: any, connectionId: string): Promise<WebSocketConnection>;
    broadcast(message: any, targets: WebSocketBroadcastTargets): Promise<WebSocketBroadcastResult>;
    createRoom(name: string, options?: Record<string, any>): Promise<string>;
    roomStore: any;
    set(roomId: any, : any, Set: any): any;
}
//# sourceMappingURL=WebSocketBridge.d.ts.map