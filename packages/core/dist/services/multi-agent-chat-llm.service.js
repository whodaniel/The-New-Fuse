var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MultiAgentChatLlmService_1;
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
let MultiAgentChatLlmService = MultiAgentChatLlmService_1 = class MultiAgentChatLlmService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new Logger(MultiAgentChatLlmService_1.name);
    }
};
MultiAgentChatLlmService = MultiAgentChatLlmService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService])
], MultiAgentChatLlmService);
export { MultiAgentChatLlmService };
//# sourceMappingURL=multi-agent-chat-llm.service.js.map