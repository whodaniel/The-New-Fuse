/**
 * WebSocket Controller - Real-time communication server
 */
import { Request, Response } from 'express';
import { Server as SocketIOServer } from 'socket.io';
export declare class WebSocketController {
    private logger;
    private io;
    private server;
    private isRunning;
    getStatus(req: Request, res: Response): Promise<void>;
    startServer(req: Request, res: Response): Promise<void>;
    stopServer(req: Request, res: Response): Promise<void>;
    broadcast(req: Request, res: Response): Promise<void>;
    private setupEventHandlers;
    emitWorkflowUpdate(workflowId: string, data: any): void;
    emitExecutionUpdate(executionId: string, data: any): void;
    emitAgentUpdate(agentId: string, data: any): void;
    emitSystemMetrics(metrics: any): void;
    getIO(): SocketIOServer | null;
}
//# sourceMappingURL=websocket.controller.d.ts.map