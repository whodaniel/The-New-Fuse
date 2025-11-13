/**
 * @fileoverview Memory manager that coordinates multiple memory systems
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MemoryManager_1;
import { Injectable, Logger } from '@nestjs/common';
import { MemorySystem } from './MemorySystem';
import { MemoryContentType } from '../types/memory';
import { ServiceState } from '../constants/types';
import { BaseError } from '../utils/errors';
let MemoryManager = MemoryManager_1 = class MemoryManager {
    logger = new Logger(MemoryManager_1.name);
    state = ServiceState.UNINITIALIZED;
    memorySystems = new Map();
    defaultSystem;
    constructor() {
        // Initialize default memory system
        this.defaultSystem = new MemorySystem();
        this.memorySystems.set('default', this.defaultSystem);
    }
    async start() {
        if (this.state === ServiceState.RUNNING) {
            this.logger.warn('MemoryManager is already running');
            return;
        }
        try {
            this.state = ServiceState.INITIALIZING;
            this.logger.log('Starting MemoryManager');
            // Start all memory systems
            for (const [name, system] of this.memorySystems) {
                await system.start();
                this.logger.debug(`Started memory system: ${name}`);
            }
            this.state = ServiceState.RUNNING;
            this.logger.log('MemoryManager started successfully');
        }
        catch (error) {
            this.state = ServiceState.ERROR;
            this.logger.error('Failed to start MemoryManager', error);
            throw error;
        }
    }
    async stop() {
        if (this.state === ServiceState.STOPPED) {
            this.logger.warn('MemoryManager is already stopped');
            return;
        }
        try {
            this.state = ServiceState.STOPPING;
            this.logger.log('Stopping MemoryManager');
            // Stop all memory systems
            for (const [name, system] of this.memorySystems) {
                await system.stop();
                this.logger.debug(`Stopped memory system: ${name}`);
            }
            this.state = ServiceState.STOPPED;
            this.logger.log('MemoryManager stopped successfully');
        }
        catch (error) {
            this.state = ServiceState.ERROR;
            this.logger.error('Failed to stop MemoryManager', error);
            throw error;
        }
    }
    getState() {
        return this.state;
    }
    // Memory operations that delegate to appropriate systems
    async store(content, systemName) {
        const system = this.getMemorySystem(systemName);
        return await system.store(content);
    }
    async retrieve(id, systemName) {
        const system = this.getMemorySystem(systemName);
        return await system.retrieve(id);
    }
    async update(id, updates, systemName) {
        const system = this.getMemorySystem(systemName);
        return await system.update(id, updates);
    }
    async delete(id, systemName) {
        const system = this.getMemorySystem(systemName);
        return await system.delete(id);
    }
    async search(query, systemName) {
        const system = this.getMemorySystem(systemName);
        return await system.search(query);
    }
    // Cross-system search
    async searchAll(query) {
        const allResults = [];
        let totalQueryTime = 0;
        for (const [name, system] of this.memorySystems) {
            try {
                const result = await system.search(query);
                allResults.push(result);
                totalQueryTime += result.queryTime;
            }
            catch (error) {
                this.logger.warn(`Search failed in memory system: ${name}`, error);
            }
        }
        // Combine and sort results
        const combinedResults = allResults.flatMap(result => result.results);
        combinedResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
        // Apply limit across all results
        const limitedResults = query.limit ? combinedResults.slice(0, query.limit) : combinedResults;
        return {
            results: limitedResults,
            totalCount: combinedResults.length,
            queryTime: totalQueryTime,
            suggestions: this.combineSuggestions(allResults.map(r => r.suggestions || [])),
        };
    }
    // Agent-specific memory operations
    async storeAgentMemory(agentId, content, type, metadata) {
        const memoryContent = {
            content,
            type,
            metadata: {
                source: 'agent',
                agentId,
                tags: [`agent:${agentId}`, type],
                importance: 0.5,
                isPrivate: false,
                ...metadata,
            },
        };
        return await this.store(memoryContent);
    }
    async getAgentMemories(agentId, limit) {
        const query = {
            query: '',
            agentId,
            limit,
        };
        const result = await this.search(query);
        return result.results.map(r => r.content);
    }
    async storeConversation(agentId, conversation, metadata) {
        return await this.storeAgentMemory(agentId, conversation, MemoryContentType.CONVERSATION, {
            ...metadata,
            tags: ['conversation', `agent:${agentId}`],
        });
    }
    async storeTaskResult(agentId, taskId, result, metadata) {
        const content = typeof result === 'string' ? result : JSON.stringify(result);
        return await this.storeAgentMemory(agentId, content, MemoryContentType.TASK_RESULT, {
            ...metadata,
            taskId,
            tags: ['task_result', `agent:${agentId}`, `task:${taskId}`],
        });
    }
    async storeKnowledge(content, tags, metadata) {
        const memoryContent = {
            content,
            type: MemoryContentType.KNOWLEDGE,
            metadata: {
                source: 'knowledge_base',
                tags: ['knowledge', ...tags],
                importance: 0.8,
                isPrivate: false,
                ...metadata,
            },
        };
        return await this.store(memoryContent);
    }
    // Memory system management
    addMemorySystem(name, system) {
        this.memorySystems.set(name, system);
        this.logger.log(`Added memory system: ${name}`);
    }
    removeMemorySystem(name) {
        if (name === 'default') {
            throw new BaseError('Cannot remove default memory system', 'INVALID_OPERATION');
        }
        const removed = this.memorySystems.delete(name);
        if (removed) {
            this.logger.log(`Removed memory system: ${name}`);
        }
        return removed;
    }
    getMemorySystemNames() {
        return Array.from(this.memorySystems.keys());
    }
    async getSystemStats(systemName) {
        if (systemName) {
            const system = this.getMemorySystem(systemName);
            return { [systemName]: await system.getStats() };
        }
        const stats = {};
        for (const [name, system] of this.memorySystems) {
            try {
                stats[name] = await system.getStats();
            }
            catch (error) {
                this.logger.warn(`Failed to get stats for memory system: ${name}`, error);
                stats[name] = { error: error.message };
            }
        }
        return stats;
    }
    // Utility methods
    async findSimilarMemories(content, limit = 5) {
        const query = {
            query: content,
            limit,
            minRelevance: 0.3,
        };
        const result = await this.searchAll(query);
        return result.results.map(r => r.content);
    }
    async getRecentMemories(agentId, limit = 10) {
        const query = {
            query: '',
            agentId,
            limit,
        };
        const result = await this.searchAll(query);
        // Sort by creation date (most recent first)
        const sortedResults = result.results.sort((a, b) => b.content.createdAt.getTime() - a.content.createdAt.getTime());
        return sortedResults.map(r => r.content);
    }
    async getMemoriesByTag(tag, limit) {
        const query = {
            query: '',
            tags: [tag],
            limit,
        };
        const result = await this.searchAll(query);
        return result.results.map(r => r.content);
    }
    getMemorySystem(systemName) {
        const name = systemName || 'default';
        const system = this.memorySystems.get(name);
        if (!system) {
            throw new BaseError(`Memory system not found: ${name}`, 'MEMORY_SYSTEM_NOT_FOUND');
        }
        return system;
    }
    combineSuggestions(suggestionArrays) {
        const suggestionCounts = new Map();
        for (const suggestions of suggestionArrays) {
            for (const suggestion of suggestions) {
                suggestionCounts.set(suggestion, (suggestionCounts.get(suggestion) || 0) + 1);
            }
        }
        // Sort by frequency and return top suggestions
        return Array.from(suggestionCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([suggestion]) => suggestion);
    }
};
MemoryManager = MemoryManager_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [])
], MemoryManager);
export { MemoryManager };
//# sourceMappingURL=MemoryManager.js.map