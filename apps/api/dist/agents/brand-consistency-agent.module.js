"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrandConsistencyAgentModule = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const database_1 = require("@the-new-fuse/database");
const brand_consistency_agent_service_1 = require("./brand-consistency-agent.service");
const brand_consistency_controller_1 = require("./brand-consistency.controller");
let BrandConsistencyAgentModule = class BrandConsistencyAgentModule {
};
exports.BrandConsistencyAgentModule = BrandConsistencyAgentModule;
exports.BrandConsistencyAgentModule = BrandConsistencyAgentModule = __decorate([
    (0, common_1.Module)({
        imports: [
            database_1.DatabaseModule,
            event_emitter_1.EventEmitterModule, // Configured at root app.module level
        ],
        controllers: [brand_consistency_controller_1.BrandConsistencyController],
        providers: [brand_consistency_agent_service_1.BrandConsistencyAgentService],
        exports: [brand_consistency_agent_service_1.BrandConsistencyAgentService],
    })
], BrandConsistencyAgentModule);
//# sourceMappingURL=brand-consistency-agent.module.js.map