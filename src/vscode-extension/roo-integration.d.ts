/**
 * Integration with the Roo Code AI assistant
 * Monitors Roo's output channel and broadcasts it via WebSocket
 */
export declare class RooIntegration {
    private wss;
    private connections;
    constructor();
    private setupWebSocketServer;
    private interceptRooOutput;
    private broadcastOutput;
    dispose(): void;
}
//# sourceMappingURL=roo-integration.d.ts.map