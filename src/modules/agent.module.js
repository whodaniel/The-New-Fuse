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
const agentController_tsx_1 = require("../controllers/agentController.tsx");
const agentService_js_1 = require("../services/agentService.js");
const drizzle_service_tsx_1 = require("../lib/drizzle.service.tsx");
const config_1 = require("@nestjs/config");
let AgentModule = class AgentModule {
};
exports.AgentModule = AgentModule;
exports.AgentModule = AgentModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule],
        controllers: [agentController_tsx_1.AgentController],
        providers: [agentService_js_1.AgentService, drizzle_service_tsx_1.DatabaseService],
        exports: [agentService_js_1.AgentService],
    })
], AgentModule);
//# sourceMappingURL=agent.module.js.map