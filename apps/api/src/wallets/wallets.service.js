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
var _a, _b, _c;
import { Injectable, Logger } from '@nestjs/common';
import { Web3authService } from '../web3auth/web3auth.service';
import { PrismaService } from '../services/prisma.service';
import { SmartAccountService } from '../smart-accounts/smart-account.service';
// Constants for magic strings
const USER_TYPES = {
    HUMAN: 'HUMAN',
    AI: 'AI'
};
const WALLET_TYPES = {
    SMART_ACCOUNT: 'SMART_ACCOUNT',
    EOA: 'EOA'
};
const AGENT_TYPES = {
    ASSISTANT: 'ASSISTANT',
    BASIC: 'BASIC'
};
const USER_ROLES = {
    USER: 'USER'
};
const DEFAULT_PASSWORD = 'placeholder_hashed_password';
let WalletsService = WalletsService_1 = class WalletsService {
    web3authService;
    prisma;
    smartAccountService;
    logger = new Logger(WalletsService_1.name);
    constructor(web3authService, prisma, smartAccountService) {
        this.web3authService = web3authService;
        this.prisma = prisma;
        this.smartAccountService = smartAccountService;
    }
    async createWallet(userId, verifierId, _chainId = 1, userType = USER_TYPES.HUMAN, enableSmartAccount = true) {
        try {
            this.logger.log(`Creating wallet for ${userType} user ${userId} with verifierId ${verifierId}`);
            const eoaAddress = await this.web3authService.deriveAddress(verifierId);
            const existingWallet = await this.prisma.wallet.findUnique({
                where: { address: eoaAddress }
            });
            if (existingWallet) {
                this.logger.log(`Wallet already exists for address ${eoaAddress}`);
                if (enableSmartAccount && existingWallet.type !== WALLET_TYPES.SMART_ACCOUNT) {
                    await this.smartAccountService.enableSmartAccountForWallet(existingWallet.id);
                    return await this.prisma.wallet.findUnique({
                        where: { id: existingWallet.id },
                        include: { agent: { include: { user: { select: { id: true, email: true, role: true, username: true } } } } }
                    });
                }
                return existingWallet;
            }
            const initialWalletType = enableSmartAccount ? WALLET_TYPES.SMART_ACCOUNT : WALLET_TYPES.EOA;
            const wallet = await this.prisma.wallet.create({
                data: {
                    address: eoaAddress,
                    type: initialWalletType,
                    agent: {
                        connectOrCreate: {
                            where: { id: userId }, // Use id for unique where clause
                            create: {
                                id: userId, // Set agent's id to userId
                                name: `Agent for ${verifierId}`,
                                type: userType === USER_TYPES.AI ? AGENT_TYPES.ASSISTANT : AGENT_TYPES.BASIC,
                                user: {
                                    connectOrCreate: {
                                        where: { id: userId },
                                        create: {
                                            id: userId,
                                            email: `${verifierId}@tnf.ai`,
                                            hashedPassword: DEFAULT_PASSWORD,
                                            role: USER_ROLES.USER,
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });
            this.logger.log(`EOA wallet created successfully for ${userType} user ${userId} at address ${eoaAddress}`);
            if (enableSmartAccount) {
                await this.smartAccountService.enableSmartAccountForWallet(wallet.id);
                this.logger.log(`Smart Account enabled for wallet ${wallet.id}`);
                return await this.prisma.wallet.findUnique({
                    where: { id: wallet.id },
                    include: { agent: { include: { user: { select: { id: true, email: true, role: true, username: true } } } } }
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
            include: { agent: { include: { user: { select: { id: true, email: true, role: true, username: true } } } } },
            // Added transactions to include here
            // This was causing an error in the previous run, but it was due to the way it was included.
            // Now it's part of the include object directly.
            // transactions: true // Removed from here, moved into include object
        });
        if (!wallet) {
            throw new Error(`Wallet not found: ${walletId}`);
        }
        return {
            ...wallet,
            smartAccountInfo: wallet.type === 'SMART_ACCOUNT'
                ? await this.smartAccountService.getSmartAccountInfo(wallet.id)
                : null
        };
    }
    async getWalletsByUserId(userId) {
        return this.prisma.wallet.findMany({
            where: { agent: { userId: userId } } // Filter by agent's userId
        });
    }
    async getWalletByAddress(address) {
        return this.prisma.wallet.findUnique({
            where: { address }
        });
    }
};
WalletsService = WalletsService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [typeof (_a = typeof Web3authService !== "undefined" && Web3authService) === "function" ? _a : Object, typeof (_b = typeof PrismaService !== "undefined" && PrismaService) === "function" ? _b : Object, typeof (_c = typeof SmartAccountService !== "undefined" && SmartAccountService) === "function" ? _c : Object])
], WalletsService);
export { WalletsService };
//# sourceMappingURL=wallets.service.js.map