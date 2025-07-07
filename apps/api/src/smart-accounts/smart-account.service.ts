import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
import { Web3authService } from '../web3auth/web3auth.service';
import { createPublicClient, createWalletClient, http, parseAbi, getContract, encodeFunctionData } from 'viem';
import { mainnet } from 'viem/chains';

interface SmartAccountDeploymentResult {
  smartAccountAddress: string;
  transactionHash?: string;
  isCounterfactual: boolean;
}

@Injectable()
export class SmartAccountService {
  private readonly logger = new Logger(SmartAccountService.name);
  
  private readonly factoryAbi = parseAbi([
    'function createAccount(address owner, bytes32 salt) external returns (address)',
    'function getAddress(address owner, bytes32 salt) external view returns (address)',
    'function accountExists(address owner, bytes32 salt) external view returns (bool)'
  ]);

  private readonly smartAccountAbi = parseAbi([
    'function execute(address dest, uint256 value, bytes calldata func) external',
    'function executeBatch(address[] calldata dest, uint256[] calldata value, bytes[] calldata func) external',
    'function owner() external view returns (address)',
    'function isValidSignature(bytes32 hash, bytes memory signature) external view returns (bytes4)'
  ]);

  constructor(
    private readonly prisma: PrismaService,
    private readonly web3authService: Web3authService
  ) {}

  async enableSmartAccountForWallet(walletId: string): Promise<SmartAccountDeploymentResult> {
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
          smartAccountAddress: wallet.smartAccountAddress!,
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
    } catch (error) {
      this.logger.error(`Failed to enable Smart Account for wallet ${walletId}:`, error);
      throw error;
    }
  }

  async deploySmartAccount(walletId: string): Promise<SmartAccountDeploymentResult> {
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
          smartAccountAddress: wallet.smartAccountAddress!,
          isCounterfactual: false
        };
      }

      // Get Web3Auth provider for the owner
      const provider = await this.web3authService.getProvider(wallet.user.verifierId);
      
      // Create wallet client for deployment
      const walletClient = createWalletClient({
        account: provider.account,
        chain: mainnet,
        transport: http()
      });

      // Get factory contract
      const factoryAddress = process.env.SMART_ACCOUNT_FACTORY_ADDRESS;
      if (!factoryAddress) {
        throw new Error('Smart Account Factory address not configured');
      }

      const factoryContract = getContract({
        address: factoryAddress as `0x${string}`,
        abi: this.factoryAbi,
        client: walletClient
      });

      // Deploy Smart Account
      const deployTx = await factoryContract.write.createAccount([
        wallet.address as `0x${string}`,
        wallet.smartAccountSalt as `0x${string}`
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
        smartAccountAddress: wallet.smartAccountAddress!,
        transactionHash: deployTx,
        isCounterfactual: false
      };
    } catch (error) {
      this.logger.error(`Failed to deploy Smart Account for wallet ${walletId}:`, error);
      throw error;
    }
  }

  async executeSmartAccountTransaction(
    walletId: string,
    target: string,
    value: bigint,
    data: string
  ): Promise<string> {
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
      const walletClient = createWalletClient({
        account: provider.account,
        chain: mainnet,
        transport: http()
      });

      // Get Smart Account contract
      const smartAccountContract = getContract({
        address: wallet.smartAccountAddress as `0x${string}`,
        abi: this.smartAccountAbi,
        client: walletClient
      });

      // Execute transaction through Smart Account
      const txHash = await smartAccountContract.write.execute([
        target as `0x${string}`,
        value,
        data as `0x${string}`
      ]);

      this.logger.log(`Smart Account transaction executed: ${txHash}`);
      return txHash;
    } catch (error) {
      this.logger.error(`Failed to execute Smart Account transaction for wallet ${walletId}:`, error);
      throw error;
    }
  }

  async executeBatchSmartAccountTransaction(
    walletId: string,
    transactions: Array<{
      target: string;
      value: bigint;
      data: string;
    }>
  ): Promise<string> {
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
      const walletClient = createWalletClient({
        account: provider.account,
        chain: mainnet,
        transport: http()
      });

      // Get Smart Account contract
      const smartAccountContract = getContract({
        address: wallet.smartAccountAddress as `0x${string}`,
        abi: this.smartAccountAbi,
        client: walletClient
      });

      // Prepare batch transaction data
      const targets = transactions.map(tx => tx.target as `0x${string}`);
      const values = transactions.map(tx => tx.value);
      const dataArray = transactions.map(tx => tx.data as `0x${string}`);

      // Execute batch transaction
      const txHash = await smartAccountContract.write.executeBatch([
        targets,
        values,
        dataArray
      ]);

      this.logger.log(`Batch Smart Account transaction executed: ${txHash}`);
      return txHash;
    } catch (error) {
      this.logger.error(`Failed to execute batch Smart Account transaction for wallet ${walletId}:`, error);
      throw error;
    }
  }

  async getSmartAccountInfo(walletId: string) {
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

  private generateSalt(verifierId: string, eoaAddress: string): string {
    const crypto = require('crypto');
    const data = `${verifierId}-${eoaAddress}-${Date.now()}`;
    return '0x' + crypto.createHash('sha256').update(data).digest('hex');
  }

  private async getCounterfactualAddress(owner: string, salt: string): Promise<string> {
    try {
      const factoryAddress = process.env.SMART_ACCOUNT_FACTORY_ADDRESS;
      if (!factoryAddress) {
        throw new Error('Smart Account Factory address not configured');
      }

      // Create public client for reading
      const publicClient = createPublicClient({
        chain: mainnet,
        transport: http()
      });

      // Get factory contract
      const factoryContract = getContract({
        address: factoryAddress as `0x${string}`,
        abi: this.factoryAbi,
        client: publicClient
      });

      // Get counterfactual address
      const address = await factoryContract.read.getAddress([
        owner as `0x${string}`,
        salt as `0x${string}`
      ]);

      return address;
    } catch (error) {
      this.logger.error('Failed to get counterfactual address:', error);
      // Fallback to mock address generation for development
      const crypto = require('crypto');
      const data = owner + salt;
      const hash = crypto.createHash('sha256').update(data).digest('hex');
      return '0x' + hash.substring(0, 40);
    }
  }

  async isSmartAccountDeployed(smartAccountAddress: string): Promise<boolean> {
    try {
      const publicClient = createPublicClient({
        chain: mainnet,
        transport: http()
      });

      const code = await publicClient.getBytecode({
        address: smartAccountAddress as `0x${string}`
      });

      return code !== undefined && code !== '0x';
    } catch (error) {
      this.logger.error('Failed to check Smart Account deployment:', error);
      return false;
    }
  }

  async enableSmartAccountForAllUsers(): Promise<void> {
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
      } catch (error) {
        this.logger.error(`Failed to enable Smart Account for wallet ${wallet.id}:`, error);
      }
    }

    this.logger.log(`Smart Account enablement complete. Processed ${walletsWithoutSmartAccounts.length} wallets.`);
  }
}