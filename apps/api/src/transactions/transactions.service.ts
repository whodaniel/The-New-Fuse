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
      const transactionRecord = await this.prisma.transaction.create({
        data: {
          walletId: await this.getWalletIdByAddress(smartAccountAddress),
          tx_hash: userOpHash,
          from_address: smartAccountAddress,
          to_address: to,
          value: parseEther(value).toString(),
          status: 'PENDING'
        }
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
    // Encode the execute function call for the Smart Account
    // This would use ABI encoding for the execute(address,uint256,bytes) function
    return '0x'; // Placeholder - implement proper ABI encoding
  }

  private async getNonce(smartAccountAddress: string): Promise<bigint> {
    // Get nonce from EntryPoint contract
    // This should call the EntryPoint's getNonce function
    return BigInt(0); // Placeholder
  }

  private getUserOperationHash(userOp: any): string {
    // Create hash for UserOperation signing
    // This should follow ERC-4337 specification
    return '0x'; // Placeholder - implement proper hash generation
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

      let txHash: string;

      if (shouldUseSmartAccount && wallet.smartAccountEnabled) {
        // Execute via Smart Account
        txHash = await this.smartAccountService.executeSmartAccountTransaction(
          walletId,
          to,
          parseEther(value),
          data
        );
      } else {
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
          value: parseEther(value).toString(),
          status: 'PENDING'
        }
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
        const complianceCheck = await this.performComplianceCheck(wallet.smartAccountAddress!, tx.to);
        if (complianceCheck.isHighRisk) {
          throw new Error(`Batch transaction blocked due to compliance check for ${tx.to}`);
        }
      }

      // Execute batch via Smart Account
      const transactions = batchData.transactions.map(tx => ({
        target: tx.to,
        value: parseEther(tx.value),
        data: tx.data || '0x'
      }));

      const txHash = await this.smartAccountService.executeBatchSmartAccountTransaction(
        walletId,
        transactions
      );

      // Store transaction records for each transaction in the batch
      const transactionRecords = await Promise.all(
        batchData.transactions.map(tx =>
          this.prisma.transaction.create({
            data: {
              walletId,
              tx_hash: `${txHash}-${Math.random().toString(36).substr(2, 9)}`, // Unique ID for batch items
              from_address: wallet.smartAccountAddress!,
              to_address: tx.to,
              value: parseEther(tx.value).toString(),
              status: 'PENDING'
            }
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

  async buildAndSignUserOpForAI(
    agentVerifierId: string,
    userOpData: {
      to: string;
      value: string;
      data?: string;
      chainId?: number;
    }
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
      to: userOpData.to,
      value: userOpData.value,
      data: userOpData.data,
      useSmartAccount: true
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
      orderBy: { created_at: 'desc' }
    });
  }

  async updateTransactionStatus(txHash: string, status: 'SUCCESS' | 'FAILED') {
    return this.prisma.transaction.update({
      where: { tx_hash: txHash },
      data: { status }
    });
  }
}