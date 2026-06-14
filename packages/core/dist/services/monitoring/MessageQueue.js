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
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
let MessageQueue = MessageQueue_1 = class MessageQueue {
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
        this.logger = new Logger(MessageQueue_1.name);
        this.queue = [];
    }
    async enqueue(message) {
        this.queue.push(message);
        this.eventEmitter.emit('message.queued', message);
    }
    async dequeue() {
        const message = this.queue.shift();
        if (message) {
            this.eventEmitter.emit('message.dequeued', message);
        }
        return message;
    }
    async peek() {
        return this.queue[0] || null;
    }
    async size() {
        return this.queue.length;
    }
    async clear() {
        this.queue = [];
        this.eventEmitter.emit('queue.cleared');
    }
    async isEmpty() {
        return this.queue.length === 0;
    }
    async getStats() {
        return {
            size: this.queue.length,
            processed: 0,
            failed: 0,
        };
    }
};
MessageQueue = MessageQueue_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [EventEmitter2])
], MessageQueue);
export { MessageQueue };
//# sourceMappingURL=MessageQueue.js.map