import { Injectable, Logger } from '@nestjs/common';
import { Web3authService } from '../web3auth/web3auth.service';
import { PrismaService } from '../services/prisma.service';
import { SmartAccountService } from '../smart-accounts/smart-account.service';
import { createWalletClient, http, parseEther, formatEther } from 'viem';
import { mainnet } from 'viem/chains';

interface ComplianceCheckResult {
  isHighRisk: boolean;
  riskScore: number;
  reason?: string;
}

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    private readonly web3authService: Web3authService,
    private readonly prisma: PrismaService,
    private readonly smartAccountService: SmartAccountService
  ) {}

  private getSmartAccountCapability(wallet: any) {
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
        target: to,
        value: parseEther(value),
        data
      });

      // Sign UserOperation with Web3Auth
      const signedUserOp = await this.signUserOperation(agentVerifierId, userOp);

      // Submit to Bundler
      const userOpHash = await this.submitUserOperation(signedUserOp);

      // Store transaction record
      const transactionRecord = await this.prisma.$transaction(async (prisma) => {
        return await prisma.transaction.create({
          data: {
            walletId: await this.getWalletIdByAddress(smartAccountAddress),
            hash: userOpHash,
            fromAddress: smartAccountAddress,
            toAddress: to,
            value: parseEther(value),
            status: 'PENDING'
          }
        });
      });

      this.logger.log(`UserOperation signed and submitted: ${userOpHash}`);
      return { userOpHash, transactionRecord };

    } catch (error) {
      this.logger.error(`Failed to build and sign UserOperation for AI agent ${agentVerifierId}:`, error);
      throw error;
    }
  }

  private async getSmartAccountAddress(agentVerifierId: string): Promise<string> {
    // Get the Smart Account address from database or derive it
    const wallet = await this.prisma.wallet.findFirst({
      where: {
        agent: {
          user: {
            username: agentVerifierId
          }
        },
        type: 'SMART_ACCOUNT'
      }
    });

    if (!wallet) {
      throw new Error(`Smart Account not found for agent ${agentVerifierId}`);
    }

    return wallet.address;
  }

  private async buildUserOperation(agentVerifierId: string, callData: {
    target: string;
    value: bigint;
    data: string;
  }) {
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

  private async signUserOperation(agentVerifierId: string, userOp: any) {
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

  private async submitUserOperation(userOp: any): Promise<string> {
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
    } catch (error) {
      this.logger.error('Failed to submit UserOperation to bundler:', error);
      throw error;
    }
  }

  private encodeExecuteCall(target: string, value: bigint, data: string): string {
    // Mock implementation - replace with actual ABI encoding
    return '0x' + Math.random().toString(16).substr(2, 64);
  }

  private async getNonce(smartAccountAddress: string): Promise<number> {
    // Mock implementation - replace with actual EntryPoint query
    return Math.floor(Math.random() * 1000);
  }

  private getUserOperationHash(userOp: any): string {
    // Mock implementation - replace with actual UserOperation hash calculation
    return '0x' + Math.random().toString(16).substr(2, 64);
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

      const wallet = await this.prisma.wallet.findUnique({
        where: { id: walletId },
        include: { 
          agent: {
            include: { user: true }
          }
        }
      });

      if (!wallet) {
        throw new Error(`Wallet not found: ${walletId}`);
      }

      const smartAccountCapable = this.getSmartAccountCapability(wallet);
      const shouldUseSmartAccount = useSmartAccount ?? smartAccountCapable;
      const fromAddress = shouldUseSmartAccount ? wallet.address : wallet.address;

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
        txHash = await this.executeEOATransaction(wallet.agent?.user?.username || '', to, value, data);
      }

      // Store transaction record
      const transactionRecord = await this.prisma.$transaction(async (prisma) => {
        return await prisma.transaction.create({
          data: {
            walletId,
            hash: txHash,
            fromAddress: fromAddress,
            toAddress: to,
            value: parseEther(value),
            status: 'PENDING'
          }
        });
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

      const wallet = await this.prisma.wallet.findUnique({
        where: { id: walletId },
        include: { 
          agent: {
            include: { user: true }
          }
        }
      });

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
      const transactions = batchData.transactions.map(tx => ({
        target: tx.to,
        value: parseEther(tx.value),
        data: tx.data || '0x'
      }));

      // Execute batch transaction via Smart Account
      const txHash = await this.smartAccountService.executeBatchSmartAccountTransaction(
        walletId,
        transactions
      );

      // Store transaction records for each transaction in the batch
      const transactionRecords = await this.prisma.$transaction(async (prisma) => {
        return await Promise.all(
          batchData.transactions.map(tx =>
            prisma.transaction.create({
              data: {
                walletId,
                hash: `${txHash}-${Math.random().toString(36).substr(2, 9)}`, // Unique ID for batch items
                fromAddress: wallet.address,
                toAddress: tx.to,
                value: parseEther(tx.value),
                status: 'PENDING'
              }
            })
          )
        );
      });

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
      account: provider.account
    });

    // Execute transaction
    const transaction = {
      to: to as `0x${string}`,
      value: parseEther(value),
      data: data as `0x${string}`
    };

    return await walletClient.sendTransaction(transaction);
  }

  // Legacy methods for backward compatibility
  async buildAndSignTransactionForAI(
    agentVerifierId: string,
    to: string,
    value: string,
    chainId: number = 1
  ) {
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

  private async performComplianceCheck(fromAddress: string, toAddress: string): Promise<ComplianceCheckResult> {
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
    } catch (error) {
      this.logger.error('Compliance check failed:', error);
      // In case of compliance service failure, err on the side of caution
      return {
        isHighRisk: true,
        riskScore: 100,
        reason: 'Compliance service unavailable'
      };
    }
  }

  private async getWalletIdByAddress(address: string): Promise<string> {
    const wallet = await this.prisma.wallet.findUnique({
      where: { address },
      select: { id: true }
    });
    
    if (!wallet) {
      throw new Error(`Wallet not found for address ${address}`);
    }
    
    return wallet.id;
  }

  async getTransactionsByWalletId(walletId: string) {
    return this.prisma.transaction.findMany({
      where: { walletId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateTransactionStatus(txHash: string, status: 'SUCCESS' | 'FAILED') {
    return this.prisma.transaction.update({
      where: { hash: txHash },
      data: { status: status as any }
    });
  }
}