"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const event_emitter_1 = require("@nestjs/event-emitter");
// import { MonitoringModule } from '@the-new-fuse/core/monitoring/monitoring.module';
// import { RedisModule } from '@the-new-fuse/core/redis/redis.module';
const MonitoringService_1 = require("./services/MonitoringService");
const PrometheusService_1 = require("./services/PrometheusService");
const AlertService_1 = require("./services/AlertService");
const InterAgentChatService_1 = require("./services/InterAgentChatService");
// import { AgentMonitoringService } from '@the-new-fuse/core/monitoring/AgentMonitoringService';
// import { RedisService as CoreRedisService } from '@the-new-fuse/core/redis/redis.service.ts';
const redis_service_1 = require("../services/redis.service");
let AgentModule = class AgentModule {
};
exports.AgentModule = AgentModule;
exports.AgentModule = AgentModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot(),
            event_emitter_1.EventEmitterModule.forRoot(),
            // MonitoringModule,
            // RedisModule
        ],
        providers: [
            // {
            //   provide: MonitoringService,
            //   useExisting: AgentMonitoringService
            // },
            // {
            //   provide: RedisService,
            //   useExisting: CoreRedisService
            // },
            MonitoringService_1.MonitoringService,
            PrometheusService_1.PrometheusService,
            AlertService_1.AlertService,
            InterAgentChatService_1.InterAgentChatService,
            redis_service_1.RedisService,
        ],
        exports: [
            MonitoringService_1.MonitoringService,
            AlertService_1.AlertService,
            InterAgentChatService_1.InterAgentChatService,
        ],
    })
], AgentModule);
