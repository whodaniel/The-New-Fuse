var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AgentMemoryIntegration_1;
import { Injectable, Logger } from '@nestjs/common';
let AgentMemoryIntegration = AgentMemoryIntegration_1 = class AgentMemoryIntegration {
    constructor() {
        this.logger = new Logger(AgentMemoryIntegration_1.name);
        this.stores = new Map();
        this.configs = new Map();
    }
    configure(config) {
        this.configs.set(config.agentId, {
            maxContextTokens: 8000,
            retentionDays: 90,
            autoSummarize: true,
            ...config,
        });
        if (!this.stores.has(config.agentId)) {
            this.stores.set(config.agentId, []);
        }
        this.logger.log(`Agent memory configured: ${config.agentId}`);
    }
    async store(agentId, category, content, importance = 0.5, metadata) {
        this.ensureStore(agentId);
        const entry = {
            id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            agentId,
            category,
            content,
            metadata,
            createdAt: new Date().toISOString(),
            lastAccessedAt: new Date().toISOString(),
            accessCount: 0,
            importance,
        };
        const store = this.stores.get(agentId);
        store.push(entry);
        this.logger.debug(`Stored ${category} memory for ${agentId}: ${entry.id}`);
        return entry.id;
    }
    async retrieve(agentId, query, limit = 10) {
        const start = Date.now();
        this.ensureStore(agentId);
        const store = this.stores.get(agentId);
        const lowerQuery = query.toLowerCase();
        const scored = store.map((entry) => {
            let score = 0;
            const lowerContent = entry.content.toLowerCase();
            if (lowerContent.includes(lowerQuery))
                score += 0.4;
            const queryWords = lowerQuery.split(/\s+/);
            for (const word of queryWords) {
                if (lowerContent.includes(word))
                    score += 0.1;
            }
            score += entry.importance * 0.3;
            score += Math.min(entry.accessCount * 0.01, 0.2);
            const ageDays = (Date.now() - new Date(entry.createdAt).getTime()) / 86400000;
            score *= Math.max(0.1, 1 - ageDays * 0.01);
            entry.lastAccessedAt = new Date().toISOString();
            entry.accessCount++;
            return { entry, score };
        });
        scored.sort((a, b) => b.score - a.score);
        const entries = scored.slice(0, limit).map((s) => s.entry);
        return { entries, total: store.length, queryTime: Date.now() - start };
    }
    async getTaskHistory(agentId, limit = 20) {
        this.ensureStore(agentId);
        const store = this.stores.get(agentId);
        return store
            .filter((e) => e.category === 'task_history')
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, limit);
    }
    async getFacts(agentId) {
        this.ensureStore(agentId);
        return this.stores.get(agentId).filter((e) => e.category === 'fact');
    }
    async getInteractions(agentId, limit = 20) {
        this.ensureStore(agentId);
        return this.stores
            .get(agentId)
            .filter((e) => e.category === 'interaction')
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, limit);
    }
    async getContextWindow(agentId, maxTokens = 8000) {
        this.ensureStore(agentId);
        const store = this.stores.get(agentId);
        const config = this.configs.get(agentId);
        const tokenLimit = maxTokens || config?.maxContextTokens || 8000;
        const sorted = [...store].sort((a, b) => b.importance - a.importance);
        const selected = [];
        let tokenEstimate = 0;
        for (const entry of sorted) {
            const entryTokens = Math.ceil(entry.content.length / 4);
            if (tokenEstimate + entryTokens > tokenLimit)
                break;
            selected.push(entry);
            tokenEstimate += entryTokens;
        }
        return selected.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    async deleteEntry(agentId, memoryId) {
        this.ensureStore(agentId);
        const store = this.stores.get(agentId);
        const index = store.findIndex((e) => e.id === memoryId);
        if (index === -1)
            return false;
        store.splice(index, 1);
        return true;
    }
    async pruneExpired(agentId) {
        this.ensureStore(agentId);
        const config = this.configs.get(agentId);
        const retentionDays = config?.retentionDays || 90;
        const cutoff = Date.now() - retentionDays * 86400000;
        const store = this.stores.get(agentId);
        const before = store.length;
        const pruned = store.filter((e) => new Date(e.createdAt).getTime() > cutoff || e.importance >= 0.8);
        this.stores.set(agentId, pruned);
        return before - pruned.length;
    }
    getStats(agentId) {
        this.ensureStore(agentId);
        const store = this.stores.get(agentId);
        const byCategory = store.reduce((acc, e) => {
            acc[e.category] = (acc[e.category] || 0) + 1;
            return acc;
        }, {});
        return {
            agentId,
            totalEntries: store.length,
            byCategory,
            oldestEntry: store.length > 0 ? store[0].createdAt : null,
        };
    }
    ensureStore(agentId) {
        if (!this.stores.has(agentId)) {
            this.stores.set(agentId, []);
        }
        if (!this.configs.has(agentId)) {
            this.configure({ agentId });
        }
    }
};
AgentMemoryIntegration = AgentMemoryIntegration_1 = __decorate([
    Injectable()
], AgentMemoryIntegration);
export { AgentMemoryIntegration };
//# sourceMappingURL=AgentMemoryIntegration.js.map