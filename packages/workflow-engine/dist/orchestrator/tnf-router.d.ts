import { EventEmitter2 } from '@nestjs/event-emitter';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
export interface RouterConfig {
    redisUrl: string;
    ingressChannel: string;
    egressChannelPrefix: string;
    enableInboxRouting?: boolean;
}
export declare class TNFRouter {
    private registry;
    private systemQueue;
    private config;
    private eventEmitter;
    private redisService;
    constructor(redisService: UnifiedRedisService, config?: Partial<RouterConfig>, eventEmitter?: EventEmitter2);
    start(): Promise<void>;
    stop(): Promise<void>;
    private handleIngressMessage;
    /**
     * Route a task to the best capable agent OR system queue
     *
     * NEW: Enhanced with agent inbox routing and load balancing
     */
    private routeTask;
    /**
     * NEW: Route task to agent's inbox
     */
    private routeToInbox;
    /**
     * NEW: Select best agent based on load balancing (fewest pending tasks)
     */
    private selectBestAgent;
    /**
     * Route to Backend Bull Queue
     */
    private routeSystemTask;
    /**
     * Route a query (information request)
     */
    private routeQuery;
    /**
     * Forward envelope to specific agent (legacy/fallback method)
     */
    private forwardToAgent;
    /**
     * Send error response
     */
    private sendError;
    private logEvent;
    /**
     * NEW: Get routing statistics
     */
    getRoutingStats(): Promise<{
        totalAgents: number;
        agentLoads: Map<string, number>;
    }>;
    private logTaskExecution;
}
//# sourceMappingURL=tnf-router.d.ts.map