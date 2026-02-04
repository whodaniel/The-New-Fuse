"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitoringModule = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const UnifiedMonitoringService_tsx_1 = require("./UnifiedMonitoringService.tsx");
const ConsolidatedMonitoringService_tsx_1 = require("./ConsolidatedMonitoringService.tsx");
const AgentMonitoringService_tsx_1 = require("./AgentMonitoringService.tsx");
const LangfuseService_tsx_1 = require("./LangfuseService.tsx");
const redis_module_js_1 = require("../redis/redis.module.js");
const config_1 = require("@nestjs/config");
let MonitoringModule = class MonitoringModule {
};
exports.MonitoringModule = MonitoringModule;
exports.MonitoringModule = MonitoringModule = __decorate([
    (0, common_1.Module)({
        imports: [
            event_emitter_1.EventEmitterModule.forRoot(),
            redis_module_js_1.RedisModule,
            config_1.ConfigModule.forRoot()
        ],
        providers: [
            UnifiedMonitoringService_tsx_1.UnifiedMonitoringService,
            ConsolidatedMonitoringService_tsx_1.ConsolidatedMonitoringService,
            AgentMonitoringService_tsx_1.AgentMonitoringService,
            LangfuseService_tsx_1.LangfuseService
        ],
        exports: [
            UnifiedMonitoringService_tsx_1.UnifiedMonitoringService,
            ConsolidatedMonitoringService_tsx_1.ConsolidatedMonitoringService,
            AgentMonitoringService_tsx_1.AgentMonitoringService,
            LangfuseService_tsx_1.LangfuseService
        ]
    })
], MonitoringModule);
//# sourceMappingURL=monitoring.module.js.map