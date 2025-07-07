"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentNftModule = void 0;
const common_1 = require("@nestjs/common");
const agent_nft_service_1 = require("../../services/agent-nft.service");
const agent_nft_controller_1 = require("../../controllers/agent-nft.controller");
const prisma_service_1 = require("../../prisma/prisma.service");
let AgentNftModule = class AgentNftModule {
};
exports.AgentNftModule = AgentNftModule;
exports.AgentNftModule = AgentNftModule = __decorate([
    (0, common_1.Module)({
        controllers: [agent_nft_controller_1.AgentNftController],
        providers: [agent_nft_service_1.AgentNftService, prisma_service_1.PrismaService],
        exports: [agent_nft_service_1.AgentNftService],
    })
], AgentNftModule);
