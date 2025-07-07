import { Injectable, Logger } from '@nestjs/common';
import { Web3authService } from '../web3auth/web3auth.service';
import { PrismaService } from '../services/prisma.service';
import { SmartAccountService } from '../smart-accounts/smart-account.service';

@Injectable()
export class WalletsService {
  private readonly logger = new Logger(WalletsService.name);

  constructor(
    private readonly web3authService: Web3authService,
    private readonly prisma: PrismaService,
    private readonly smartAccountService: SmartAccountService
  ) {}

  async createWallet(userId: string, verifierId: string, chainId: number = 1, userType: 'HUMAN' | 'AI' = 'HUMAN', enableSmartAccount: boolean = true) {
    try {
      this.logger.log(`Creating wallet for ${userType} user ${userId} with verifierId ${verifierId}`);
      
      // Always derive EOA address from Web3Auth as primary address
      const eoaAddress = await this.web3authService.deriveAddress(verifierId);
      
      // Check if wallet already exists
      const existingWallet = await this.prisma.wallet.findUnique({
        where: { address: eoaAddress }
      });

      if (existingWallet) {
        this.logger.log(`Wallet already exists for address ${eoaAddress}`);
        
        // If Smart Account not enabled and requested, enable it
        if (enableSmartAccount && !existingWallet.smartAccountEnabled) {
          await this.smartAccountService.enableSmartAccountForWallet(existingWallet.id);
          return await this.prisma.wallet.findUnique({
            where: { id: existingWallet.id }
          });
        }
        
        return existingWallet;
      }

      // Determine initial wallet type
      const initialWalletType = enableSmartAccount ? 'HYBRID' : 'EOA';

      // Create new wallet record with EOA as primary
      const wallet = await this.prisma.wallet.create({
        data: {
          userId,
          address: eoaAddress, // Primary EOA address
          chain_id: chainId,
          wallet_type: initialWalletType,
          smartAccountEnabled: false, // Will be enabled below if requested
          user: {
            connectOrCreate: {
              where: { verifierId },
              create: {
                verifierId,
                userType
              }
            }
          }
        }
      });

      this.logger.log(`EOA wallet created successfully for ${userType} user ${userId} at address ${eoaAddress}`);

      // Enable Smart Account if requested
      if (enableSmartAccount) {
        await this.smartAccountService.enableSmartAccountForWallet(wallet.id);
        this.logger.log(`Smart Account enabled for wallet ${wallet.id}`);
        
        // Return updated wallet with Smart Account info
        return await this.prisma.wallet.findUnique({
          where: { id: wallet.id },
          include: { user: true }
        });
      }

      return wallet;
    } catch (error) {
      this.logger.error(`Failed to create wallet for user ${userId}:`, error);
      throw error;
    }
  }

  async enableSmartAccountForWallet(walletId: string) {
    return await this.smartAccountService.enableSmartAccountForWallet(walletId);
  }

  async deploySmartAccountForWallet(walletId: string) {
    return await this.smartAccountService.deploySmartAccount(walletId);
  }

  async getWalletWithSmartAccountInfo(walletId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { id: walletId },
      include: { user: true, transactions: true }
    });

    if (!wallet) {
      throw new Error(`Wallet not found: ${walletId}`);
    }

    return {
      ...wallet,
      smartAccountInfo: wallet.smartAccountEnabled 
        ? await this.smartAccountService.getSmartAccountInfo(walletId)
        : null
    };
  }

  async getWalletsByUserId(userId: string) {
    return this.prisma.wallet.findMany({
      where: { userId }
    });
  }

  async getWalletByAddress(address: string) {
    return this.prisma.wallet.findUnique({
      where: { address }
    });
  }
}