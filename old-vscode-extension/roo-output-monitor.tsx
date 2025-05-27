import * as vscode from 'vscode';
import * as WebSocket from 'ws';
import { RooIntegration } from './roo-integration.js';

/**
 * Monitors Roo AI assistant output and manages communication with connected clients
 */
export class RooOutputMonitor {
    private rooIntegration: RooIntegration | null = null;
    private connections: WebSocket[];

    constructor(connections: WebSocket[]) {
        this.connections = connections;
    }

    /**
     * Start monitoring Roo output
     */
    public startMonitoring(): void {
        if (this.rooIntegration) {
            return; // Already monitoring
        }
        
        this.rooIntegration = new RooIntegration();
        
        // Notify all connected clients that monitoring has started
        this.broadcastStatusUpdate(true);
    }

    /**
     * Stop monitoring and clean up resources
     */
    public dispose(): void {
        if (this.rooIntegration) {
            this.rooIntegration.dispose();
            this.rooIntegration = null;
            
            // Notify all connected clients that monitoring has stopped
            this.broadcastStatusUpdate(false);
        }
    }

    /**
     * Send a status update to all connected WebSocket clients
     */
    private broadcastStatusUpdate(isActive: boolean): void {
        const message = JSON.stringify({
            type: 'roo_monitoring_status',
            active: isActive,
            timestamp: new Date().toISOString()
        });

        this.connections.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(message);
            }
        });
    }

    /**
     * Check if monitoring is currently active
     */
    public isMonitoring(): boolean {
        return this.rooIntegration !== null;
    }
}