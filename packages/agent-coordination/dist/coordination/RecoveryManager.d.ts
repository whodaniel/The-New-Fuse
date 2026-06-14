import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
import { PresenceTracker } from '../presence/presence-tracker.js';
import { SharedStateManager } from './shared-state-manager.js';
import { TaskQueueManager } from '../queues/task-queue-manager.js';
import { MessageSerializer } from '../serializers/message-serializer.js';
export declare class RecoveryManager {
    private readonly redisService;
    private readonly presenceTracker;
    private readonly sharedStateManager;
    private readonly taskQueueManager;
    private readonly serializer;
    private readonly keyPrefix;
    private readonly logger;
    private checkInterval;
    private recoveredAgents;
    constructor(redisService: UnifiedRedisService, presenceTracker: PresenceTracker, sharedStateManager: SharedStateManager, taskQueueManager: TaskQueueManager, serializer: MessageSerializer, keyPrefix?: string);
    /**
     * Start recovery monitoring
     */
    startMonitoring(intervalMs?: number): void;
    /**
     * Stop recovery monitoring
     */
    stopMonitoring(): void;
    /**
     * Perform system health check and recovery
     */
    private performHealthCheck;
    /**
     * Detect agents that are offline
     */
    private detectOfflineAgents;
    /**
     * Recover resources held by an offline agent (single)
     */
    recoverAgent(agentId: string): Promise<void>;
    /**
     * Recover resources held by offline agents (batch)
     */
    recoverAgents(agentIds: string[]): Promise<void>;
}
//# sourceMappingURL=RecoveryManager.d.ts.map