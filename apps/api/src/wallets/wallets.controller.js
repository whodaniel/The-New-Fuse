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
var _a;
import { Controller, Post, Get, Body, Param, Logger } from '@nestjs/common';
import { WalletsService } from './wallets.service';
let WalletsController = WalletsController_1 = class WalletsController {
    walletsService;
    logger = new Logger(WalletsController_1.name);
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
__decorate([
    Post('create'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WalletsController.prototype, "createWallet", null);
__decorate([
    Get('user/:userId'),
    __param(0, Param('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WalletsController.prototype, "getWalletsByUserId", null);
__decorate([
    Get('address/:address'),
    __param(0, Param('address')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WalletsController.prototype, "getWalletByAddress", null);
__decorate([
    Get('info/:walletId'),
    __param(0, Param('walletId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WalletsController.prototype, "getWalletWithSmartAccountInfo", null);
__decorate([
    Post('enable-smart-account/:walletId'),
    __param(0, Param('walletId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WalletsController.prototype, "enableSmartAccount", null);
__decorate([
    Post('deploy-smart-account/:walletId'),
    __param(0, Param('walletId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WalletsController.prototype, "deploySmartAccount", null);
WalletsController = WalletsController_1 = __decorate([
    Controller('wallets'),
    __metadata("design:paramtypes", [typeof (_a = typeof WalletsService !== "undefined" && WalletsService) === "function" ? _a : Object])
], WalletsController);
export { WalletsController };
//# sourceMappingURL=wallets.controller.js.map