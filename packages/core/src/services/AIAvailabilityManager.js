"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIAvailabilityManager = void 0;
const events_1 = __importDefault(require("events"));
/**
 * AIAvailabilityManager
 * - keeps an in-memory registry of available agents
 * - receives registration + heartbeat signals
 * - provides a simple scoring function and assignment API
 */
class AIAvailabilityManager extends events_1.default {
    agents = new Map();
    // heartbeat time window (ms) to consider an agent alive
    heartbeatTTL = 60_000; // 60s
    constructor(opts) {
        super();
        if (opts?.heartbeatTTL)
            this.heartbeatTTL = opts.heartbeatTTL;
    }
    registerAgent(info) {
        const now = Date.now();
        const full = { ...info, lastSeen: now, score: 0 };
        this.agents.set(info.id, full);
        this.emit('agentRegistered', full);
        return full;
    }
    handleHeartbeat(agentId, metadata) {
        const now = Date.now();
        const existing = this.agents.get(agentId);
        if (existing) {
            const updated = { ...existing, lastSeen: now, metadata: { ...existing.metadata, ...metadata } };
            this.agents.set(agentId, updated);
            this.emit('agentHeartbeat', updated);
            return updated;
        }
        // if not registered yet, create a minimal entry
        const created = {
            id: agentId,
            name: metadata?.name,
            type: metadata?.type,
            capabilities: metadata?.capabilities || [],
            lastSeen: now,
            metadata: metadata || {},
            score: 0
        };
        this.agents.set(agentId, created);
        this.emit('agentRegistered', created);
        return created;
    }
    // garbage collect dead agents
    pruneStale() {
        const now = Date.now();
        const removed = [];
        for (const [id, info] of this.agents.entries()) {
            if (now - info.lastSeen > this.heartbeatTTL) {
                this.agents.delete(id);
                removed.push(info);
            }
        }
        if (removed.length)
            this.emit('agentsRemoved', removed);
        return removed;
    }
    listAgents() {
        return Array.from(this.agents.values());
    }
    // simple scoring: prefer agents with more capabilities and more recent lastSeen
    scoreAgent(info, task) {
        const now = Date.now();
        const ageFactor = Math.max(0, 1 - (now - info.lastSeen) / this.heartbeatTTL);
        const caps = (info.capabilities || []).length;
        // task matching: +1 per matching capability if task specifies constraints.capabilities
        let matchBonus = 0;
        if (task?.constraints?.['capabilities'] && Array.isArray(task.constraints['capabilities'])) {
            const want = task.constraints['capabilities'];
            matchBonus = want.filter((w) => (info.capabilities || []).includes(w)).length;
        }
        // normalized score
        return ageFactor * (1 + caps * 0.1) + matchBonus * 0.5;
    }
    findBestAgentForTask(task) {
        let best = null;
        let bestScore = -Infinity;
        for (const info of this.agents.values()) {
            const s = this.scoreAgent(info, task);
            if (s > bestScore) {
                bestScore = s;
                best = info;
            }
        }
        return best ? { agent: best, score: bestScore } : null;
    }
    // assign task: pick best agent and emit an event, returning the chosen agent
    assignTask(task) {
        const chosen = this.findBestAgentForTask(task);
        if (!chosen) {
            this.emit('assignmentFailed', { task });
            return null;
        }
        this.emit('taskAssigned', { task, agent: chosen.agent, score: chosen.score });
        return chosen.agent;
    }
}
exports.AIAvailabilityManager = AIAvailabilityManager;
exports.default = AIAvailabilityManager;
//# sourceMappingURL=AIAvailabilityManager.js.map