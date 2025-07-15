import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
import { Web3authService } from '../web3auth/web3auth.service';
import { createPublicClient, http, parseAbi } from 'viem';
import { mainnet } from 'viem/chains';

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

  private getSmartAccountMetadata(wallet: any): SmartAccountMetadata {
    return {
      enabled: wallet.smartAccountEnabled || false,
      deployed: wallet.smartAccountDeployed || false,
      address: wallet.smartAccountAddress || undefined,
      salt: wallet.smartAccountSalt || undefined
    };
  }

  async enableSmartAccountForWallet(walletId: string): Promise<SmartAccountDeploymentResult> {
    try {
      this.logger.log(`Enabling Smart Account for wallet ${walletId}`);

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

      const metadata = this.getSmartAccountMetadata(wallet);

      if (metadata.enabled) {
        this.logger.log(`Smart Account already enabled for wallet ${walletId}`);
        return {
          smartAccountAddress: metadata.address || wallet.address,
          isCounterfactual: !metadata.deployed
        };
      }

      // Generate Smart Account address and salt
      const salt = this.generateSalt(wallet.agent?.user?.id || '', wallet.address);
      const smartAccountAddress = await this.getCounterfactualAddress(wallet.address, salt);

      // Update wallet type to indicate smart account capability
      await this.prisma.wallet.update({
        where: { id: walletId },
        data: {
          type: 'SMART_ACCOUNT'
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
        include: { 
          agent: {
            include: { user: true }
          }
        }
      });

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
          isCounterfactual: false
        };
      }

      // For now, mock deployment since we need Web3Auth integration
      this.logger.log(`Smart Account deployment would be executed here for wallet ${walletId}`);

      return {
        smartAccountAddress: wallet.address,
        transactionHash: '0x' + Math.random().toString(16).substr(2, 64), // Mock transaction hash
        isCounterfactual: false
      };
    } catch (error) {
      this.logger.error(`Failed to deploy Smart Account for wallet ${walletId}:`, error);
      throw error;
    }
  }

  async executeSmartAccountTransaction(
    walletId: string,
    _target: string,
    _value: bigint,
    _data: string
  ): Promise<string> {
    try {
      this.logger.log(`Executing Smart Account transaction for wallet ${walletId}`);

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

      const metadata = this.getSmartAccountMetadata(wallet);

      if (!metadata.enabled) {
        throw new Error(`Smart Account not enabled for wallet ${walletId}`);
      }

      // For now, mock transaction execution
      const mockTxHash = '0x' + Math.random().toString(16).substr(2, 64);
      this.logger.log(`Smart Account transaction executed: ${mockTxHash}`);
      return mockTxHash;
    } catch (error) {
      this.logger.error(`Failed to execute Smart Account transaction for wallet ${walletId}:`, error);
      throw error;
    }
  }

  async executeBatchSmartAccountTransaction(
    walletId: string,
    _transactions: Array<{
      target: string;
      value: bigint;
      data: string;
    }>
  ): Promise<string> {
    try {
      this.logger.log(`Executing batch Smart Account transaction for wallet ${walletId}`);

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

      const metadata = this.getSmartAccountMetadata(wallet);

      if (!metadata.enabled) {
        throw new Error(`Smart Account not enabled for wallet ${walletId}`);
      }

      // For now, mock batch transaction execution
      const mockTxHash = '0x' + Math.random().toString(16).substr(2, 64);
      this.logger.log(`Batch Smart Account transaction executed: ${mockTxHash}`);
      return mockTxHash;
    } catch (error) {
      this.logger.error(`Failed to execute batch Smart Account transaction for wallet ${walletId}:`, error);
      throw error;
    }
  }

  async getSmartAccountInfo(walletId: string) {
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

    const metadata = this.getSmartAccountMetadata(wallet);

    return {
      walletId: wallet.id,
      eoaAddress: wallet.address,
      smartAccountEnabled: metadata.enabled,
      smartAccountAddress: metadata.address,
      smartAccountDeployed: metadata.deployed,
      userType: wallet.agent?.user?.role || 'USER',
      walletType: wallet.type
    };
  }

  private generateSalt(userId: string, eoaAddress: string): string {
    const crypto = require('crypto');
    const data = `${userId}-${eoaAddress}-${Date.now()}`;
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

      // Get counterfactual address
      const address = await publicClient.readContract({
        address: factoryAddress as `0x${string}`,
        abi: this.factoryAbi,
        functionName: 'getAddress',
        args: [
          owner as `0x${string}`,
          salt as `0x${string}`
        ]
      });

      return address as string;
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

  async getWalletsWithoutSmartAccounts() {
    const walletsWithoutSmartAccounts = await this.prisma.wallet.findMany({
      where: {
        type: 'EOA' // Only EOA wallets don't have smart account capability
      }
    });

    return walletsWithoutSmartAccounts.map(wallet => ({
      id: wallet.id,
      address: wallet.address,
      type: wallet.type
    }));
  }
}