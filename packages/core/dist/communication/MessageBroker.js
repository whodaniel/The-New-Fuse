var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
let MessageBroker = class MessageBroker {
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
        this.handlers = new Map();
        this.messageQueue = [];
    }
    async publish(topic, payload) {
        const message = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            topic,
            payload,
            timestamp: new Date(),
        };
        this.messageQueue.push(message);
        await this.processMessage(message);
    }
    async subscribe(topic, handler) {
        if (!this.handlers.has(topic)) {
            this.handlers.set(topic, []);
        }
        const handlers = this.handlers.get(topic);
        handlers.push(handler);
    }
    async unsubscribe(topic, handler) {
        const handlers = this.handlers.get(topic);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index !== -1) {
                handlers.splice(index, 1);
            }
        }
    }
    async processMessage(message) {
        const handlers = this.handlers.get(message.topic) || [];
        for (const handler of handlers) {
            try {
                await handler.handle(message);
            }
            catch (error) {
                this.eventEmitter.emit('message.error', { message, error });
            }
        }
    }
    async getMessageHistory(topic) {
        if (topic) {
            return this.messageQueue.filter(msg => msg.topic === topic);
        }
        return [...this.messageQueue];
    }
    async clearMessages() {
        this.messageQueue = [];
    }
};
MessageBroker = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [EventEmitter2])
], MessageBroker);
export { MessageBroker };
//# sourceMappingURL=MessageBroker.js.map