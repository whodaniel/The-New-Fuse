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
import { ConfigService } from '@nestjs/config';
let AgentFactory = class AgentFactory {
    constructor(configService) {
        this.configService = configService;
    }
    createAgent(config) {
        return {
            id: this.generateId(),
            ...config,
            createdAt: new Date()
        };
    }
    generateId() {
        return Math.random().toString(36).substring(2, 15);
    }
};
AgentFactory = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService])
], AgentFactory);
export { AgentFactory };
//# sourceMappingURL=AgentFactory.js.map