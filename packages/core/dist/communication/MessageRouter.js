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
import { MessageBroker } from './MessageBroker.js';
let MessageRouter = class MessageRouter {
    constructor(messageBroker) {
        this.messageBroker = messageBroker;
        this.rules = [];
    }
    addRule(rule) {
        this.rules.push(rule);
    }
    removeRule(topic, target) {
        this.rules = this.rules.filter(rule => rule.topic !== topic || rule.target !== target);
    }
    async routeMessage(message) {
        const applicableRules = this.rules.filter(rule => rule.topic === message.topic && (!rule.condition || rule.condition(message)));
        for (const rule of applicableRules) {
            await this.messageBroker.publish(rule.target, message.payload);
        }
    }
    getRules() {
        return [...this.rules];
    }
};
MessageRouter = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [MessageBroker])
], MessageRouter);
export { MessageRouter };
//# sourceMappingURL=MessageRouter.js.map