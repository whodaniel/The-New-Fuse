var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a;
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { AgentNftService } from '../services/agent-nft.service';
let AgentNftController = class AgentNftController {
    agentNftService;
    constructor(agentNftService) {
        this.agentNftService = agentNftService;
    }
    async mintAgentNFT(agentId, metadata) {
        return this.agentNftService.mintAgentNFT(agentId, metadata);
    }
    async getAgentNFT(agentId) {
        return this.agentNftService.getAgentNFT(agentId);
    }
    async transferAgentNFT(tokenId, toAddress) {
        return this.agentNftService.transferAgentNFT(tokenId, toAddress);
    }
};
__decorate([
    Post('mint/:agentId'),
    __param(0, Param('agentId')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AgentNftController.prototype, "mintAgentNFT", null);
__decorate([
    Get(':agentId'),
    __param(0, Param('agentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AgentNftController.prototype, "getAgentNFT", null);
__decorate([
    Post('transfer/:tokenId'),
    __param(0, Param('tokenId')),
    __param(1, Body('toAddress')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AgentNftController.prototype, "transferAgentNFT", null);
AgentNftController = __decorate([
    Controller('agent-nft'),
    __metadata("design:paramtypes", [typeof (_a = typeof AgentNftService !== "undefined" && AgentNftService) === "function" ? _a : Object])
], AgentNftController);
export { AgentNftController };
//# sourceMappingURL=agent-nft.controller.js.map