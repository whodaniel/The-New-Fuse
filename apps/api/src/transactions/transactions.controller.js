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
var TransactionsController_1;
var _a;
import { Controller, Post, Get, Body, Param, Logger } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
let TransactionsController = TransactionsController_1 = class TransactionsController {
    transactionsService;
    logger = new Logger(TransactionsController_1.name);
    constructor(transactionsService) {
        this.transactionsService = transactionsService;
    }
    async executeTransaction(walletId, transactionData) {
        try {
            return await this.transactionsService.executeTransaction(walletId, transactionData);
        }
        catch (error) {
            this.logger.error('Failed to execute transaction:', error);
            throw error;
        }
    }
    async executeBatchTransaction(walletId, batchData) {
        try {
            return await this.transactionsService.executeBatchTransaction(walletId, batchData);
        }
        catch (error) {
            this.logger.error('Failed to execute batch transaction:', error);
            throw error;
        }
    }
    async getTransactionsByWalletId(walletId) {
        try {
            return await this.transactionsService.getTransactionsByWalletId(walletId);
        }
        catch (error) {
            this.logger.error('Failed to get transactions:', error);
            throw error;
        }
    }
    async updateTransactionStatus(txHash, statusData) {
        try {
            return await this.transactionsService.updateTransactionStatus(txHash, statusData.status);
        }
        catch (error) {
            this.logger.error('Failed to update transaction status:', error);
            throw error;
        }
    }
    // Legacy AI-specific endpoints for backward compatibility
    // @Post('ai-transaction')
    // async createAITransaction(@Body() transactionData: {
    //   agentVerifierId: string;
    //   to: string;
    //   value: string;
    //   data?: string;
    //   chainId?: number;
    // }) {
    //   try {
    //     // return await this.transactionsService.buildAndSignTransactionForAI( // Commented out due to build errors
    //     //   transactionData.agentVerifierId,
    //     //   transactionData.to,
    //     //   transactionData.value,
    //     //   transactionData.chainId
    //     // );
    //     throw new Error('AI transaction creation is not currently available.');
    //   } catch (error) {
    //     this.logger.error('Failed to create AI transaction:', error);
    //     throw error;
    //   }
    // }
    async createAIUserOperation(userOpData) {
        try {
            return await this.transactionsService.buildAndSignUserOpForAI(userOpData.agentVerifierId, userOpData);
        }
        catch (error) {
            this.logger.error('Failed to create AI UserOperation:', error);
            throw error;
        }
    }
};
__decorate([
    Post('execute/:walletId'),
    __param(0, Param('walletId')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "executeTransaction", null);
__decorate([
    Post('execute-batch/:walletId'),
    __param(0, Param('walletId')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "executeBatchTransaction", null);
__decorate([
    Get('wallet/:walletId'),
    __param(0, Param('walletId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "getTransactionsByWalletId", null);
__decorate([
    Post('update-status/:txHash'),
    __param(0, Param('txHash')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "updateTransactionStatus", null);
__decorate([
    Post('ai-user-operation'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "createAIUserOperation", null);
TransactionsController = TransactionsController_1 = __decorate([
    Controller('transactions'),
    __metadata("design:paramtypes", [typeof (_a = typeof TransactionsService !== "undefined" && TransactionsService) === "function" ? _a : Object])
], TransactionsController);
export { TransactionsController };
//# sourceMappingURL=transactions.controller.js.map