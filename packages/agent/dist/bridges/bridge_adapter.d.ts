/**
 * Bridge Adapter - Adapts different bridge interfaces to a common format
 *
 * Provides translation layer between different bridge implementations,
 * allowing agents to communicate across different protocols seamlessly.
 */
import { EventEmitter } from 'events';
import { BaseBridge } from './index.js';
export interface AdaptedMessage {
    originalFormat: string;
    adaptedFormat: string;
    sourceId: string;
    targetId: string;
    content: unknown;
    metadata: Record<string, unknown>;
}
export interface BridgeAdapterConfig {
    sourceBridge: string;
    targetBridge: string;
    transformations?: Array<{
        field: string;
        transform: (value: unknown) => unknown;
    }>;
}
export declare class BridgeAdapter extends EventEmitter {
    private bridges;
    private adapters;
    private messageQueue;
    private processing;
    constructor();
    /**
     * Register a bridge
     */
    registerBridge(name: string, bridge: BaseBridge): void;
    /**
     * Unregister a bridge
     */
    unregisterBridge(name: string): void;
    /**
     * Create an adapter between two bridges
     */
    createAdapter(config: BridgeAdapterConfig): void;
    /**
     * Remove an adapter
     */
    removeAdapter(sourceBridge: string, targetBridge: string): void;
    /**
     * Route a message from one bridge to another
     */
    routeMessage(sourceBridge: string, targetBridge: string, message: unknown): Promise<void>;
    /**
     * Broadcast message to all bridges
     */
    broadcastMessage(sourceBridge: string, message: unknown, excludeBridges?: string[]): Promise<void>;
    /**
     * Handle incoming message from a bridge
     */
    private handleBridgeMessage;
    /**
     * Process message queue
     */
    private processQueue;
    /**
     * Apply transformations to a message
     */
    private applyTransformations;
    /**
     * Get all registered bridges
     */
    getBridges(): string[];
    /**
     * Get all adapters
     */
    getAdapters(): string[];
    /**
     * Get adapter statistics
     */
    getStats(): {
        bridges: number;
        adapters: number;
        queueLength: number;
        processing: boolean;
    };
}
export default BridgeAdapter;
//# sourceMappingURL=bridge_adapter.d.ts.map