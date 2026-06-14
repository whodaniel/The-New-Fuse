"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecoveryManager = void 0;
const common_1 = require("@nestjs/common");
const coordination_types_1 = require("../types/coordination.types");
class RecoveryManager {
    constructor(redisService, presenceTracker, sharedStateManager, taskQueueManager, serializer, keyPrefix = 'agent-coord:') {
        this.redisService = redisService;
        this.presenceTracker = presenceTracker;
        this.sharedStateManager = sharedStateManager;
        this.taskQueueManager = taskQueueManager;
        this.serializer = serializer;
        this.keyPrefix = keyPrefix;
        this.logger = new common_1.Logger(RecoveryManager.name);
        this.checkInterval = null;
        this.recoveredAgents = new Set();
    }
    /**
     * Start recovery monitoring
     */
    startMonitoring(intervalMs = 30000) {
        if (this.checkInterval) {
            return;
        }
        this.logger.log('Starting recovery monitoring...');
        this.checkInterval = setInterval(() => {
            this.performHealthCheck().catch(err => {
                this.logger.error('Error during health check:', err);
            });
        }, intervalMs);
    }
    /**
     * Stop recovery monitoring
     */
    stopMonitoring() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
            this.logger.log('Recovery monitoring stopped');
        }
    }
    /**
     * Perform system health check and recovery
     */
    async performHealthCheck() {
        // 1. Check for offline agents
        const offlineAgents = await this.detectOfflineAgents();
        // Identify agents that need recovery (offline and not yet recovered)
        const agentsToRecover = offlineAgents.filter(id => !this.recoveredAgents.has(id));
        if (agentsToRecover.length > 0) {
            this.logger.warn(`Found ${agentsToRecover.length} new offline agents requiring recovery: ${agentsToRecover.join(', ')}`);
            // Perform batch recovery
            await this.recoverAgents(agentsToRecover);
        }
        // Cleanup recoveredAgents set: remove agents that are no longer in the offline list (i.e., back online or expired)
        // This ensures that if an agent comes back online and then goes offline again, we recover it again.
        const currentOfflineSet = new Set(offlineAgents);
        for (const agentId of this.recoveredAgents) {
            if (!currentOfflineSet.has(agentId)) {
                this.recoveredAgents.delete(agentId);
            }
        }
        // 2. Check for stalled tasks
        try {
            const queueStats = await this.taskQueueManager.getQueueStats('agent-tasks');
            if (queueStats && queueStats.failed > 0) {
                // Just log for observability. BullMQ handles retries.
                // We could implement advanced logic here to re-queue if maxRetries not reached but stalled.
            }
        }
        catch (e) {
            this.logger.warn('Failed to get queue stats during health check');
        }
    }
    /**
     * Detect agents that are offline
     */
    async detectOfflineAgents() {
        const offlineAgents = [];
        // Scan all presence keys
        const presencePattern = `${this.keyPrefix}presence:*`;
        let cursor = '0';
        do {
            const [nextCursor, keys] = await this.redisService.scan(cursor, presencePattern, 100);
            cursor = nextCursor;
            for (const key of keys) {
                try {
                    const data = await this.redisService.get(key);
                    if (data) {
                        const presence = this.serializer.deserialize(data);
                        if (presence && presence.status === coordination_types_1.AgentStatus.OFFLINE) {
                            offlineAgents.push(presence.agentId);
                        }
                    }
                }
                catch (error) {
                    // Ignore deserialization errors
                }
            }
        } while (cursor !== '0');
        return offlineAgents;
    }
    /**
     * Recover resources held by an offline agent (single)
     */
    async recoverAgent(agentId) {
        await this.recoverAgents([agentId]);
    }
    /**
     * Recover resources held by offline agents (batch)
     */
    async recoverAgents(agentIds) {
        if (agentIds.length === 0)
            return;
        this.logger.log(`Starting recovery for agents: ${agentIds.join(', ')}`);
        // 1. Release locks held by these agents
        const releasedLocks = await this.sharedStateManager.releaseLocksForAgents(this.redisService, agentIds);
        if (releasedLocks > 0) {
            this.logger.log(`Released ${releasedLocks} locks held by offline agents`);
        }
        // Mark as recovered
        agentIds.forEach(id => this.recoveredAgents.add(id));
        this.logger.log(`Recovery completed for agents: ${agentIds.join(', ')}`);
    }
}
exports.RecoveryManager = RecoveryManager;
//# sourceMappingURL=RecoveryManager.js.map