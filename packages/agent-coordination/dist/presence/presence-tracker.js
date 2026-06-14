"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PresenceTracker = void 0;
const common_1 = require("@nestjs/common");
const a2a_core_1 = require("@the-new-fuse/a2a-core");
const coordination_types_1 = require("../types/coordination.types");
/**
 * Agent presence tracker with heartbeat system
 */
class PresenceTracker {
    constructor(redisService, config, serializer) {
        this.redisService = redisService;
        this.config = config;
        this.logger = new common_1.Logger(PresenceTracker.name);
        this.heartbeatTimers = new Map();
        this.keyPrefix = config.keyPrefix || 'agent-coord:';
        this.heartbeatInterval = config.heartbeatInterval || 30000; // 30 seconds
        this.heartbeatTimeout = config.heartbeatTimeout || 90000; // 90 seconds (3x heartbeat)
        this.serializer = serializer;
    }
    /**
     * Register agent presence
     */
    async registerAgent(agentId, metadata) {
        const presence = {
            agentId,
            status: a2a_core_1.AgentStatus.ONLINE,
            lastSeen: Date.now(),
            lastHeartbeat: Date.now(),
            metadata,
        };
        await this.updatePresence(presence);
        this.startHeartbeat(agentId);
        this.logger.log(`Agent registered: ${agentId}`);
    }
    /**
     * Unregister agent presence
     */
    async unregisterAgent(agentId) {
        this.stopHeartbeat(agentId);
        const presence = await this.getPresence(agentId);
        if (presence) {
            presence.status = a2a_core_1.AgentStatus.OFFLINE;
            presence.lastSeen = Date.now();
            await this.updatePresence(presence);
        }
        await this.redisService.srem(`${this.keyPrefix}agents:active`, agentId);
        // Publish offline event
        await this.publishPresenceEvent(agentId, a2a_core_1.AgentStatus.OFFLINE);
        this.logger.log(`Agent unregistered: ${agentId}`);
    }
    /**
     * Update agent status
     */
    async updateStatus(agentId, status) {
        const presence = await this.getPresence(agentId);
        if (presence) {
            presence.status = status;
            presence.lastSeen = Date.now();
            await this.updatePresence(presence);
            await this.publishPresenceEvent(agentId, status);
        }
    }
    /**
     * Get agent presence
     */
    async getPresence(agentId) {
        const key = `${this.keyPrefix}presence:${agentId}`;
        const data = await this.redisService.get(key);
        if (!data)
            return null;
        try {
            return this.serializer.deserialize(data);
        }
        catch (error) {
            this.logger.error(`Failed to deserialize presence for ${agentId}:`, error);
            return null;
        }
    }
    /**
     * Get all active agents
     */
    async getActiveAgents() {
        const agentIds = await this.redisService.smembers(`${this.keyPrefix}agents:active`);
        const presences = [];
        for (const agentId of agentIds) {
            const presence = await this.getPresence(agentId);
            if (presence && this.isAgentAlive(presence)) {
                presences.push(presence);
            }
        }
        return presences;
    }
    /**
     * Check if agent is online
     */
    async isOnline(agentId) {
        const presence = await this.getPresence(agentId);
        return presence ? this.isAgentAlive(presence) : false;
    }
    /**
     * Start monitoring for stale agents
     */
    startMonitoring() {
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
        }
        this.monitorInterval = setInterval(async () => {
            await this.checkStaleAgents();
        }, this.heartbeatInterval);
        this.logger.log('Presence monitoring started');
    }
    /**
     * Stop monitoring
     */
    stopMonitoring() {
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
            this.monitorInterval = undefined;
        }
        // Clear all heartbeat timers
        for (const timer of this.heartbeatTimers.values()) {
            clearInterval(timer);
        }
        this.heartbeatTimers.clear();
        this.logger.log('Presence monitoring stopped');
    }
    /**
     * Update agent presence
     */
    async updatePresence(presence) {
        const key = `${this.keyPrefix}presence:${presence.agentId}`;
        const ttl = Math.ceil(this.heartbeatTimeout / 1000);
        await this.redisService.set(key, this.serializer.serialize(presence), ttl);
        // Add to active agents set
        if (presence.status === a2a_core_1.AgentStatus.ONLINE || presence.status === a2a_core_1.AgentStatus.BUSY) {
            await this.redisService.sadd(`${this.keyPrefix}agents:active`, presence.agentId);
        }
    }
    /**
     * Start heartbeat for agent
     */
    startHeartbeat(agentId) {
        // Clear existing heartbeat if any
        this.stopHeartbeat(agentId);
        const timer = setInterval(async () => {
            try {
                const presence = await this.getPresence(agentId);
                if (presence) {
                    presence.lastHeartbeat = Date.now();
                    presence.lastSeen = Date.now();
                    await this.updatePresence(presence);
                }
            }
            catch (error) {
                this.logger.error(`Heartbeat failed for ${agentId}:`, error);
            }
        }, this.heartbeatInterval);
        this.heartbeatTimers.set(agentId, timer);
    }
    /**
     * Stop heartbeat for agent
     */
    stopHeartbeat(agentId) {
        const timer = this.heartbeatTimers.get(agentId);
        if (timer) {
            clearInterval(timer);
            this.heartbeatTimers.delete(agentId);
        }
    }
    /**
     * Check if agent is alive based on heartbeat
     */
    isAgentAlive(presence) {
        const now = Date.now();
        const timeSinceHeartbeat = now - presence.lastHeartbeat;
        return timeSinceHeartbeat < this.heartbeatTimeout;
    }
    /**
     * Check for stale agents and mark them offline
     */
    async checkStaleAgents() {
        const activeAgentIds = await this.redisService.smembers(`${this.keyPrefix}agents:active`);
        for (const agentId of activeAgentIds) {
            const presence = await this.getPresence(agentId);
            if (!presence || !this.isAgentAlive(presence)) {
                // Mark as offline
                if (presence) {
                    presence.status = a2a_core_1.AgentStatus.OFFLINE;
                    presence.lastSeen = Date.now();
                    await this.updatePresence(presence);
                }
                await this.redisService.srem(`${this.keyPrefix}agents:active`, agentId);
                await this.publishPresenceEvent(agentId, a2a_core_1.AgentStatus.OFFLINE);
                this.logger.warn(`Agent marked offline due to stale heartbeat: ${agentId}`);
            }
        }
    }
    /**
     * Publish presence event
     */
    async publishPresenceEvent(agentId, status) {
        const event = {
            type: 'presence:changed',
            agentId,
            status,
            timestamp: Date.now(),
        };
        await this.redisService.publish(`${this.keyPrefix}${coordination_types_1.CoordinationChannel.PRESENCE}`, this.serializer.serialize(event));
    }
}
exports.PresenceTracker = PresenceTracker;
//# sourceMappingURL=presence-tracker.js.map