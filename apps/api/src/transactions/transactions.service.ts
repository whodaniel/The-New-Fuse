import { Injectable, Logger } from '@nestjs/common';
import { Web3authService } from '../web3auth/web3auth.service';
import { PrismaService } from '@the-new-fuse/database';
import { SmartAccountService } from '../smart-accounts/smart-account.service';
import { createWalletClient, createPublicClient, http, parseEther, formatEther, parseAbi, encodeFunctionData, getAddress } from 'viem';
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
            wallet: { connect: { id: await this.getWalletIdByAddress(smartAccountAddress) } },
            hash: userOpHash,
            fromAddress: smartAccountAddress,
            toAddress: to,
            value: parseEther(value).toString(),
            status: 'PENDING',
            gasPrice: '0', // Dummy value
            gasUsed: 0, // Dummy value
            gasLimit: 0, // Dummy value
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
    // Encode the execute call data for Smart Account contract
    try {
      const executeAbi = parseAbi([
        'function execute(address dest, uint256 value, bytes calldata func) external'
      ]);

      return encodeFunctionData({
        abi: executeAbi,
        functionName: 'execute',
        args: [target as `0x${string}`, value, data as `0x${string}`]
      });
    } catch (error) {
      this.logger.error('Failed to encode execute call:', error);
      throw new Error('Failed to encode transaction data');
    }
  }

  private async getNonce(smartAccountAddress: string): Promise<number> {
    try {
      // Get nonce from EntryPoint contract for ERC-4337
      const entryPointAddress = process.env.ENTRY_POINT_ADDRESS;
      if (!entryPointAddress) {
        throw new Error('EntryPoint address not configured');
      }

      // Create public client for reading
      const publicClient = createPublicClient({
        chain: mainnet,
        transport: http()
      });

      const entryPointAbi = parseAbi([
        'function getNonce(address sender, uint192 key) external view returns (uint256 nonce)'
      ]);

      const nonce = await publicClient.readContract({
        address: entryPointAddress as `0x${string}`,
        abi: entryPointAbi,
        functionName: 'getNonce',
        args: [
          smartAccountAddress as `0x${string}`,
          '0x0000000000000000000000000000000000000000000000000000000000000000' // key
        ]
      });

      return Number(nonce);
    } catch (error) {
      this.logger.error('Failed to get nonce:', error);
      throw new Error('Failed to get transaction nonce');
    }
  }

  private getUserOperationHash(userOp: any): string {
    try {
      // Calculate UserOperation hash for ERC-4337
      // This would typically involve keccak hashing the UserOperation struct
      // For now, return a proper hash structure

      const userOpType = {
        sender: 'address',
        nonce: 'uint256',
        initCode: 'bytes',
        callData: 'bytes',
        callGasLimit: 'uint256',
        verificationGasLimit: 'uint256',
        preVerificationGas: 'uint256',
        maxFeePerGas: 'uint256',
        maxPriorityFeePerGas: 'uint256',
        paymaster: 'address',
        paymasterData: 'bytes',
        signature: 'bytes'
      };

      // This is a simplified implementation
      // In production, you'd use proper EIP-712 typed data signing
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
        signature: userOp.signature || '0x'
      });

      // Create a proper hash (simplified)
      const { keccak256 } = require('viem');
      return keccak256(userOpData as `0x${string}`);
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
          parseEther(value), // Value is already string, parseEther returns bigint
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
            wallet: { connect: { id: walletId } },
            hash: txHash,
            fromAddress: fromAddress,
            toAddress: to,
            value: parseEther(value).toString(),
            status: 'PENDING',
            gasPrice: '0', // Dummy value
            gasUsed: 0, // Dummy value
            gasLimit: 0, // Dummy value
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
        value: BigInt(tx.value), // Convert string to bigint for batch execution
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
                wallet: { connect: { id: walletId } },
                hash: `${txHash}-${Math.random().toString(36).substr(2, 9)}`, // Unique ID for batch items
                fromAddress: wallet.address,
                toAddress: tx.to,
                value: parseEther(tx.value).toString(),
                status: 'PENDING',
                gasPrice: '0', // Dummy value
                gasUsed: 0, // Dummy value
                gasLimit: 0, // Dummy value
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
      data: data as `0x${string}`,
      kzg: undefined,
      account: provider.account,
      chain: mainnet, // Add chain property
    };

    return await walletClient.sendTransaction(transaction);
  }

  // Legacy methods for backward compatibility
  // async buildAndSignTransactionForAI(
  //   agentVerifierId: string,
  //   to: string,
  //   value: string,
  //   chainId: number = 1
  // ) {
  //   // Find wallet by verifierId
  //   const wallet = await this.prisma.wallet.findFirst({
  //     where: {
  //       agent: { user: { verifierId: agentVerifierId } }
  //     }
  //   });

  //   if (!wallet) {
  //     throw new Error(`Wallet not found for verifierId: ${agentVerifierId}`);
  //   }

  //   return this.executeTransaction(wallet.id, {
  //     to,
  //     value,
  //     useSmartAccount: true // AI agents prefer Smart Accounts
  //   });
  // }

  private async performComplianceCheck(fromAddress: string, toAddress: string): Promise<ComplianceCheckResult> {
    try {
      this.logger.log(`Performing compliance check for transaction from ${fromAddress} to ${toAddress}`);

      // Create public client for blockchain queries
      const publicClient = createPublicClient({
        chain: mainnet,
        transport: http()
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

      // Check if addresses are on blacklist (if available)
      const blacklist = process.env.ADDRESS_BLACKLIST?.split(',') || [];
      if (blacklist.some(addr => addr.toLowerCase() === toAddress.toLowerCase())) {
        riskScore += 80;
        riskFactors.push('Recipient on blacklist');
      }

      // Check transaction patterns (simplified)
      const recentTransactions = await this.getRecentTransactions(fromAddress);
      if (recentTransactions.length > 50) {
        riskScore += 20;
        riskFactors.push('High transaction frequency');
      }

      // Check for suspicious contract interactions
      const codeAtAddress = await publicClient.getBytecode({
        address: toAddress as `0x${string}`
      });

      if (codeAtAddress && codeAtAddress !== '0x') {
        // This is a contract, check if it's verified or suspicious
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
        reason: isHighRisk ? riskFactors.join(', ') : undefined
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

  private isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  private async getRecentTransactions(address: string): Promise<any[]> {
    try {
      // In a real implementation, you would query an indexer or API
      // For now, return empty array as a placeholder
      return [];
    } catch (error) {
      this.logger.error('Failed to get recent transactions:', error);
      return [];
    }
  }

  private async assessContractRisk(address: string): Promise<number> {
    try {
      // In a real implementation, you would:
      // 1. Check contract verification status
      // 2. Analyze contract code for suspicious patterns
      // 3. Check contract age and activity
      // 4. Query external risk APIs

      // For now, return a default low risk score
      return 10;
    } catch (error) {
      this.logger.error('Failed to assess contract risk:', error);
      return 30; // Medium risk on error
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
