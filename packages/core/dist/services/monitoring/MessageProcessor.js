var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MessageProcessor_1;
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
let MessageProcessor = MessageProcessor_1 = class MessageProcessor {
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
        this.logger = new Logger(MessageProcessor_1.name);
    }
    async processMessage(message) {
        this.logger.log(`Processing message: ${JSON.stringify(message)}`);
        this.eventEmitter.emit('message.processed', message);
        return { message: 'Message processing not implemented' };
    }
    async validateMessage(message) {
        return true;
    }
    async transformMessage(message) {
        return message;
    }
    async routeMessage(message) {
        this.logger.log(`Routing message: ${JSON.stringify(message)}`);
    }
    async getProcessingStats() {
        return {
            processed: 0,
            failed: 0,
            pending: 0,
        };
    }
};
MessageProcessor = MessageProcessor_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [EventEmitter2])
], MessageProcessor);
export { MessageProcessor };
//# sourceMappingURL=MessageProcessor.js.map