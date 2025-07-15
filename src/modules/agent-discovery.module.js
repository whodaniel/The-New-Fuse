var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { AgentDiscoveryService } from '../services/agent-discovery.service.js';
import { PrismaModule } from '../lib/prisma/prisma.module.js';
import { MCPModule } from '../mcp/mcp.module.js';
import { EventEmitterModule } from '@nestjs/event-emitter';
let AgentDiscoveryModule = class AgentDiscoveryModule {
};
AgentDiscoveryModule = __decorate([
    Module({
        imports: [
            PrismaModule,
            MCPModule,
            EventEmitterModule.forRoot()
        ],
        providers: [AgentDiscoveryService],
        exports: [AgentDiscoveryService]
    })
], AgentDiscoveryModule);
export { AgentDiscoveryModule };
