/**
 * SSE Service - Migrated to Drizzle ORM
 * Handles Server-Sent Events for real-time event streaming
 */
import { OnModuleDestroy } from '@nestjs/common';
import { DatabaseService } from '@the-new-fuse/database';
import { Response } from 'express';
interface SSEClient {
    id: string;
    organizationId: string;
    userId?: string;
    response: Response;
    eventTypes: string[];
    filters: Record<string, any>;
    connectedAt: Date;
}
interface SSEEvent {
    type: string;
    data: any;
    id?: string;
    retry?: number;
}
export declare class SSEService implements OnModuleDestroy {
    private readonly db;
    private readonly logger;
    private readonly clients;
    private readonly heartbeatInterval;
    private heartbeatTimer?;
    constructor(db: DatabaseService);
    addClient(client: SSEClient): Promise<void>;
    removeClient(clientId: string): Promise<void>;
    broadcastEvent(organizationId: string, event: {
        type: string;
        payload: any;
    }): Promise<void>;
    sendToClient(clientId: string, event: SSEEvent): Promise<void>;
    sendHeartbeat(): Promise<void>;
    sendCustomEvent(organizationId: string, eventType: string, data: any, filters?: Record<string, any>): Promise<void>;
    getConnectedClients(): {
        total: number;
        byOrganization: Record<string, number>;
        byUser: Record<string, number>;
    };
    getSubscriptionStats(organizationId: string): Promise<{
        activeConnections: number;
        totalSubscriptions: number;
        subscriptionsByType: Record<string, number>;
    }>;
    private sendEvent;
    private matchesFilters;
    private startHeartbeatTimer;
    private cleanupStaleClients;
    onModuleDestroy(): void;
}
export {};
//# sourceMappingURL=sse.service.d.ts.map