var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SharedMemory_1;
import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
let SharedMemory = SharedMemory_1 = class SharedMemory {
    constructor(redisService) {
        this.redisService = redisService;
        this.logger = new Logger(SharedMemory_1.name);
        this.memoryItems = new Map();
        this.logger.log('SharedMemory service initialized');
    }
    async store(item) {
        try {
            const id = this.generateId();
            const memoryItem = {
                ...item,
                id,
                timestamp: new Date()
            };
            this.memoryItems.set(id, memoryItem);
            // Store in Redis if available
            if (this.redisService) {
                const key = `memory:${id}`;
                await this.redisService.set(key, JSON.stringify(memoryItem));
                // Set expiration if specified
                if (memoryItem.expiresAt) {
                    const ttl = Math.floor((memoryItem.expiresAt.getTime() - Date.now()) / 1000);
                    if (ttl > 0) {
                        await this.redisService.expire(key, ttl);
                    }
                }
            }
            this.logger.debug(`Memory item stored: ${id}`);
            return id;
        }
        catch (error) {
            this.logger.error('Failed to store memory item', { error, item });
            throw error;
        }
    }
    async retrieve(filter, limit = 100) {
        try {
            let items = Array.from(this.memoryItems.values());
            // Apply filters
            if (filter.agentId) {
                items = items.filter(item => item.agentId === filter.agentId);
            }
            if (filter.taskId) {
                items = items.filter(item => item.taskId === filter.taskId);
            }
            if (filter.type) {
                items = items.filter(item => item.type === filter.type);
            }
            if (filter.tags && filter.tags.length > 0) {
                items = items.filter(item => filter.tags.some(tag => item.tags.includes(tag)));
            }
            if (filter.fromDate) {
                items = items.filter(item => item.timestamp >= filter.fromDate);
            }
            if (filter.toDate) {
                items = items.filter(item => item.timestamp <= filter.toDate);
            }
            // Remove expired items
            const now = new Date();
            items = items.filter(item => !item.expiresAt || item.expiresAt > now);
            // Sort by priority and timestamp
            items.sort((a, b) => {
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
                if (priorityDiff !== 0)
                    return priorityDiff;
                return b.timestamp.getTime() - a.timestamp.getTime();
            });
            return items.slice(0, limit);
        }
        catch (error) {
            this.logger.error('Failed to retrieve memory items', { error, filter });
            throw error;
        }
    }
    async update(id, updates) {
        try {
            const item = this.memoryItems.get(id);
            if (!item) {
                return false;
            }
            const updatedItem = {
                ...item,
                ...updates,
                timestamp: new Date()
            };
            this.memoryItems.set(id, updatedItem);
            // Update in Redis if available
            if (this.redisService) {
                const key = `memory:${id}`;
                await this.redisService.set(key, JSON.stringify(updatedItem));
            }
            this.logger.debug(`Memory item updated: ${id}`);
            return true;
        }
        catch (error) {
            this.logger.error('Failed to update memory item', { error, id, updates });
            throw error;
        }
    }
    async delete(id) {
        try {
            const deleted = this.memoryItems.delete(id);
            // Delete from Redis if available
            if (this.redisService && deleted) {
                await this.redisService.del(`memory:${id}`);
            }
            if (deleted) {
                this.logger.debug(`Memory item deleted: ${id}`);
            }
            return deleted;
        }
        catch (error) {
            this.logger.error('Failed to delete memory item', { error, id });
            throw error;
        }
    }
    async getById(id) {
        try {
            const item = this.memoryItems.get(id);
            // Check if expired
            if (item && item.expiresAt && item.expiresAt <= new Date()) {
                await this.delete(id);
                return null;
            }
            return item || null;
        }
        catch (error) {
            this.logger.error('Failed to get memory item by id', { error, id });
            throw error;
        }
    }
    async clear(agentId, taskId) {
        try {
            const itemsToDelete = [];
            for (const [id, item] of this.memoryItems) {
                let shouldDelete = true;
                if (agentId && item.agentId !== agentId) {
                    shouldDelete = false;
                }
                if (taskId && item.taskId !== taskId) {
                    shouldDelete = false;
                }
                if (shouldDelete) {
                    itemsToDelete.push(id);
                }
            }
            // Delete items
            for (const id of itemsToDelete) {
                await this.delete(id);
            }
            const context = agentId ? `agent ${agentId}` : '';
            const taskContext = taskId ? `task ${taskId}` : '';
            const fullContext = [context, taskContext].filter(Boolean).join(' ');
            this.logger.log(`Cleared memory items for ${fullContext || 'all items'}`);
        }
        catch (error) {
            this.logger.error('Failed to clear memory items', { error, agentId, taskId });
            throw error;
        }
    }
    async search(query, filter = {}, limit = 50) {
        try {
            const items = await this.retrieve(filter, limit * 2); // Get more items for searching
            const queryLower = query.toLowerCase();
            const scored = items.map(item => {
                let score = 0;
                const content = JSON.stringify(item.content).toLowerCase();
                const metadata = JSON.stringify(item.metadata).toLowerCase();
                const tags = item.tags.join(' ').toLowerCase();
                // Score based on matches
                if (content.includes(queryLower))
                    score += 3;
                if (metadata.includes(queryLower))
                    score += 2;
                if (tags.includes(queryLower))
                    score += 1;
                return { item, score };
            });
            return scored
                .filter(({ score }) => score > 0)
                .sort((a, b) => b.score - a.score)
                .slice(0, limit)
                .map(({ item }) => item);
        }
        catch (error) {
            this.logger.error('Failed to search memory items', { error, query, filter });
            throw error;
        }
    }
    async getStats(agentId) {
        try {
            const items = agentId
                ? Array.from(this.memoryItems.values()).filter(item => item.agentId === agentId)
                : Array.from(this.memoryItems.values());
            const itemsByType = {};
            const itemsByPriority = {};
            items.forEach(item => {
                itemsByType[item.type] = (itemsByType[item.type] || 0) + 1;
                itemsByPriority[item.priority] = (itemsByPriority[item.priority] || 0) + 1;
            });
            return {
                totalItems: items.length,
                itemsByType,
                itemsByPriority
            };
        }
        catch (error) {
            this.logger.error('Failed to get memory stats', { error, agentId });
            throw error;
        }
    }
    generateId() {
        return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
};
SharedMemory = SharedMemory_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [RedisService])
], SharedMemory);
export { SharedMemory };
