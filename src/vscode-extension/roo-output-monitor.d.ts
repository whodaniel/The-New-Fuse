import * as WebSocket from 'ws';
/**
 * Monitors Roo AI assistant output and manages communication with connected clients
 */
export declare class RooOutputMonitor {
    private rooIntegration;
    private connections;
    constructor(connections: WebSocket[]);
    /**
     * Start monitoring Roo output
     */
    startMonitoring(): void;
    /**
     * Stop monitoring and clean up resources
     */
    dispose(): void;
    /**
     * Send a status update to all connected WebSocket clients
     */
    private broadcastStatusUpdate;
    /**
     * Check if monitoring is currently active
     */
    isMonitoring(): boolean;
}
//# sourceMappingURL=roo-output-monitor.d.ts.map