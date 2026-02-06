"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentDiscoveryModule = void 0;
const common_1 = require("@nestjs/common");
const agent_discovery_service_js_1 = require("../services/agent-discovery.service.js");
const drizzle_module_js_1 = require("../lib/drizzle/drizzle.module.js");
const mcp_module_js_1 = require("../mcp/mcp.module.js");
const event_emitter_1 = require("@nestjs/event-emitter");
let AgentDiscoveryModule = class AgentDiscoveryModule {
};
exports.AgentDiscoveryModule = AgentDiscoveryModule;
exports.AgentDiscoveryModule = AgentDiscoveryModule = __decorate([
    (0, common_1.Module)({
        imports: [
            drizzle_module_js_1.DrizzleModule,
            mcp_module_js_1.MCPModule,
            event_emitter_1.EventEmitterModule.forRoot()
        ],
        providers: [agent_discovery_service_js_1.AgentDiscoveryService],
        exports: [agent_discovery_service_js_1.AgentDiscoveryService]
    })
], AgentDiscoveryModule);
//# sourceMappingURL=agent-discovery.module.js.map