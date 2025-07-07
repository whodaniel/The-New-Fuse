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
var TransactionsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionsService = void 0;
const common_1 = require("@nestjs/common");
const web3auth_service_1 = require("../web3auth/web3auth.service");
const prisma_service_1 = require("../services/prisma.service");
const smart_account_service_1 = require("../smart-accounts/smart-account.service");
const viem_1 = require("viem");
const chains_1 = require("viem/chains");
let TransactionsService = TransactionsService_1 = class TransactionsService {
    web3authService;
    prisma;
    smartAccountService;
    logger = new common_1.Logger(TransactionsService_1.name);
    constructor(web3authService, prisma, smartAccountService) {
        this.web3authService = web3authService;
        this.prisma = prisma;
        this.smartAccountService = smartAccountService;
    }
    async buildAndSignUserOpForAI(agentVerifierId, userOpData) {
        try {
            const { to, value, data = '0x', chainId = 1 } = userOpData;
            this.logger.log(`Building UserOperation for AI agent ${agentVerifierId}`);
            // Get Smart Account address for the AI agent
            const smartAccountAddress = await this.getSmartAccountAddress(agentVerifierId);
            // Compliance check before proceeding
            const complianceCheck = await this.performComplianceCheck(smartAccountAddress, to);
            if (complianceCheck.isHighRisk) {
                this.logger.warn(`High-risk transaction detected: ${complianceCheck.reason}`);
                throw new Error(`Transaction blocked due to compliance check: ${complianceCheck.reason}`);
            }
            // Build UserOperation
            const userOp = await this.buildUserOperation(agentVerifierId, {
                target: to,
                value: (0, viem_1.parseEther)(value),
                data
            });
            // Sign UserOperation with Web3Auth
            const signedUserOp = await this.signUserOperation(agentVerifierId, userOp);
            // Submit to Bundler
            const userOpHash = await this.submitUserOperation(signedUserOp);
            // Store transaction record
            const transactionRecord = await this.prisma.transaction.create({
                data: {
                    walletId: await this.getWalletIdByAddress(smartAccountAddress),
                    tx_hash: userOpHash,
                    from_address: smartAccountAddress,
                    to_address: to,
                    value: (0, viem_1.parseEther)(value).toString(),
                    status: 'PENDING'
                }
            });
            this.logger.log(`UserOperation signed and submitted: ${userOpHash}`);
            return { userOpHash, transactionRecord };
        }
        catch (error) {
            this.logger.error(`Failed to build and sign UserOperation for AI agent ${agentVerifierId}:`, error);
            throw error;
        }
    }
    async getSmartAccountAddress(agentVerifierId) {
        // Get the Smart Account address from database or derive it
        const wallet = await this.prisma.wallet.findFirst({
            where: {
                user: {
                    verifierId: agentVerifierId
                },
                wallet_type: 'SMART_ACCOUNT'
            }
        });
        if (!wallet) {
            throw new Error(`Smart Account not found for agent ${agentVerifierId}`);
        }
        return wallet.address;
    }
    async buildUserOperation(agentVerifierId, callData) {
        // Build ERC-4337 UserOperation
        const smartAccountAddress = await this.getSmartAccountAddress(agentVerifierId);
        // Encode the execute call data for the Smart Account
        const executeCallData = this.encodeExecuteCall(callData.target, callData.value, callData.data);
        // Get nonce from EntryPoint
        const nonce = await this.getNonce(smartAccountAddress);
        // Build UserOperation structure
        const userOp = {
            sender: smartAccountAddress,
            nonce: nonce.toString(),
            callData: executeCallData,
            callGasLimit: '200000', // Estimate gas
            verificationGasLimit: '200000',
            preVerificationGas: '21000',
            maxFeePerGas: '20000000000', // 20 gwei
            maxPriorityFeePerGas: '1000000000', // 1 gwei
            paymaster: process.env.TNF_PAYMASTER_ADDRESS || '',
            paymasterData: '0x',
            signature: '0x' // Will be filled after signing
        };
        return userOp;
    }
    async signUserOperation(agentVerifierId, userOp) {
        // Get Web3Auth provider for signing
        const provider = await this.web3authService.getProvider(agentVerifierId);
        // Create UserOperation hash for signing
        const userOpHash = this.getUserOperationHash(userOp);
        // Sign with Web3Auth
        const signature = await provider.account.signMessage({
            message: userOpHash
        });
        // Add signature to UserOperation
        userOp.signature = signature;
        return userOp;
    }
    async submitUserOperation(userOp) {
        // Submit UserOperation to Bundler service
        const bundlerUrl = process.env.BUNDLER_URL || 'https://api.alchemy.com/v2/your-api-key';
        try {
            const response = await fetch(bundlerUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'eth_sendUserOperation',
                    params: [userOp, process.env.ENTRY_POINT_ADDRESS]
                })
            });
            const result = await response.json();
            if (result.error) {
                throw new Error(`Bundler error: ${result.error.message}`);
            }
            return result.result; // UserOperation hash
        }
        catch (error) {
            this.logger.error('Failed to submit UserOperation to bundler:', error);
            throw error;
        }
    }
    encodeExecuteCall(target, value, data) {
        // Encode the execute function call for the Smart Account
        // This would use ABI encoding for the execute(address,uint256,bytes) function
        return '0x'; // Placeholder - implement proper ABI encoding
    }
    async getNonce(smartAccountAddress) {
        // Get nonce from EntryPoint contract
        // This should call the EntryPoint's getNonce function
        return BigInt(0); // Placeholder
    }
    getUserOperationHash(userOp) {
        // Create hash for UserOperation signing
        // This should follow ERC-4337 specification
        return '0x'; // Placeholder - implement proper hash generation
    }
    async executeTransaction(walletId, transactionData) {
        try {
            const { to, value, data = '0x', useSmartAccount } = transactionData;
            this.logger.log(`Executing transaction for wallet ${walletId}`);
            // Get wallet information
            const wallet = await this.prisma.wallet.findUnique({
                where: { id: walletId },
                include: { user: true }
            });
            if (!wallet) {
                throw new Error(`Wallet not found: ${walletId}`);
            }
            // Determine transaction method
            const shouldUseSmartAccount = useSmartAccount ?? wallet.smartAccountEnabled;
            const fromAddress = shouldUseSmartAccount ? wallet.smartAccountAddress : wallet.address;
            if (!fromAddress) {
                throw new Error(`Transaction address not available for wallet ${walletId}`);
            }
            // Compliance check
            const complianceCheck = await this.performComplianceCheck(fromAddress, to);
            if (complianceCheck.isHighRisk) {
                this.logger.warn(`High-risk transaction detected: ${complianceCheck.reason}`);
                throw new Error(`Transaction blocked due to compliance check: ${complianceCheck.reason}`);
            }
            let txHash;
            if (shouldUseSmartAccount && wallet.smartAccountEnabled) {
                // Execute via Smart Account
                txHash = await this.smartAccountService.executeSmartAccountTransaction(walletId, to, (0, viem_1.parseEther)(value), data);
            }
            else {
                // Execute via EOA
                txHash = await this.executeEOATransaction(wallet.user.verifierId, to, value, data);
            }
            // Store transaction record
            const transactionRecord = await this.prisma.transaction.create({
                data: {
                    walletId,
                    tx_hash: txHash,
                    from_address: fromAddress,
                    to_address: to,
                    value: (0, viem_1.parseEther)(value).toString(),
                    status: 'PENDING'
                }
            });
            this.logger.log(`Transaction executed: ${txHash}`);
            return { txHash, transactionRecord, method: shouldUseSmartAccount ? 'SMART_ACCOUNT' : 'EOA' };
        }
        catch (error) {
            this.logger.error(`Failed to execute transaction for wallet ${walletId}:`, error);
            throw error;
        }
    }
    async executeBatchTransaction(walletId, batchData) {
        try {
            this.logger.log(`Executing batch transaction for wallet ${walletId}`);
            const wallet = await this.prisma.wallet.findUnique({
                where: { id: walletId },
                include: { user: true }
            });
            if (!wallet) {
                throw new Error(`Wallet not found: ${walletId}`);
            }
            const shouldUseSmartAccount = batchData.useSmartAccount ?? wallet.smartAccountEnabled;
            if (!shouldUseSmartAccount) {
                throw new Error('Batch transactions require Smart Account functionality');
            }
            if (!wallet.smartAccountEnabled) {
                throw new Error(`Smart Account not enabled for wallet ${walletId}`);
            }
            // Compliance checks for all transactions
            for (const tx of batchData.transactions) {
                const complianceCheck = await this.performComplianceCheck(wallet.smartAccountAddress, tx.to);
                if (complianceCheck.isHighRisk) {
                    throw new Error(`Batch transaction blocked due to compliance check for ${tx.to}`);
                }
            }
            // Execute batch via Smart Account
            const transactions = batchData.transactions.map(tx => ({
                target: tx.to,
                value: (0, viem_1.parseEther)(tx.value),
                data: tx.data || '0x'
            }));
            const txHash = await this.smartAccountService.executeBatchSmartAccountTransaction(walletId, transactions);
            // Store transaction records for each transaction in the batch
            const transactionRecords = await Promise.all(batchData.transactions.map(tx => this.prisma.transaction.create({
                data: {
                    walletId,
                    tx_hash: `${txHash}-${Math.random().toString(36).substr(2, 9)}`, // Unique ID for batch items
                    from_address: wallet.smartAccountAddress,
                    to_address: tx.to,
                    value: (0, viem_1.parseEther)(tx.value).toString(),
                    status: 'PENDING'
                }
            })));
            this.logger.log(`Batch transaction executed: ${txHash}`);
            return { txHash, transactionRecords, method: 'SMART_ACCOUNT_BATCH' };
        }
        catch (error) {
            this.logger.error(`Failed to execute batch transaction for wallet ${walletId}:`, error);
            throw error;
        }
    }
    async executeEOATransaction(verifierId, to, value, data) {
        // Get Web3Auth provider for EOA transaction
        const provider = await this.web3authService.getProvider(verifierId);
        // Create viem wallet client
        const walletClient = (0, viem_1.createWalletClient)({
            chain: chains_1.mainnet,
            transport: (0, viem_1.http)(),
            account: provider.account
        });
        // Execute transaction
        const transaction = {
            to: to,
            value: (0, viem_1.parseEther)(value),
            data: data
        };
        return await walletClient.sendTransaction(transaction);
    }
    // Legacy methods for backward compatibility
    async buildAndSignTransactionForAI(agentVerifierId, to, value, chainId = 1) {
        // Find wallet by verifierId
        const wallet = await this.prisma.wallet.findFirst({
            where: {
                user: { verifierId: agentVerifierId }
            }
        });
        if (!wallet) {
            throw new Error(`Wallet not found for verifierId: ${agentVerifierId}`);
        }
        return this.executeTransaction(wallet.id, {
            to,
            value,
            useSmartAccount: true // AI agents prefer Smart Accounts
        });
    }
    async buildAndSignUserOpForAI(agentVerifierId, userOpData) {
        // Find wallet by verifierId
        const wallet = await this.prisma.wallet.findFirst({
            where: {
                user: { verifierId: agentVerifierId }
            }
        });
        if (!wallet) {
            throw new Error(`Wallet not found for verifierId: ${agentVerifierId}`);
        }
        return this.executeTransaction(wallet.id, {
            to: userOpData.to,
            value: userOpData.value,
            data: userOpData.data,
            useSmartAccount: true
        });
    }
    async performComplianceCheck(fromAddress, toAddress) {
        try {
            // Placeholder for compliance API integration
            // This would integrate with services like Sumsub, Castellum.AI, etc.
            this.logger.log(`Performing compliance check for transaction from ${fromAddress} to ${toAddress}`);
            // Mock compliance check - replace with actual API call
            const mockRiskScore = Math.random() * 100;
            const isHighRisk = mockRiskScore > 80;
            return {
                isHighRisk,
                riskScore: mockRiskScore,
                reason: isHighRisk ? 'High-risk address detected' : undefined
            };
        }
        catch (error) {
            this.logger.error('Compliance check failed:', error);
            // In case of compliance service failure, err on the side of caution
            return {
                isHighRisk: true,
                riskScore: 100,
                reason: 'Compliance service unavailable'
            };
        }
    }
    async getWalletIdByAddress(address) {
        const wallet = await this.prisma.wallet.findUnique({
            where: { address },
            select: { id: true }
        });
        if (!wallet) {
            throw new Error(`Wallet not found for address ${address}`);
        }
        return wallet.id;
    }
    async getTransactionsByWalletId(walletId) {
        return this.prisma.transaction.findMany({
            where: { walletId },
            orderBy: { created_at: 'desc' }
        });
    }
    async updateTransactionStatus(txHash, status) {
        return this.prisma.transaction.update({
            where: { tx_hash: txHash },
            data: { status }
        });
    }
};
exports.TransactionsService = TransactionsService;
exports.TransactionsService = TransactionsService = TransactionsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [web3auth_service_1.Web3authService,
        prisma_service_1.PrismaService,
        smart_account_service_1.SmartAccountService])
], TransactionsService);
