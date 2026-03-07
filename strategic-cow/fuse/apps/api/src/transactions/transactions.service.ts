/**
 * Transactions Service - Migrated to Drizzle ORM
 * Handles blockchain transactions with ERC-4337 Smart Account support
 */
import { Injectable, Logger } from '@nestjs/common';
import type { Wallet } from '@the-new-fuse/database';
import { DatabaseService } from '@the-new-fuse/database';
import type { Address, Hex } from 'viem';
import {
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  http,
  parseAbi,
  parseEther,
} from 'viem';
import { mainnet } from 'viem/chains';
import { SmartAccountService } from '../smart-accounts/smart-account.service';
import { Web3authService } from '../web3auth/web3auth.service';
import {
  BundlerResponse,
  ComplianceCheckResult as ImportedComplianceCheckResult,
  RecentTransactionSummary,
  SignedUserOperation,
  TransactionCallData,
  UserOperation,
  WalletWithAgent,
} from './user-operation.types';

type ComplianceCheckResult = ImportedComplianceCheckResult;

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    private readonly web3authService: Web3authService,
    private readonly db: DatabaseService,
    private readonly smartAccountService: SmartAccountService
  ) {}

  private getSmartAccountCapability(wallet: Wallet | WalletWithAgent): boolean {
    return wallet.type === 'SMART_ACCOUNT';
  }

  async buildAndSignUserOpForAI(
    agentVerifierId: string,
    userOpData: {
      to: string;
      value: string;
      data?: string;
      chainId?: number;
    }
  ) {
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
        target: to as Address,
        value: parseEther(value),
        data: data as Hex,
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
        value: parseEther(value).toString(),
        status: 'PENDING',
        gasPrice: '0',
        gasUsed: 0,
        gasLimit: 0,
      });

      this.logger.log(`UserOperation signed and submitted: ${userOpHash}`);
      return { userOpHash, transactionRecord };
    } catch (error) {
      this.logger.error(
        `Failed to build and sign UserOperation for AI agent ${agentVerifierId}:`,
        error
      );
      throw error;
    }
  }

  private async getSmartAccountAddress(agentVerifierId: string): Promise<string> {
    // Get the Smart Account address from database
    const wallet = await this.db.wallets.findFirstSmartAccountByUsername(agentVerifierId);

    if (!wallet) {
      throw new Error(`Smart Account not found for agent ${agentVerifierId}`);
    }

    return wallet.address;
  }

  private async buildUserOperation(
    agentVerifierId: string,
    callData: TransactionCallData
  ): Promise<UserOperation> {
    // Build ERC-4337 UserOperation
    const smartAccountAddress = await this.getSmartAccountAddress(agentVerifierId);

    // Encode the execute call data for the Smart Account
    const executeCallData = this.encodeExecuteCall(callData.target, callData.value, callData.data);

    // Get nonce from EntryPoint
    const nonce = await this.getNonce(smartAccountAddress);

    // Build UserOperation structure with proper typing
    const userOp: UserOperation = {
      sender: smartAccountAddress as Address,
      nonce: nonce.toString(),
      callData: executeCallData as Hex,
      callGasLimit: '200000',
      verificationGasLimit: '200000',
      preVerificationGas: '21000',
      maxFeePerGas: '20000000000',
      maxPriorityFeePerGas: '1000000000',
      paymaster: (process.env.TNF_PAYMASTER_ADDRESS || '') as Address,
      paymasterData: '0x' as Hex,
      signature: '0x' as Hex,
    };

    return userOp;
  }

  private async signUserOperation(
    agentVerifierId: string,
    userOp: UserOperation
  ): Promise<SignedUserOperation> {
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
      signature: signature as Hex,
    };
  }

  private async submitUserOperation(userOp: SignedUserOperation): Promise<string> {
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

      const result: BundlerResponse = await response.json();

      if (result.error) {
        throw new Error(`Bundler error: ${result.error.message}`);
      }

      if (!result.result) {
        throw new Error('Bundler returned no result');
      }

      return result.result;
    } catch (error) {
      this.logger.error('Failed to submit UserOperation to bundler:', error);
      throw error;
    }
  }

  private encodeExecuteCall(target: string, value: bigint, data: string): string {
    try {
      const executeAbi = parseAbi([
        'function execute(address dest, uint256 value, bytes calldata func) external',
      ]);

      return encodeFunctionData({
        abi: executeAbi,
        functionName: 'execute',
        args: [target as `0x${string}`, value, data as `0x${string}`],
      });
    } catch (error) {
      this.logger.error('Failed to encode execute call:', error);
      throw new Error('Failed to encode transaction data');
    }
  }

  private async getNonce(smartAccountAddress: string): Promise<number> {
    try {
      const entryPointAddress = process.env.ENTRY_POINT_ADDRESS;
      if (!entryPointAddress) {
        throw new Error('EntryPoint address not configured');
      }

      const publicClient = createPublicClient({
        chain: mainnet,
        transport: http(),
      });

      const entryPointAbi = parseAbi([
        'function getNonce(address sender, uint192 key) external view returns (uint256 nonce)',
      ]);

      const nonce = await publicClient.readContract({
        address: entryPointAddress as `0x${string}`,
        abi: entryPointAbi,
        functionName: 'getNonce',
        args: [smartAccountAddress as `0x${string}`, 0n],
      });

      return Number(nonce);
    } catch (error) {
      this.logger.error('Failed to get nonce:', error);
      throw new Error('Failed to get transaction nonce');
    }
  }

  private getUserOperationHash(userOp: UserOperation): string {
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
    } catch (error) {
      this.logger.error('Failed to calculate UserOperation hash:', error);
      throw new Error('Failed to calculate operation hash');
    }
  }

  async executeTransaction(
    walletId: string,
    transactionData: {
      to: string;
      value: string;
      data?: string;
      useSmartAccount?: boolean;
    }
  ) {
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

      let txHash: string;

      // Compliance check
      const complianceCheck = await this.performComplianceCheck(fromAddress, to);
      if (complianceCheck.isHighRisk) {
        throw new Error(`Transaction blocked: ${complianceCheck.reason}`);
      }

      if (shouldUseSmartAccount && smartAccountCapable) {
        // Execute via Smart Account
        txHash = await this.smartAccountService.executeSmartAccountTransaction(
          walletId,
          to,
          parseEther(value),
          data
        );
      } else {
        // Execute via EOA
        txHash = await this.executeEOATransaction(
          wallet.agent?.user?.username || '',
          to,
          value,
          data
        );
      }

      // Store transaction record
      const transactionRecord = await this.db.wallets.createTransaction({
        walletId,
        hash: txHash,
        fromAddress: fromAddress,
        toAddress: to,
        value: parseEther(value).toString(),
        status: 'PENDING',
        gasPrice: '0',
        gasUsed: 0,
        gasLimit: 0,
      });

      this.logger.log(`Transaction executed: ${txHash}`);
      return { txHash, transactionRecord, method: shouldUseSmartAccount ? 'SMART_ACCOUNT' : 'EOA' };
    } catch (error) {
      this.logger.error(`Failed to execute transaction for wallet ${walletId}:`, error);
      throw error;
    }
  }

  async executeBatchTransaction(
    walletId: string,
    batchData: {
      transactions: Array<{
        to: string;
        value: string;
        data?: string;
      }>;
      useSmartAccount?: boolean;
    }
  ) {
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
      const txHash = await this.smartAccountService.executeBatchSmartAccountTransaction(
        walletId,
        transactions
      );

      // Store transaction records for each transaction in the batch
      const transactionRecords = await Promise.all(
        batchData.transactions.map((tx) =>
          this.db.wallets.createTransaction({
            walletId,
            hash: `${txHash}-${Math.random().toString(36).substr(2, 9)}`,
            fromAddress: wallet.address,
            toAddress: tx.to,
            value: parseEther(tx.value).toString(),
            status: 'PENDING',
            gasPrice: '0',
            gasUsed: 0,
            gasLimit: 0,
          })
        )
      );

      this.logger.log(`Batch transaction executed: ${txHash}`);
      return { txHash, transactionRecords, method: 'SMART_ACCOUNT_BATCH' };
    } catch (error) {
      this.logger.error(`Failed to execute batch transaction for wallet ${walletId}:`, error);
      throw error;
    }
  }

  private async executeEOATransaction(
    verifierId: string,
    to: string,
    value: string,
    data: string
  ): Promise<string> {
    // Get Web3Auth provider for EOA transaction
    const provider = await this.web3authService.getProvider(verifierId);

    // Create viem wallet client
    const walletClient = createWalletClient({
      chain: mainnet,
      transport: http(),
      account: provider.account,
    });

    // Execute transaction
    const transaction = {
      to: to as `0x${string}`,
      value: parseEther(value),
      data: data as `0x${string}`,
      kzg: undefined,
      account: provider.account,
      chain: mainnet,
    };

    return await walletClient.sendTransaction(transaction);
  }

  private async performComplianceCheck(
    fromAddress: string,
    toAddress: string
  ): Promise<ComplianceCheckResult> {
    try {
      this.logger.log(
        `Performing compliance check for transaction from ${fromAddress} to ${toAddress}`
      );

      const publicClient = createPublicClient({
        chain: mainnet,
        transport: http(),
      });

      let riskScore = 0;
      const riskFactors: string[] = [];

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
        address: toAddress as `0x${string}`,
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
    } catch (error) {
      this.logger.error('Compliance check failed:', error);
      return {
        isHighRisk: true,
        riskScore: 100,
        reason: 'Compliance service unavailable',
      };
    }
  }

  private isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  private async getRecentTransactions(address: string): Promise<RecentTransactionSummary[]> {
    try {
      // TODO: Implement actual transaction history lookup
      // This would typically query an indexer or blockchain data provider
      return [];
    } catch (error) {
      this.logger.error('Failed to get recent transactions:', error);
      return [];
    }
  }

  private async assessContractRisk(address: string): Promise<number> {
    try {
      return 10;
    } catch (error) {
      this.logger.error('Failed to assess contract risk:', error);
      return 30;
    }
  }

  private async getWalletIdByAddress(address: string): Promise<string> {
    const wallet = await this.db.wallets.findByAddress(address);

    if (!wallet) {
      throw new Error(`Wallet not found for address ${address}`);
    }

    return wallet.id;
  }

  async getTransactionsByWalletId(walletId: string) {
    return this.db.wallets.findTransactionsByWalletId(walletId);
  }

  async updateTransactionStatus(txHash: string, status: 'SUCCESS' | 'FAILED') {
    return this.db.wallets.updateTransactionStatus(txHash, status);
  }
}
