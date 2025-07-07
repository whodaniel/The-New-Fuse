"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentNftController = void 0;
const common_1 = require("@nestjs/common");
const agent_nft_service_1 = require("../services/agent-nft.service");
const swagger_1 = require("@nestjs/swagger");
let AgentNftController = class AgentNftController {
    agentNftService;
    constructor(agentNftService) {
        this.agentNftService = agentNftService;
    }
    async mintAgentAsNft(agentId, body) {
        const mintData = {
            agentId,
            ...body
        };
        return this.agentNftService.mintAgentAsNft(mintData);
    }
    async fractionalizeAgent(agentId, body) {
        // First get the agent NFT ID
        const agentNft = await this.agentNftService.getAgentNft(agentId);
        if (!agentNft) {
            throw new Error('Agent NFT not found');
        }
        const fractionalizeData = {
            agentNftId: agentNft.id,
            ...body
        };
        return this.agentNftService.fractionalizeAgent(fractionalizeData);
    }
    async createRevenueStream(agentId, body) {
        // First get the agent NFT ID
        const agentNft = await this.agentNftService.getAgentNft(agentId);
        if (!agentNft) {
            throw new Error('Agent NFT not found');
        }
        const revenueStreamData = {
            agentNftId: agentNft.id,
            ...body
        };
        return this.agentNftService.createRevenueStream(revenueStreamData);
    }
    async distributeRevenue(streamId, body) {
        const distributeData = {
            revenueStreamId: streamId,
            ...body
        };
        await this.agentNftService.distributeRevenue(distributeData);
        return { message: 'Revenue distributed successfully' };
    }
    async getAgentNft(agentId) {
        const agentNft = await this.agentNftService.getAgentNft(agentId);
        if (!agentNft) {
            return { message: 'Agent NFT not found', nft: null };
        }
        return agentNft;
    }
    async getAgentNftByTokenId(tokenId) {
        const agentNft = await this.agentNftService.getAgentNftByTokenId(parseInt(tokenId));
        if (!agentNft) {
            return { message: 'Agent NFT not found', nft: null };
        }
        return agentNft;
    }
    async getUserFractionalShares(ownerAddress) {
        return this.agentNftService.getUserFractionalShares(ownerAddress);
    }
    async getActiveMarketplaceListings() {
        return this.agentNftService.getActiveMarketplaceListings();
    }
    async updateAgentMetadata(agentId, metadataUri) {
        return this.agentNftService.updateAgentMetadata(agentId, metadataUri);
    }
};
exports.AgentNftController = AgentNftController;
__decorate([
    (0, common_1.Post)(':agentId/nft/mint'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Mint an agent as an NFT' }),
    (0, swagger_1.ApiParam)({ name: 'agentId', description: 'The ID of the agent to mint as NFT' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Agent successfully minted as NFT' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request - Agent already minted or invalid data' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Agent not found' }),
    __param(0, (0, common_1.Param)('agentId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AgentNftController.prototype, "mintAgentAsNft", null);
__decorate([
    (0, common_1.Post)(':agentId/nft/fractionalize'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Fractionalize an agent NFT' }),
    (0, swagger_1.ApiParam)({ name: 'agentId', description: 'The ID of the agent whose NFT to fractionalize' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Agent NFT successfully fractionalized' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request - NFT already fractionalized or invalid data' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Agent NFT not found' }),
    __param(0, (0, common_1.Param)('agentId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AgentNftController.prototype, "fractionalizeAgent", null);
__decorate([
    (0, common_1.Post)(':agentId/nft/revenue-streams'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create a revenue stream for an agent NFT' }),
    (0, swagger_1.ApiParam)({ name: 'agentId', description: 'The ID of the agent' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Revenue stream successfully created' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Agent NFT not found' }),
    __param(0, (0, common_1.Param)('agentId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AgentNftController.prototype, "createRevenueStream", null);
__decorate([
    (0, common_1.Post)('nft/revenue-streams/:streamId/distribute'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Distribute revenue to fractional shareholders' }),
    (0, swagger_1.ApiParam)({ name: 'streamId', description: 'The ID of the revenue stream' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Revenue successfully distributed' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request - Invalid distribution data' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Revenue stream not found' }),
    __param(0, (0, common_1.Param)('streamId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AgentNftController.prototype, "distributeRevenue", null);
__decorate([
    (0, common_1.Get)(':agentId/nft'),
    (0, swagger_1.ApiOperation)({ summary: 'Get agent NFT details' }),
    (0, swagger_1.ApiParam)({ name: 'agentId', description: 'The ID of the agent' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Agent NFT details retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Agent NFT not found' }),
    __param(0, (0, common_1.Param)('agentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AgentNftController.prototype, "getAgentNft", null);
__decorate([
    (0, common_1.Get)('nft/token/:tokenId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get agent NFT details by token ID' }),
    (0, swagger_1.ApiParam)({ name: 'tokenId', description: 'The token ID of the NFT' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Agent NFT details retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Agent NFT not found' }),
    __param(0, (0, common_1.Param)('tokenId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AgentNftController.prototype, "getAgentNftByTokenId", null);
__decorate([
    (0, common_1.Get)('nft/shares'),
    (0, swagger_1.ApiOperation)({ summary: 'Get fractional shares owned by a user' }),
    (0, swagger_1.ApiQuery)({ name: 'ownerAddress', description: 'The wallet address of the owner' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Fractional shares retrieved successfully' }),
    __param(0, (0, common_1.Query)('ownerAddress')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AgentNftController.prototype, "getUserFractionalShares", null);
__decorate([
    (0, common_1.Get)('nft/marketplace'),
    (0, swagger_1.ApiOperation)({ summary: 'Get active marketplace listings' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Active marketplace listings retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AgentNftController.prototype, "getActiveMarketplaceListings", null);
__decorate([
    (0, common_1.Post)(':agentId/nft/metadata'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Update agent NFT metadata' }),
    (0, swagger_1.ApiParam)({ name: 'agentId', description: 'The ID of the agent' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Metadata updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Failed to update metadata' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Agent NFT not found' }),
    __param(0, (0, common_1.Param)('agentId')),
    __param(1, (0, common_1.Body)('metadataUri')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AgentNftController.prototype, "updateAgentMetadata", null);
exports.AgentNftController = AgentNftController = __decorate([
    (0, swagger_1.ApiTags)('agent-nft'),
    (0, common_1.Controller)('agents'),
    __metadata("design:paramtypes", [agent_nft_service_1.AgentNftService])
], AgentNftController);
