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
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../services/prisma.service");
const web3auth_service_1 = require("../web3auth/web3auth.service");
const viem_1 = require("viem");
const chains_1 = require("viem/chains");
let SmartAccountService = SmartAccountService_1 = class SmartAccountService {
    prisma;
    web3authService;
    logger = new common_1.Logger(SmartAccountService_1.name);
    factoryAbi = (0, viem_1.parseAbi)([
        'function createAccount(address owner, bytes32 salt) external returns (address)',
        'function getAddress(address owner, bytes32 salt) external view returns (address)',
        'function accountExists(address owner, bytes32 salt) external view returns (bool)'
    ]);
    smartAccountAbi = (0, viem_1.parseAbi)([
        'function execute(address dest, uint256 value, bytes calldata func) external',
        'function executeBatch(address[] calldata dest, uint256[] calldata value, bytes[] calldata func) external',
        'function owner() external view returns (address)',
        'function isValidSignature(bytes32 hash, bytes memory signature) external view returns (bytes4)'
    ]);
    constructor(prisma, web3authService) {
        this.prisma = prisma;
        this.web3authService = web3authService;
    }
    async enableSmartAccountForWallet(walletId) {
        try {
            this.logger.log(`Enabling Smart Account for wallet ${walletId}`);
            const wallet = await this.prisma.wallet.findUnique({
                where: { id: walletId },
                include: { user: true }
            });
            if (!wallet) {
                throw new Error(`Wallet not found: ${walletId}`);
            }
            if (wallet.smartAccountEnabled) {
                this.logger.log(`Smart Account already enabled for wallet ${walletId}`);
                return {
                    smartAccountAddress: wallet.smartAccountAddress,
                    isCounterfactual: !wallet.smartAccountDeployed
                };
            }
            // Generate Smart Account address and salt
            const salt = this.generateSalt(wallet.user.verifierId, wallet.address);
            const smartAccountAddress = await this.getCounterfactualAddress(wallet.address, salt);
            // Update wallet with Smart Account information
            await this.prisma.wallet.update({
                where: { id: walletId },
                data: {
                    smartAccountAddress,
                    smartAccountSalt: salt,
                    smartAccountEnabled: true,
                    smartAccountDeployed: false,
                    wallet_type: wallet.wallet_type === 'EOA' ? 'HYBRID' : wallet.wallet_type
                }
            });
            this.logger.log(`Smart Account enabled for wallet ${walletId} at address ${smartAccountAddress}`);
            return {
                smartAccountAddress,
                isCounterfactual: true
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
            const wallet = await this.prisma.wallet.findUnique({
                where: { id: walletId },
                include: { user: true }
            });
            if (!wallet) {
                throw new Error(`Wallet not found: ${walletId}`);
            }
            if (!wallet.smartAccountEnabled) {
                throw new Error(`Smart Account not enabled for wallet ${walletId}`);
            }
            if (wallet.smartAccountDeployed) {
                this.logger.log(`Smart Account already deployed for wallet ${walletId}`);
                return {
                    smartAccountAddress: wallet.smartAccountAddress,
                    isCounterfactual: false
                };
            }
            // Get Web3Auth provider for the owner
            const provider = await this.web3authService.getProvider(wallet.user.verifierId);
            // Create wallet client for deployment
            const walletClient = (0, viem_1.createWalletClient)({
                account: provider.account,
                chain: chains_1.mainnet,
                transport: (0, viem_1.http)()
            });
            // Get factory contract
            const factoryAddress = process.env.SMART_ACCOUNT_FACTORY_ADDRESS;
            if (!factoryAddress) {
                throw new Error('Smart Account Factory address not configured');
            }
            const factoryContract = (0, viem_1.getContract)({
                address: factoryAddress,
                abi: this.factoryAbi,
                client: walletClient
            });
            // Deploy Smart Account
            const deployTx = await factoryContract.write.createAccount([
                wallet.address,
                wallet.smartAccountSalt
            ]);
            // Update wallet as deployed
            await this.prisma.wallet.update({
                where: { id: walletId },
                data: {
                    smartAccountDeployed: true
                }
            });
            this.logger.log(`Smart Account deployed for wallet ${walletId}, tx: ${deployTx}`);
            return {
                smartAccountAddress: wallet.smartAccountAddress,
                transactionHash: deployTx,
                isCounterfactual: false
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
            const wallet = await this.prisma.wallet.findUnique({
                where: { id: walletId },
                include: { user: true }
            });
            if (!wallet || !wallet.smartAccountEnabled) {
                throw new Error(`Smart Account not enabled for wallet ${walletId}`);
            }
            // Ensure Smart Account is deployed
            if (!wallet.smartAccountDeployed) {
                await this.deploySmartAccount(walletId);
            }
            // Get Web3Auth provider for signing
            const provider = await this.web3authService.getProvider(wallet.user.verifierId);
            // Create wallet client
            const walletClient = (0, viem_1.createWalletClient)({
                account: provider.account,
                chain: chains_1.mainnet,
                transport: (0, viem_1.http)()
            });
            // Get Smart Account contract
            const smartAccountContract = (0, viem_1.getContract)({
                address: wallet.smartAccountAddress,
                abi: this.smartAccountAbi,
                client: walletClient
            });
            // Execute transaction through Smart Account
            const txHash = await smartAccountContract.write.execute([
                target,
                value,
                data
            ]);
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
            const wallet = await this.prisma.wallet.findUnique({
                where: { id: walletId },
                include: { user: true }
            });
            if (!wallet || !wallet.smartAccountEnabled) {
                throw new Error(`Smart Account not enabled for wallet ${walletId}`);
            }
            // Ensure Smart Account is deployed
            if (!wallet.smartAccountDeployed) {
                await this.deploySmartAccount(walletId);
            }
            // Get Web3Auth provider for signing
            const provider = await this.web3authService.getProvider(wallet.user.verifierId);
            // Create wallet client
            const walletClient = (0, viem_1.createWalletClient)({
                account: provider.account,
                chain: chains_1.mainnet,
                transport: (0, viem_1.http)()
            });
            // Get Smart Account contract
            const smartAccountContract = (0, viem_1.getContract)({
                address: wallet.smartAccountAddress,
                abi: this.smartAccountAbi,
                client: walletClient
            });
            // Prepare batch transaction data
            const targets = transactions.map(tx => tx.target);
            const values = transactions.map(tx => tx.value);
            const dataArray = transactions.map(tx => tx.data);
            // Execute batch transaction
            const txHash = await smartAccountContract.write.executeBatch([
                targets,
                values,
                dataArray
            ]);
            this.logger.log(`Batch Smart Account transaction executed: ${txHash}`);
            return txHash;
        }
        catch (error) {
            this.logger.error(`Failed to execute batch Smart Account transaction for wallet ${walletId}:`, error);
            throw error;
        }
    }
    async getSmartAccountInfo(walletId) {
        const wallet = await this.prisma.wallet.findUnique({
            where: { id: walletId },
            include: { user: true }
        });
        if (!wallet) {
            throw new Error(`Wallet not found: ${walletId}`);
        }
        return {
            walletId: wallet.id,
            eoaAddress: wallet.address,
            smartAccountEnabled: wallet.smartAccountEnabled,
            smartAccountAddress: wallet.smartAccountAddress,
            smartAccountDeployed: wallet.smartAccountDeployed,
            userType: wallet.user.userType,
            walletType: wallet.wallet_type
        };
    }
    generateSalt(verifierId, eoaAddress) {
        const crypto = require('crypto');
        const data = `${verifierId}-${eoaAddress}-${Date.now()}`;
        return '0x' + crypto.createHash('sha256').update(data).digest('hex');
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
                transport: (0, viem_1.http)()
            });
            // Get factory contract
            const factoryContract = (0, viem_1.getContract)({
                address: factoryAddress,
                abi: this.factoryAbi,
                client: publicClient
            });
            // Get counterfactual address
            const address = await factoryContract.read.getAddress([
                owner,
                salt
            ]);
            return address;
        }
        catch (error) {
            this.logger.error('Failed to get counterfactual address:', error);
            // Fallback to mock address generation for development
            const crypto = require('crypto');
            const data = owner + salt;
            const hash = crypto.createHash('sha256').update(data).digest('hex');
            return '0x' + hash.substring(0, 40);
        }
    }
    async isSmartAccountDeployed(smartAccountAddress) {
        try {
            const publicClient = (0, viem_1.createPublicClient)({
                chain: chains_1.mainnet,
                transport: (0, viem_1.http)()
            });
            const code = await publicClient.getBytecode({
                address: smartAccountAddress
            });
            return code !== undefined && code !== '0x';
        }
        catch (error) {
            this.logger.error('Failed to check Smart Account deployment:', error);
            return false;
        }
    }
    async enableSmartAccountForAllUsers() {
        this.logger.log('Enabling Smart Accounts for all existing users...');
        const walletsWithoutSmartAccounts = await this.prisma.wallet.findMany({
            where: {
                smartAccountEnabled: false
            },
            include: { user: true }
        });
        for (const wallet of walletsWithoutSmartAccounts) {
            try {
                await this.enableSmartAccountForWallet(wallet.id);
                this.logger.log(`Smart Account enabled for wallet ${wallet.id}`);
            }
            catch (error) {
                this.logger.error(`Failed to enable Smart Account for wallet ${wallet.id}:`, error);
            }
        }
        this.logger.log(`Smart Account enablement complete. Processed ${walletsWithoutSmartAccounts.length} wallets.`);
    }
};
exports.SmartAccountService = SmartAccountService;
exports.SmartAccountService = SmartAccountService = SmartAccountService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        web3auth_service_1.Web3authService])
], SmartAccountService);
