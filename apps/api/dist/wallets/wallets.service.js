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
/**
 * Wallets Service - Migrated to Drizzle ORM
 * Manages wallet creation and smart account enablement
 */
const common_1 = require("@nestjs/common");
const database_1 = require("@the-new-fuse/database");
const smart_account_service_1 = require("../smart-accounts/smart-account.service");
const web3auth_service_1 = require("../web3auth/web3auth.service");
let WalletsService = WalletsService_1 = class WalletsService {
    constructor(web3authService, db, smartAccountService) {
        this.web3authService = web3authService;
        this.db = db;
        this.smartAccountService = smartAccountService;
        this.logger = new common_1.Logger(WalletsService_1.name);
    }
    async createWallet(userId, verifierId, _chainId = 1, userType = 'HUMAN', enableSmartAccount = true) {
        try {
            this.logger.log(`Creating wallet for ${userType} user ${userId} with verifierId ${verifierId}`);
            const eoaAddress = await this.web3authService.deriveAddress(verifierId);
            const existingWallet = await this.db.wallets.findByAddress(eoaAddress);
            if (existingWallet) {
                this.logger.log(`Wallet already exists for address ${eoaAddress}`);
                if (enableSmartAccount && existingWallet.type !== 'SMART_ACCOUNT') {
                    await this.smartAccountService.enableSmartAccountForWallet(existingWallet.id);
                    return await this.db.wallets.findById(existingWallet.id);
                }
                return existingWallet;
            }
            // First ensure the user exists
            let user = await this.db.users.findById(userId);
            if (!user) {
                // Users should be created through proper auth flow, not here
                // This is a fallback that requires immediate password setup
                this.logger.warn(`User ${userId} not found during wallet creation. Creating user with temp credentials.`);
                const tempPassword = crypto.randomUUID(); // Generate secure temp password
                const bcrypt = require('bcrypt');
                const hashedPassword = await bcrypt.hash(tempPassword, 10);
                user = await this.db.users.create({
                    id: userId,
                    email: `${verifierId}@tnf.ai`,
                    hashedPassword,
                    role: 'USER',
                });
                this.logger.warn(`User ${userId} created with temporary password. User must set password via auth flow.`);
            }
            // Create or find agent for the user
            let agent = await this.db.agents.findByUserId(userId);
            let agentId;
            if (agent.length === 0) {
                const newAgent = await this.db.agents.create({
                    name: `Agent for ${verifierId}`,
                    type: userType === 'AI' ? 'ASSISTANT' : 'BASIC',
                    userId: userId,
                });
                agentId = newAgent.id;
            }
            else {
                agentId = agent[0].id;
            }
            const initialWalletType = enableSmartAccount ? 'SMART_ACCOUNT' : 'EOA';
            const wallet = await this.db.wallets.create({
                address: eoaAddress,
                type: initialWalletType,
                agentId: agentId,
            });
            this.logger.log(`EOA wallet created successfully for ${userType} user ${userId} at address ${eoaAddress}`);
            if (enableSmartAccount) {
                await this.smartAccountService.enableSmartAccountForWallet(wallet.id);
                this.logger.log(`Smart Account enabled for wallet ${wallet.id}`);
                return await this.db.wallets.findByIdWithAgent(wallet.id);
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
        const wallet = await this.db.wallets.findByIdWithAgent(walletId);
        if (!wallet) {
            throw new Error(`Wallet not found: ${walletId}`);
        }
        return {
            ...wallet,
            smartAccountInfo: wallet.type === 'SMART_ACCOUNT'
                ? await this.smartAccountService.getSmartAccountInfo(wallet.id)
                : null,
        };
    }
    async getWalletsByUserId(userId) {
        return this.db.wallets.findByUserId(userId);
    }
    async getWalletByAddress(address) {
        return this.db.wallets.findByAddress(address);
    }
};
exports.WalletsService = WalletsService;
exports.WalletsService = WalletsService = WalletsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [web3auth_service_1.Web3authService,
        database_1.DatabaseService,
        smart_account_service_1.SmartAccountService])
], WalletsService);
//# sourceMappingURL=wallets.service.js.map