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
var WalletsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletsService = void 0;
const common_1 = require("@nestjs/common");
const web3auth_service_1 = require("../web3auth/web3auth.service");
const prisma_service_1 = require("../services/prisma.service");
const smart_account_service_1 = require("../smart-accounts/smart-account.service");
let WalletsService = WalletsService_1 = class WalletsService {
    web3authService;
    prisma;
    smartAccountService;
    logger = new common_1.Logger(WalletsService_1.name);
    constructor(web3authService, prisma, smartAccountService) {
        this.web3authService = web3authService;
        this.prisma = prisma;
        this.smartAccountService = smartAccountService;
    }
    async createWallet(userId, verifierId, chainId = 1, userType = 'HUMAN', enableSmartAccount = true) {
        try {
            this.logger.log(`Creating wallet for ${userType} user ${userId} with verifierId ${verifierId}`);
            // Always derive EOA address from Web3Auth as primary address
            const eoaAddress = await this.web3authService.deriveAddress(verifierId);
            // Check if wallet already exists
            const existingWallet = await this.prisma.wallet.findUnique({
                where: { address: eoaAddress }
            });
            if (existingWallet) {
                this.logger.log(`Wallet already exists for address ${eoaAddress}`);
                // If Smart Account not enabled and requested, enable it
                if (enableSmartAccount && !existingWallet.smartAccountEnabled) {
                    await this.smartAccountService.enableSmartAccountForWallet(existingWallet.id);
                    return await this.prisma.wallet.findUnique({
                        where: { id: existingWallet.id }
                    });
                }
                return existingWallet;
            }
            // Determine initial wallet type
            const initialWalletType = enableSmartAccount ? 'HYBRID' : 'EOA';
            // Create new wallet record with EOA as primary
            const wallet = await this.prisma.wallet.create({
                data: {
                    userId,
                    address: eoaAddress, // Primary EOA address
                    chain_id: chainId,
                    wallet_type: initialWalletType,
                    smartAccountEnabled: false, // Will be enabled below if requested
                    user: {
                        connectOrCreate: {
                            where: { verifierId },
                            create: {
                                verifierId,
                                userType
                            }
                        }
                    }
                }
            });
            this.logger.log(`EOA wallet created successfully for ${userType} user ${userId} at address ${eoaAddress}`);
            // Enable Smart Account if requested
            if (enableSmartAccount) {
                await this.smartAccountService.enableSmartAccountForWallet(wallet.id);
                this.logger.log(`Smart Account enabled for wallet ${wallet.id}`);
                // Return updated wallet with Smart Account info
                return await this.prisma.wallet.findUnique({
                    where: { id: wallet.id },
                    include: { user: true }
                });
            }
            return wallet;
        }
        catch (error) {
            this.logger.error(`Failed to create wallet for user ${userId}:`, error);
            throw error;
        }
    }
    async enableSmartAccountForWallet(walletId) {
        return await this.smartAccountService.enableSmartAccountForWallet(walletId);
    }
    async deploySmartAccountForWallet(walletId) {
        return await this.smartAccountService.deploySmartAccount(walletId);
    }
    async getWalletWithSmartAccountInfo(walletId) {
        const wallet = await this.prisma.wallet.findUnique({
            where: { id: walletId },
            include: { user: true, transactions: true }
        });
        if (!wallet) {
            throw new Error(`Wallet not found: ${walletId}`);
        }
        return {
            ...wallet,
            smartAccountInfo: wallet.smartAccountEnabled
                ? await this.smartAccountService.getSmartAccountInfo(walletId)
                : null
        };
    }
    async getWalletsByUserId(userId) {
        return this.prisma.wallet.findMany({
            where: { userId }
        });
    }
    async getWalletByAddress(address) {
        return this.prisma.wallet.findUnique({
            where: { address }
        });
    }
};
exports.WalletsService = WalletsService;
exports.WalletsService = WalletsService = WalletsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [web3auth_service_1.Web3authService,
        prisma_service_1.PrismaService,
        smart_account_service_1.SmartAccountService])
], WalletsService);
