/**
 * Smart Account Service - Migrated to Drizzle ORM
 * Manages ERC-4337 Smart Account creation and transactions
 */
import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@the-new-fuse/database';
import { createHash } from 'crypto';
import { createPublicClient, http, parseAbi } from 'viem';
import { mainnet } from 'viem/chains';
import { Web3authService } from '../web3auth/web3auth.service';

export interface SmartAccountDeploymentResult {
  smartAccountAddress: string;
  transactionHash?: string;
  isCounterfactual: boolean;
}

interface SmartAccountMetadata {
  enabled: boolean;
  address?: string;
  salt?: string;
  deployed: boolean;
}

@Injectable()
export class SmartAccountService {
  private readonly logger = new Logger(SmartAccountService.name);

  private readonly factoryAbi = parseAbi([
    'function createAccount(address owner, bytes32 salt) external returns (address)',
    'function getAddress(address owner, bytes32 salt) external view returns (address)',
    'function accountExists(address owner, bytes32 salt) external view returns (bool)',
  ]);

  private readonly smartAccountAbi = parseAbi([
    'function execute(address dest, uint256 value, bytes calldata func) external',
    'function executeBatch(address[] calldata dest, uint256[] calldata value, bytes[] calldata func) external',
    'function owner() external view returns (address)',
    'function isValidSignature(bytes32 hash, bytes memory signature) external view returns (bytes4)',
  ]);

  constructor(
    private readonly db: DatabaseService,
    private readonly web3authService: Web3authService
  ) {}

  private getSmartAccountMetadata(wallet: any): SmartAccountMetadata {
    // Use wallet type to determine if smart account is enabled
    const isSmartAccount = wallet.type === 'SMART_ACCOUNT';
    return {
      enabled: isSmartAccount,
      deployed: isSmartAccount && wallet.isActive,
      address: isSmartAccount ? wallet.address : undefined,
      salt: undefined,
    };
  }

  async enableSmartAccountForWallet(walletId: string): Promise<SmartAccountDeploymentResult> {
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

      this.logger.log(
        `Smart Account enabled for wallet ${walletId} at address ${smartAccountAddress}`
      );

      return {
        smartAccountAddress,
        isCounterfactual: true,
      };
    } catch (error) {
      this.logger.error(`Failed to enable Smart Account for wallet ${walletId}:`, error);
      throw error;
    }
  }

  async deploySmartAccount(walletId: string): Promise<SmartAccountDeploymentResult> {
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
        address: factoryAddress as `0x${string}`,
        abi: this.factoryAbi,
        functionName: 'createAccount',
        args: [wallet.address as `0x${string}`, salt as `0x${string}`],
      });

      // Wait for transaction confirmation
      const receipt = await (provider.walletClient as any).waitForTransactionReceipt({
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
        address: metadata.address as `0x${string}`,
        abi: this.smartAccountAbi,
        functionName: 'execute',
        args: [target as `0x${string}`, value, data as `0x${string}`],
      });

      this.logger.log(`Smart Account transaction executed: ${txHash}`);
      return txHash;
    } catch (error) {
      this.logger.error(
        `Failed to execute Smart Account transaction for wallet ${walletId}:`,
        error
      );
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
      const targets = transactions.map((tx) => tx.target as `0x${string}`);
      const values = transactions.map((tx) => tx.value);
      const dataArray = transactions.map((tx) => tx.data as `0x${string}`);

      // Execute batch transaction through Smart Account
      const txHash = await provider.walletClient.writeContract({
        address: metadata.address as `0x${string}`,
        abi: this.smartAccountAbi,
        functionName: 'executeBatch',
        args: [targets, values, dataArray],
      });

      this.logger.log(`Batch Smart Account transaction executed: ${txHash}`);
      return txHash;
    } catch (error) {
      this.logger.error(
        `Failed to execute batch Smart Account transaction for wallet ${walletId}:`,
        error
      );
      throw error;
    }
  }

  async getSmartAccountInfo(walletId: string) {
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

  private generateSalt(userId: string, eoaAddress: string): string {
    const data = `${userId}-${eoaAddress}`.toLowerCase();
    return `0x${createHash('sha256').update(data).digest('hex')}`;
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
        transport: http(),
      });

      // Get counterfactual address
      const address = await publicClient.readContract({
        address: factoryAddress as `0x${string}`,
        abi: this.factoryAbi,
        functionName: 'getAddress',
        args: [owner as `0x${string}`, salt as `0x${string}`],
      });

      return address as string;
    } catch (error) {
      this.logger.error('Failed to get counterfactual address:', error);
      throw new Error('Unable to resolve smart account counterfactual address from factory');
    }
  }

  async isSmartAccountDeployed(smartAccountAddress: string): Promise<boolean> {
    try {
      const publicClient = createPublicClient({
        chain: mainnet,
        transport: http(),
      });

      const code = await publicClient.getBytecode({
        address: smartAccountAddress as `0x${string}`,
      });

      return code !== undefined && code !== '0x';
    } catch (error) {
      this.logger.error('Failed to check Smart Account deployment:', error);
      return false;
    }
  }

  async getWalletsWithoutSmartAccounts() {
    const walletsWithoutSmartAccounts = await this.db.wallets.findByType('EOA');

    return walletsWithoutSmartAccounts.map((wallet: any) => ({
      id: wallet.id,
      address: wallet.address,
      type: wallet.type,
    }));
  }
}
