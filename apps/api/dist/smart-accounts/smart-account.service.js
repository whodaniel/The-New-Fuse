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
var SmartAccountService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmartAccountService = void 0;
/**
 * Smart Account Service - Migrated to Drizzle ORM
 * Manages ERC-4337 Smart Account creation and transactions
 */
const common_1 = require("@nestjs/common");
const database_1 = require("@the-new-fuse/database");
const node_crypto_1 = require("node:crypto");
const viem_1 = require("viem");
const chains_1 = require("viem/chains");
const web3auth_service_1 = require("../web3auth/web3auth.service");
let SmartAccountService = SmartAccountService_1 = class SmartAccountService {
    constructor(db, web3authService) {
        this.db = db;
        this.web3authService = web3authService;
        this.logger = new common_1.Logger(SmartAccountService_1.name);
        this.factoryAbi = (0, viem_1.parseAbi)([
            'function createAccount(address owner, bytes32 salt) external returns (address)',
            'function getAddress(address owner, bytes32 salt) external view returns (address)',
            'function accountExists(address owner, bytes32 salt) external view returns (bool)',
        ]);
        this.smartAccountAbi = (0, viem_1.parseAbi)([
            'function execute(address dest, uint256 value, bytes calldata func) external',
            'function executeBatch(address[] calldata dest, uint256[] calldata value, bytes[] calldata func) external',
            'function owner() external view returns (address)',
            'function isValidSignature(bytes32 hash, bytes memory signature) external view returns (bytes4)',
        ]);
    }
    getSmartAccountMetadata(wallet) {
        // Use wallet type to determine if smart account is enabled
        const isSmartAccount = wallet.type === 'SMART_ACCOUNT';
        return {
            enabled: isSmartAccount,
            deployed: isSmartAccount && wallet.isActive,
            address: isSmartAccount ? wallet.address : undefined,
            salt: undefined,
        };
    }
    async enableSmartAccountForWallet(walletId) {
        try {
            this.logger.log(`Enabling Smart Account for wallet ${walletId}`);
            const wallet = await this.db.wallets.findByIdWithAgent(walletId);
            if (!wallet) {
                throw new Error(`Wallet not found: ${walletId}`);
            }
            const metadata = this.getSmartAccountMetadata(wallet);
            if (metadata.enabled) {
                this.logger.log(`Smart Account already enabled for wallet ${walletId}`);
                return {
                    smartAccountAddress: metadata.address || wallet.address,
                    isCounterfactual: !metadata.deployed,
                };
            }
            // Generate Smart Account address and salt
            const salt = this.generateSalt(wallet.agent?.user?.id || '', wallet.address);
            const smartAccountAddress = await this.getCounterfactualAddress(wallet.address, salt);
            // Update wallet type to indicate smart account capability
            await this.db.wallets.updateType(walletId, 'SMART_ACCOUNT');
            this.logger.log(`Smart Account enabled for wallet ${walletId} at address ${smartAccountAddress}`);
            return {
                smartAccountAddress,
                isCounterfactual: true,
            };
        }
        catch (error) {
            this.logger.error(`Failed to enable Smart Account for wallet ${walletId}:`, error);
            throw error;
        }
    }
    async deploySmartAccount(walletId) {
        try {
            this.logger.log(`Deploying Smart Account for wallet ${walletId}`);
            const wallet = await this.db.wallets.findByIdWithAgent(walletId);
            if (!wallet) {
                throw new Error(`Wallet not found: ${walletId}`);
            }
            const metadata = this.getSmartAccountMetadata(wallet);
            if (!metadata.enabled) {
                throw new Error(`Smart Account not enabled for wallet ${walletId}`);
            }
            if (metadata.deployed) {
                this.logger.log(`Smart Account already deployed for wallet ${walletId}`);
                return {
                    smartAccountAddress: metadata.address || wallet.address,
                    isCounterfactual: false,
                };
            }
            // Get Web3Auth provider for the agent
            const provider = await this.web3authService.getProvider(wallet.agent?.user?.username || '');
            // Deploy Smart Account via factory contract
            const salt = this.generateSalt(wallet.agent?.user?.id || '', wallet.address);
            const smartAccountAddress = await this.getCounterfactualAddress(wallet.address, salt);
            const factoryAddress = process.env.SMART_ACCOUNT_FACTORY_ADDRESS;
            if (!factoryAddress) {
                throw new Error('Smart Account Factory address not configured');
            }
            // Create transaction for deployment
            const deployTx = await provider.walletClient.writeContract({
                address: factoryAddress,
                abi: this.factoryAbi,
                functionName: 'createAccount',
                args: [wallet.address, salt],
            });
            // Wait for transaction confirmation
            const receipt = await provider.walletClient.waitForTransactionReceipt({
                hash: deployTx,
            });
            if (receipt.status === 'reverted') {
                throw new Error('Smart Account deployment transaction failed');
            }
            // Update wallet to mark as deployed/active
            await this.db.wallets.activate(walletId);
            this.logger.log(`Smart Account deployed successfully: ${deployTx}`);
            return {
                smartAccountAddress,
                transactionHash: deployTx,
                isCounterfactual: false,
            };
        }
        catch (error) {
            this.logger.error(`Failed to deploy Smart Account for wallet ${walletId}:`, error);
            throw error;
        }
    }
    async executeSmartAccountTransaction(walletId, target, value, data) {
        try {
            this.logger.log(`Executing Smart Account transaction for wallet ${walletId}`);
            const wallet = await this.db.wallets.findByIdWithAgent(walletId);
            if (!wallet) {
                throw new Error(`Wallet not found: ${walletId}`);
            }
            const metadata = this.getSmartAccountMetadata(wallet);
            if (!metadata.enabled) {
                throw new Error(`Smart Account not enabled for wallet ${walletId}`);
            }
            // Get Web3Auth provider for signing
            const provider = await this.web3authService.getProvider(wallet.agent?.user?.username || '');
            // Execute transaction through Smart Account
            const txHash = await provider.walletClient.writeContract({
                address: metadata.address,
                abi: this.smartAccountAbi,
                functionName: 'execute',
                args: [target, value, data],
            });
            this.logger.log(`Smart Account transaction executed: ${txHash}`);
            return txHash;
        }
        catch (error) {
            this.logger.error(`Failed to execute Smart Account transaction for wallet ${walletId}:`, error);
            throw error;
        }
    }
    async executeBatchSmartAccountTransaction(walletId, transactions) {
        try {
            this.logger.log(`Executing batch Smart Account transaction for wallet ${walletId}`);
            const wallet = await this.db.wallets.findByIdWithAgent(walletId);
            if (!wallet) {
                throw new Error(`Wallet not found: ${walletId}`);
            }
            const metadata = this.getSmartAccountMetadata(wallet);
            if (!metadata.enabled) {
                throw new Error(`Smart Account not enabled for wallet ${walletId}`);
            }
            // Get Web3Auth provider for signing
            const provider = await this.web3authService.getProvider(wallet.agent?.user?.username || '');
            // Prepare batch transaction data
            const targets = transactions.map((tx) => tx.target);
            const values = transactions.map((tx) => tx.value);
            const dataArray = transactions.map((tx) => tx.data);
            // Execute batch transaction through Smart Account
            const txHash = await provider.walletClient.writeContract({
                address: metadata.address,
                abi: this.smartAccountAbi,
                functionName: 'executeBatch',
                args: [targets, values, dataArray],
            });
            this.logger.log(`Batch Smart Account transaction executed: ${txHash}`);
            return txHash;
        }
        catch (error) {
            this.logger.error(`Failed to execute batch Smart Account transaction for wallet ${walletId}:`, error);
            throw error;
        }
    }
    async getSmartAccountInfo(walletId) {
        const wallet = await this.db.wallets.findByIdWithAgent(walletId);
        if (!wallet) {
            throw new Error(`Wallet not found: ${walletId}`);
        }
        const metadata = this.getSmartAccountMetadata(wallet);
        return {
            walletId: wallet.id,
            eoaAddress: wallet.address,
            smartAccountEnabled: metadata.enabled,
            smartAccountAddress: metadata.address,
            smartAccountDeployed: metadata.deployed,
            userType: wallet.agent?.user?.role || 'USER',
            walletType: wallet.type,
        };
    }
    generateSalt(userId, eoaAddress) {
        const data = `${userId}-${eoaAddress}`.toLowerCase();
        return `0x${(0, node_crypto_1.createHash)('sha256').update(data).digest('hex')}`;
    }
    async getCounterfactualAddress(owner, salt) {
        try {
            const factoryAddress = process.env.SMART_ACCOUNT_FACTORY_ADDRESS;
            if (!factoryAddress) {
                throw new Error('Smart Account Factory address not configured');
            }
            // Create public client for reading
            const publicClient = (0, viem_1.createPublicClient)({
                chain: chains_1.mainnet,
                transport: (0, viem_1.http)(),
            });
            // Get counterfactual address
            const address = await publicClient.readContract({
                address: factoryAddress,
                abi: this.factoryAbi,
                functionName: 'getAddress',
                args: [owner, salt],
            });
            return address;
        }
        catch (error) {
            this.logger.error('Failed to get counterfactual address:', error);
            throw new Error('Unable to resolve smart account counterfactual address from factory');
        }
    }
    async isSmartAccountDeployed(smartAccountAddress) {
        try {
            const publicClient = (0, viem_1.createPublicClient)({
                chain: chains_1.mainnet,
                transport: (0, viem_1.http)(),
            });
            const code = await publicClient.getBytecode({
                address: smartAccountAddress,
            });
            return code !== undefined && code !== '0x';
        }
        catch (error) {
            this.logger.error('Failed to check Smart Account deployment:', error);
            return false;
        }
    }
    async getWalletsWithoutSmartAccounts() {
        const walletsWithoutSmartAccounts = await this.db.wallets.findByType('EOA');
        return walletsWithoutSmartAccounts.map((wallet) => ({
            id: wallet.id,
            address: wallet.address,
            type: wallet.type,
        }));
    }
};
exports.SmartAccountService = SmartAccountService;
exports.SmartAccountService = SmartAccountService = SmartAccountService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_1.DatabaseService,
        web3auth_service_1.Web3authService])
], SmartAccountService);
//# sourceMappingURL=smart-account.service.js.map