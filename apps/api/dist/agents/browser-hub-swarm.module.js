"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserHubSwarmModule = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const database_1 = require("@the-new-fuse/database");
const browser_hub_swarm_controller_1 = require("./browser-hub-swarm.controller");
const browser_hub_swarm_service_1 = require("./browser-hub-swarm.service");
let BrowserHubSwarmModule = class BrowserHubSwarmModule {
};
exports.BrowserHubSwarmModule = BrowserHubSwarmModule;
exports.BrowserHubSwarmModule = BrowserHubSwarmModule = __decorate([
    (0, common_1.Module)({
        imports: [
            database_1.DatabaseModule,
            event_emitter_1.EventEmitterModule, // Configured at root app.module level
        ],
        controllers: [browser_hub_swarm_controller_1.BrowserHubSwarmController],
        providers: [browser_hub_swarm_service_1.BrowserHubSwarmService],
        exports: [browser_hub_swarm_service_1.BrowserHubSwarmService],
    })
], BrowserHubSwarmModule);
//# sourceMappingURL=browser-hub-swarm.module.js.map