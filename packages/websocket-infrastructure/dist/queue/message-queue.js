"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MessageQueue_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageQueue = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const events_1 = require("events");
let MessageQueue = MessageQueue_1 = class MessageQueue extends events_1.EventEmitter {
    logger = new common_1.Logger(MessageQueue_1.name);
    queue = new Map();
    priorityQueue = [];
    processingInterval;
    config;
    isProcessing = false;
    constructor(config) {
        super();
        this.config = {
            maxSize: config?.maxSize ?? 10000,
            ttl: config?.ttl ?? 3600000,
            processingInterval: config?.processingInterval ?? 100,
            maxRetries: config?.maxRetries ?? 3,
        };
    }
    start() {
        if (this.processingInterval) {
            this.logger.warn('Queue processing already started');
            return;
        }
        this.processingInterval = setInterval(() => {
            this.processQueue();
        }, this.config.processingInterval);
        this.logger.log('Message queue started');
    }
    stop() {
        if (this.processingInterval) {
            clearInterval(this.processingInterval);
            this.processingInterval = undefined;
        }
        this.logger.log('Message queue stopped');
    }
    enqueue(channel, data, priority = 0) {
        if (this.queue.size >= this.config.maxSize) {
            this.logger.warn(`Queue size limit reached: ${this.config.maxSize}`);
            this.emit('queue:full', { size: this.queue.size });
            const oldest = this.findOldestMessage();
            if (oldest) {
                this.queue.delete(oldest.id);
                this.emit('message:dropped', oldest);
            }
        }
        const messageId = (0, uuid_1.v4)();
        const item = {
            id: messageId,
            channel,
            data,
            timestamp: new Date(),
            retries: 0,
            maxRetries: this.config.maxRetries,
            priority,
        };
        this.queue.set(messageId, item);
        this.insertIntoPriorityQueue(item);
        this.logger.debug(`Message enqueued: ${messageId} (Channel: ${channel}, Priority: ${priority})`);
        this.emit('message:enqueued', item);
        return messageId;
    }
    dequeue() {
        if (this.priorityQueue.length === 0) {
            return undefined;
        }
        const item = this.priorityQueue.shift();
        if (item) {
            this.queue.delete(item.id);
            this.emit('message:dequeued', item);
        }
        return item;
    }
    get(messageId) {
        return this.queue.get(messageId);
    }
    remove(messageId) {
        const item = this.queue.get(messageId);
        if (!item) {
            return false;
        }
        this.queue.delete(messageId);
        const index = this.priorityQueue.findIndex((i) => i.id === messageId);
        if (index !== -1) {
            this.priorityQueue.splice(index, 1);
        }
        this.emit('message:removed', item);
        return true;
    }
    retry(messageId) {
        const item = this.queue.get(messageId);
        if (!item) {
            return false;
        }
        item.retries++;
        if (item.retries >= item.maxRetries) {
            this.logger.error(`Message ${messageId} exceeded max retries (${item.maxRetries})`);
            this.queue.delete(messageId);
            this.emit('message:failed', item);
            return false;
        }
        this.logger.debug(`Retrying message ${messageId} (Attempt ${item.retries}/${item.maxRetries})`);
        this.emit('message:retry', item);
        return true;
    }
    async processQueue() {
        if (this.isProcessing || this.priorityQueue.length === 0) {
            return;
        }
        this.isProcessing = true;
        try {
            this.cleanupExpiredMessages();
            const item = this.dequeue();
            if (item) {
                this.emit('message:process', item);
            }
        }
        catch (error) {
            this.logger.error(`Error processing queue: ${error}`);
        }
        finally {
            this.isProcessing = false;
        }
    }
    insertIntoPriorityQueue(item) {
        let insertIndex = this.priorityQueue.length;
        for (let i = 0; i < this.priorityQueue.length; i++) {
            if (item.priority > this.priorityQueue[i].priority) {
                insertIndex = i;
                break;
            }
        }
        this.priorityQueue.splice(insertIndex, 0, item);
    }
    findOldestMessage() {
        let oldest;
        for (const item of this.queue.values()) {
            if (!oldest || item.timestamp < oldest.timestamp) {
                oldest = item;
            }
        }
        return oldest;
    }
    cleanupExpiredMessages() {
        const now = Date.now();
        const toRemove = [];
        for (const [id, item] of this.queue.entries()) {
            const age = now - item.timestamp.getTime();
            if (age > this.config.ttl) {
                toRemove.push(id);
            }
        }
        for (const id of toRemove) {
            const item = this.queue.get(id);
            this.queue.delete(id);
            const index = this.priorityQueue.findIndex((i) => i.id === id);
            if (index !== -1) {
                this.priorityQueue.splice(index, 1);
            }
            if (item) {
                this.logger.debug(`Message ${id} expired (Age: ${now - item.timestamp.getTime()}ms)`);
                this.emit('message:expired', item);
            }
        }
        if (toRemove.length > 0) {
            this.logger.log(`Cleaned up ${toRemove.length} expired messages`);
        }
    }
    size() {
        return this.queue.size;
    }
    getStats() {
        const now = Date.now();
        let totalAge = 0;
        let oldestAge = 0;
        for (const item of this.queue.values()) {
            const age = now - item.timestamp.getTime();
            totalAge += age;
            if (age > oldestAge) {
                oldestAge = age;
            }
        }
        return {
            size: this.queue.size,
            maxSize: this.config.maxSize,
            utilizationPercent: (this.queue.size / this.config.maxSize) * 100,
            averageAge: this.queue.size > 0 ? totalAge / this.queue.size : 0,
            oldestAge,
        };
    }
    clear() {
        this.queue.clear();
        this.priorityQueue = [];
        this.logger.log('Queue cleared');
    }
    destroy() {
        this.stop();
        this.clear();
    }
};
exports.MessageQueue = MessageQueue;
exports.MessageQueue = MessageQueue = MessageQueue_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Object])
], MessageQueue);
