import { Repository } from 'typeorm';
import { SSEClient, SSEEvent, BusinessEvent } from '@the-new-fuse/types';
import { SseSubscription } from '../entities/sse-subscription.entity';
export declare class SSEService {
    private readonly sseSubscriptionRepo;
    private readonly logger;
    private readonly clients;
    private readonly heartbeatInterval;
    private heartbeatTimer?;
    constructor(sseSubscriptionRepo: Repository<SseSubscription>);
    addClient(client: SSEClient): Promise<void>;
    removeClient(clientId: string): Promise<void>;
    broadcastEvent(event: BusinessEvent): Promise<void>;
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
    private shouldReceiveEvent;
    private matchesFilters;
    private startHeartbeatTimer;
    private cleanupStaleClients;
    onModuleDestroy(): void;
}
//# sourceMappingURL=sse.service.d.ts.map