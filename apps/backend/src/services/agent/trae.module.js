"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TraeAgentModule = void 0;
const common_1 = require("@nestjs/common");
const trae_agent_1 = require("./trae-agent");
let TraeAgentModule = class TraeAgentModule {
};
exports.TraeAgentModule = TraeAgentModule;
exports.TraeAgentModule = TraeAgentModule = __decorate([
    (0, common_1.Module)({
        providers: [trae_agent_1.TraeAgent],
        exports: [trae_agent_1.TraeAgent]
    })
], TraeAgentModule);
