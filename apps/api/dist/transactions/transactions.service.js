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
/**
 * Transactions Service - Migrated to Drizzle ORM
 * Handles blockchain transactions with ERC-4337 Smart Account support
 */
const common_1 = require("@nestjs/common");
const database_1 = require("@the-new-fuse/database");
const viem_1 = require("viem");
const chains_1 = require("viem/chains");
const smart_account_service_1 = require("../smart-accounts/smart-account.service");
const web3auth_service_1 = require("../web3auth/web3auth.service");
let TransactionsService = TransactionsService_1 = class TransactionsService {
    constructor(web3authService, db, smartAccountService) {
        this.web3authService = web3authService;
        this.db = db;
        this.smartAccountService = smartAccountService;
        this.logger = new common_1.Logger(TransactionsService_1.name);
    }
    getSmartAccountCapability(wallet) {
        return wallet.type === 'SMART_ACCOUNT';
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
                data: data,
            });
            // Sign UserOperation with Web3Auth
            const signedUserOp = await this.signUserOperation(agentVerifierId, userOp);
            // Submit to Bundler
            const userOpHash = await this.submitUserOperation(signedUserOp);
            // Store transaction record
            const walletId = await this.getWalletIdByAddress(smartAccountAddress);
            const transactionRecord = await this.db.wallets.createTransaction({
                walletId,
                hash: userOpHash,
                fromAddress: smartAccountAddress,
                toAddress: to,
                value: (0, viem_1.parseEther)(value).toString(),
                status: 'PENDING',
                gasPrice: '0',
                gasUsed: 0,
                gasLimit: 0,
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
        // Get the Smart Account address from database
        const wallet = await this.db.wallets.findFirstSmartAccountByUsername(agentVerifierId);
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
        // Build UserOperation structure with proper typing
        const userOp = {
            sender: smartAccountAddress,
            nonce: nonce.toString(),
            callData: executeCallData,
            callGasLimit: '200000',
            verificationGasLimit: '200000',
            preVerificationGas: '21000',
            maxFeePerGas: '20000000000',
            maxPriorityFeePerGas: '1000000000',
            paymaster: (process.env.TNF_PAYMASTER_ADDRESS || ''),
            paymasterData: '0x',
            signature: '0x',
        };
        return userOp;
    }
    async signUserOperation(agentVerifierId, userOp) {
        // Get Web3Auth provider for signing
        const provider = await this.web3authService.getProvider(agentVerifierId);
        // Create UserOperation hash for signing
        const userOpHash = this.getUserOperationHash(userOp);
        // Sign with Web3Auth
        if (!provider.account?.signMessage) {
            throw new Error('Web3Auth account or signMessage method not available');
        }
        const signature = await provider.account.signMessage({
            message: userOpHash,
        });
        // Return signed UserOperation with signature
        return {
            ...userOp,
            signature: signature,
        };
    }
    async submitUserOperation(userOp) {
        // Submit UserOperation to Bundler service
        const bundlerUrl = process.env.BUNDLER_URL;
        if (!bundlerUrl) {
            throw new Error('BUNDLER_URL environment variable is required');
        }
        const entryPointAddress = process.env.ENTRY_POINT_ADDRESS;
        if (!entryPointAddress) {
            throw new Error('ENTRY_POINT_ADDRESS environment variable is required');
        }
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
                    params: [userOp, entryPointAddress],
                }),
            });
            const result = await response.json();
            if (result.error) {
                throw new Error(`Bundler error: ${result.error.message}`);
            }
            if (!result.result) {
                throw new Error('Bundler returned no result');
            }
            return result.result;
        }
        catch (error) {
            this.logger.error('Failed to submit UserOperation to bundler:', error);
            throw error;
        }
    }
    encodeExecuteCall(target, value, data) {
        try {
            const executeAbi = (0, viem_1.parseAbi)([
                'function execute(address dest, uint256 value, bytes calldata func) external',
            ]);
            return (0, viem_1.encodeFunctionData)({
                abi: executeAbi,
                functionName: 'execute',
                args: [target, value, data],
            });
        }
        catch (error) {
            this.logger.error('Failed to encode execute call:', error);
            throw new Error('Failed to encode transaction data');
        }
    }
    async getNonce(smartAccountAddress) {
        try {
            const entryPointAddress = process.env.ENTRY_POINT_ADDRESS;
            if (!entryPointAddress) {
                throw new Error('EntryPoint address not configured');
            }
            const publicClient = (0, viem_1.createPublicClient)({
                chain: chains_1.mainnet,
                transport: (0, viem_1.http)(),
            });
            const entryPointAbi = (0, viem_1.parseAbi)([
                'function getNonce(address sender, uint192 key) external view returns (uint256 nonce)',
            ]);
            const nonce = await publicClient.readContract({
                address: entryPointAddress,
                abi: entryPointAbi,
                functionName: 'getNonce',
                args: [smartAccountAddress, 0n],
            });
            return Number(nonce);
        }
        catch (error) {
            this.logger.error('Failed to get nonce:', error);
            throw new Error('Failed to get transaction nonce');
        }
    }
    getUserOperationHash(userOp) {
        try {
            const userOpData = JSON.stringify({
                sender: userOp.sender,
                nonce: userOp.nonce,
                initCode: userOp.initCode || '0x',
                callData: userOp.callData,
                callGasLimit: userOp.callGasLimit,
                verificationGasLimit: userOp.verificationGasLimit,
                preVerificationGas: userOp.preVerificationGas,
                maxFeePerGas: userOp.maxFeePerGas,
                maxPriorityFeePerGas: userOp.maxPriorityFeePerGas,
                paymaster: userOp.paymaster || '0x0000000000000000000000000000000000000000',
                paymasterData: userOp.paymasterData || '0x',
                signature: userOp.signature || '0x',
            });
            const { keccak256, toHex } = require('viem');
            return keccak256(toHex(userOpData));
        }
        catch (error) {
            this.logger.error('Failed to calculate UserOperation hash:', error);
            throw new Error('Failed to calculate operation hash');
        }
    }
    async executeTransaction(walletId, transactionData) {
        try {
            this.logger.log(`Executing transaction for wallet ${walletId}`);
            const { to, value, data = '0x', useSmartAccount } = transactionData;
            const wallet = await this.db.wallets.findByIdWithAgent(walletId);
            if (!wallet) {
                throw new Error(`Wallet not found: ${walletId}`);
            }
            const smartAccountCapable = this.getSmartAccountCapability(wallet);
            const shouldUseSmartAccount = useSmartAccount ?? smartAccountCapable;
            const fromAddress = wallet.address;
            let txHash;
            // Compliance check
            const complianceCheck = await this.performComplianceCheck(fromAddress, to);
            if (complianceCheck.isHighRisk) {
                throw new Error(`Transaction blocked: ${complianceCheck.reason}`);
            }
            if (shouldUseSmartAccount && smartAccountCapable) {
                // Execute via Smart Account
                txHash = await this.smartAccountService.executeSmartAccountTransaction(walletId, to, (0, viem_1.parseEther)(value), data);
            }
            else {
                // Execute via EOA
                txHash = await this.executeEOATransaction(wallet.agent?.user?.username || '', to, value, data);
            }
            // Store transaction record
            const transactionRecord = await this.db.wallets.createTransaction({
                walletId,
                hash: txHash,
                fromAddress: fromAddress,
                toAddress: to,
                value: (0, viem_1.parseEther)(value).toString(),
                status: 'PENDING',
                gasPrice: '0',
                gasUsed: 0,
                gasLimit: 0,
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
            const wallet = await this.db.wallets.findByIdWithAgent(walletId);
            if (!wallet) {
                throw new Error(`Wallet not found: ${walletId}`);
            }
            const smartAccountCapable = this.getSmartAccountCapability(wallet);
            const shouldUseSmartAccount = batchData.useSmartAccount ?? smartAccountCapable;
            if (!shouldUseSmartAccount) {
                throw new Error('Batch transactions require Smart Account capability');
            }
            if (!smartAccountCapable) {
                throw new Error(`Smart Account not enabled for wallet ${walletId}`);
            }
            // Compliance checks for all transactions
            for (const tx of batchData.transactions) {
                const complianceCheck = await this.performComplianceCheck(wallet.address, tx.to);
                if (complianceCheck.isHighRisk) {
                    throw new Error(`Batch transaction blocked: ${complianceCheck.reason}`);
                }
            }
            // Prepare transactions for Smart Account batch execution
            const transactions = batchData.transactions.map((tx) => ({
                target: tx.to,
                value: BigInt(tx.value),
                data: tx.data || '0x',
            }));
            // Execute batch transaction via Smart Account
            const txHash = await this.smartAccountService.executeBatchSmartAccountTransaction(walletId, transactions);
            // Store transaction records for each transaction in the batch
            const transactionRecords = await Promise.all(batchData.transactions.map((tx) => this.db.wallets.createTransaction({
                walletId,
                hash: `${txHash}-${Math.random().toString(36).substr(2, 9)}`,
                fromAddress: wallet.address,
                toAddress: tx.to,
                value: (0, viem_1.parseEther)(tx.value).toString(),
                status: 'PENDING',
                gasPrice: '0',
                gasUsed: 0,
                gasLimit: 0,
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
            account: provider.account,
        });
        // Execute transaction
        const transaction = {
            to: to,
            value: (0, viem_1.parseEther)(value),
            data: data,
            kzg: undefined,
            account: provider.account,
            chain: chains_1.mainnet,
        };
        return await walletClient.sendTransaction(transaction);
    }
    async performComplianceCheck(fromAddress, toAddress) {
        try {
            this.logger.log(`Performing compliance check for transaction from ${fromAddress} to ${toAddress}`);
            const publicClient = (0, viem_1.createPublicClient)({
                chain: chains_1.mainnet,
                transport: (0, viem_1.http)(),
            });
            let riskScore = 0;
            const riskFactors = [];
            // Check if addresses are valid
            if (!this.isValidAddress(fromAddress)) {
                riskScore += 50;
                riskFactors.push('Invalid sender address');
            }
            if (!this.isValidAddress(toAddress)) {
                riskScore += 50;
                riskFactors.push('Invalid recipient address');
            }
            // Check if addresses are on blacklist
            const blacklist = process.env.ADDRESS_BLACKLIST?.split(',') || [];
            if (blacklist.some((addr) => addr.toLowerCase() === toAddress.toLowerCase())) {
                riskScore += 80;
                riskFactors.push('Recipient on blacklist');
            }
            // Check transaction patterns
            const recentTransactions = await this.getRecentTransactions(fromAddress);
            if (recentTransactions.length > 50) {
                riskScore += 20;
                riskFactors.push('High transaction frequency');
            }
            // Check for suspicious contract interactions
            const codeAtAddress = await publicClient.getBytecode({
                address: toAddress,
            });
            if (codeAtAddress && codeAtAddress !== '0x') {
                const contractRisk = await this.assessContractRisk(toAddress);
                riskScore += contractRisk;
                if (contractRisk > 30) {
                    riskFactors.push('Suspicious contract interaction');
                }
            }
            const isHighRisk = riskScore > 70;
            return {
                isHighRisk,
                riskScore,
                reason: isHighRisk ? riskFactors.join(', ') : undefined,
            };
        }
        catch (error) {
            this.logger.error('Compliance check failed:', error);
            return {
                isHighRisk: true,
                riskScore: 100,
                reason: 'Compliance service unavailable',
            };
        }
    }
    isValidAddress(address) {
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    }
    async getRecentTransactions(address) {
        try {
            // TODO: Implement actual transaction history lookup
            // This would typically query an indexer or blockchain data provider
            return [];
        }
        catch (error) {
            this.logger.error('Failed to get recent transactions:', error);
            return [];
        }
    }
    async assessContractRisk(address) {
        try {
            return 10;
        }
        catch (error) {
            this.logger.error('Failed to assess contract risk:', error);
            return 30;
        }
    }
    async getWalletIdByAddress(address) {
        const wallet = await this.db.wallets.findByAddress(address);
        if (!wallet) {
            throw new Error(`Wallet not found for address ${address}`);
        }
        return wallet.id;
    }
    async getTransactionsByWalletId(walletId) {
        return this.db.wallets.findTransactionsByWalletId(walletId);
    }
    async updateTransactionStatus(txHash, status) {
        return this.db.wallets.updateTransactionStatus(txHash, status);
    }
};
exports.TransactionsService = TransactionsService;
exports.TransactionsService = TransactionsService = TransactionsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [web3auth_service_1.Web3authService,
        database_1.DatabaseService,
        smart_account_service_1.SmartAccountService])
], TransactionsService);
//# sourceMappingURL=transactions.service.js.map