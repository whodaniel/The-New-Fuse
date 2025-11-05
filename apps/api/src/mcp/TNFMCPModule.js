var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { TNFMCPService } from './TNFMCPService';
import { TNFMCPController } from './TNFMCPController';
import { AgentService } from '../services/agent.service';
import { ChatService } from '../services/chat.service';
import { WorkflowService } from '../services/workflow.service';
import { ClaudeDevAutomationService } from '../services/ClaudeDevAutomationService';
let TNFMCPModule = class TNFMCPModule {
};
TNFMCPModule = __decorate([
    Module({
        providers: [
            TNFMCPService,
            AgentService,
            ChatService,
            WorkflowService,
            ClaudeDevAutomationService,
        ],
        controllers: [TNFMCPController],
        exports: [TNFMCPService],
    })
], TNFMCPModule);
export { TNFMCPModule };
//# sourceMappingURL=TNFMCPModule.js.map