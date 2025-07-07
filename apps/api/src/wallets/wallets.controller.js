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
var WalletsController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletsController = void 0;
const common_1 = require("@nestjs/common");
const wallets_service_1 = require("./wallets.service");
let WalletsController = WalletsController_1 = class WalletsController {
    walletsService;
    logger = new common_1.Logger(WalletsController_1.name);
    constructor(walletsService) {
        this.walletsService = walletsService;
    }
    async createWallet(createWalletDto) {
        try {
            const { userId, verifierId, chainId, userType = 'HUMAN', enableSmartAccount = true } = createWalletDto;
            return await this.walletsService.createWallet(userId, verifierId, chainId, userType, enableSmartAccount);
        }
        catch (error) {
            this.logger.error('Failed to create wallet:', error);
            throw error;
        }
    }
    async getWalletsByUserId(userId) {
        return await this.walletsService.getWalletsByUserId(userId);
    }
    async getWalletByAddress(address) {
        return await this.walletsService.getWalletByAddress(address);
    }
    async getWalletWithSmartAccountInfo(walletId) {
        try {
            return await this.walletsService.getWalletWithSmartAccountInfo(walletId);
        }
        catch (error) {
            this.logger.error('Failed to get wallet info:', error);
            throw error;
        }
    }
    async enableSmartAccount(walletId) {
        try {
            return await this.walletsService.enableSmartAccountForWallet(walletId);
        }
        catch (error) {
            this.logger.error('Failed to enable Smart Account:', error);
            throw error;
        }
    }
    async deploySmartAccount(walletId) {
        try {
            return await this.walletsService.deploySmartAccountForWallet(walletId);
        }
        catch (error) {
            this.logger.error('Failed to deploy Smart Account:', error);
            throw error;
        }
    }
};
exports.WalletsController = WalletsController;
__decorate([
    (0, common_1.Post)('create'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WalletsController.prototype, "createWallet", null);
__decorate([
    (0, common_1.Get)('user/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WalletsController.prototype, "getWalletsByUserId", null);
__decorate([
    (0, common_1.Get)('address/:address'),
    __param(0, (0, common_1.Param)('address')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WalletsController.prototype, "getWalletByAddress", null);
__decorate([
    (0, common_1.Get)('info/:walletId'),
    __param(0, (0, common_1.Param)('walletId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WalletsController.prototype, "getWalletWithSmartAccountInfo", null);
__decorate([
    (0, common_1.Post)('enable-smart-account/:walletId'),
    __param(0, (0, common_1.Param)('walletId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WalletsController.prototype, "enableSmartAccount", null);
__decorate([
    (0, common_1.Post)('deploy-smart-account/:walletId'),
    __param(0, (0, common_1.Param)('walletId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WalletsController.prototype, "deploySmartAccount", null);
exports.WalletsController = WalletsController = WalletsController_1 = __decorate([
    (0, common_1.Controller)('wallets'),
    __metadata("design:paramtypes", [wallets_service_1.WalletsService])
], WalletsController);
