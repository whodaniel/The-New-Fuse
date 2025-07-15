var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { UnifiedMonitoringService } from './UnifiedMonitoringService.tsx';
import { ConsolidatedMonitoringService } from './ConsolidatedMonitoringService.tsx';
import { AgentMonitoringService } from './AgentMonitoringService.tsx';
import { LangfuseService } from './LangfuseService.tsx';
import { RedisModule } from '../redis/redis.module.js';
import { ConfigModule } from '@nestjs/config';
let MonitoringModule = class MonitoringModule {
};
MonitoringModule = __decorate([
    Module({
        imports: [
            EventEmitterModule.forRoot(),
            RedisModule,
            ConfigModule.forRoot()
        ],
        providers: [
            UnifiedMonitoringService,
            ConsolidatedMonitoringService,
            AgentMonitoringService,
            LangfuseService
        ],
        exports: [
            UnifiedMonitoringService,
            ConsolidatedMonitoringService,
            AgentMonitoringService,
            LangfuseService
        ]
    })
], MonitoringModule);
export { MonitoringModule };
