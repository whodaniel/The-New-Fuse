import { Server } from 'ws';
import { Logger } from '../logging.js';
export declare class WebSocketManager {
    private readonly wss;
    private readonly logger;
    private readonly options;
    private connections;
    NodeJS: any;
    Timeout: any;
    constructor(wss: Server, logger: Logger, options?: {
        pingInterval: number;
    });
    private verifyToken;
    private setupWebSocketServer;
    private startPingInterval;
    setInterval(): any;
}
