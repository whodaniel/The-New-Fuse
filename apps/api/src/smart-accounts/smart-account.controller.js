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
var SmartAccountController_1;
var _a;
import { Controller, Post, Get, Body, Param, Logger } from '@nestjs/common';
import { SmartAccountService } from './smart-account.service';
let SmartAccountController = SmartAccountController_1 = class SmartAccountController {
    smartAccountService;
    logger = new Logger(SmartAccountController_1.name);
    constructor(smartAccountService) {
        this.smartAccountService = smartAccountService;
    }
    async enableSmartAccount(walletId) {
        try {
            const result = await this.smartAccountService.enableSmartAccountForWallet(walletId);
            return {
                success: true,
                ...result
            };
        }
        catch (error) {
            this.logger.error('Failed to enable Smart Account:', error);
            throw error;
        }
    }
    async deploySmartAccount(walletId) {
        try {
            const result = await this.smartAccountService.deploySmartAccount(walletId);
            return {
                success: true,
                ...result
            };
        }
        catch (error) {
            this.logger.error('Failed to deploy Smart Account:', error);
            throw error;
        }
    }
    async executeTransaction(walletId, transactionData) {
        try {
            const { target, value, data = '0x' } = transactionData;
            const txHash = await this.smartAccountService.executeSmartAccountTransaction(walletId, target, BigInt(value), data);
            return {
                success: true,
                transactionHash: txHash
            };
        }
        catch (error) {
            this.logger.error('Failed to execute Smart Account transaction:', error);
            throw error;
        }
    }
    async executeBatchTransaction(walletId, batchData) {
        try {
            const transactions = batchData.transactions.map(tx => ({
                target: tx.target,
                value: BigInt(tx.value),
                data: tx.data || '0x'
            }));
            const txHash = await this.smartAccountService.executeBatchSmartAccountTransaction(walletId, transactions);
            return {
                success: true,
                transactionHash: txHash
            };
        }
        catch (error) {
            this.logger.error('Failed to execute batch Smart Account transaction:', error);
            throw error;
        }
    }
    async getSmartAccountInfo(walletId) {
        try {
            const info = await this.smartAccountService.getSmartAccountInfo(walletId);
            return {
                success: true,
                ...info
            };
        }
        catch (error) {
            this.logger.error('Failed to get Smart Account info:', error);
            throw error;
        }
    }
};
__decorate([
    Post('enable/:walletId'),
    __param(0, Param('walletId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SmartAccountController.prototype, "enableSmartAccount", null);
__decorate([
    Post('deploy/:walletId'),
    __param(0, Param('walletId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SmartAccountController.prototype, "deploySmartAccount", null);
__decorate([
    Post('execute/:walletId'),
    __param(0, Param('walletId')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SmartAccountController.prototype, "executeTransaction", null);
__decorate([
    Post('execute-batch/:walletId'),
    __param(0, Param('walletId')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SmartAccountController.prototype, "executeBatchTransaction", null);
__decorate([
    Get('info/:walletId'),
    __param(0, Param('walletId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SmartAccountController.prototype, "getSmartAccountInfo", null);
SmartAccountController = SmartAccountController_1 = __decorate([
    Controller('smart-accounts'),
    __metadata("design:paramtypes", [typeof (_a = typeof SmartAccountService !== "undefined" && SmartAccountService) === "function" ? _a : Object])
], SmartAccountController);
export { SmartAccountController };
//# sourceMappingURL=smart-account.controller.js.map