import * as WebSocket from 'ws';
export interface WebSocketContextType {
    connect: (url: string) => WebSocket;
    sendMessage: (message: string) => void;
    closeConnection: () => void;
}
export declare const WebSocketContext: import("react").Context<WebSocketContextType>;
//# sourceMappingURL=websocket.d.d.ts.map