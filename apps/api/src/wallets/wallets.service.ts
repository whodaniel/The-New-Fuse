import { Injectable, Logger } from '@nestjs/common';
import { Web3authService } from '../web3auth/web3auth.service';
import { PrismaService } from '../services/prisma.service';
import { SmartAccountService, SmartAccountDeploymentResult } from '../smart-accounts/smart-account.service';

@Injectable()
export class WalletsService {
  private readonly logger = new Logger(WalletsService.name);

  constructor(
    private readonly web3authService: Web3authService,
    private readonly prisma: PrismaService,
    private readonly smartAccountService: SmartAccountService
  ) {}

  async createWallet(
    userId: string,
    verifierId: string,
    _chainId: number = 1,
    userType: 'HUMAN' | 'AI' = 'HUMAN',
    enableSmartAccount: boolean = true
  ): Promise<any> {
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
        if (enableSmartAccount && existingWallet.type !== 'SMART_ACCOUNT') {
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
          address: eoaAddress, // Primary EOA address
          type: initialWalletType,
          agent: {
            connectOrCreate: {
              where: { id: userId },
              create: {
                id: userId,
                name: `Agent for ${verifierId}`,
                type: userType === 'AI' ? 'AI_ASSISTANT' : 'HUMAN_AGENT',
                user: {
                  connectOrCreate: {
                    where: { username: verifierId },
                    create: {
                      username: verifierId,
                      email: `${verifierId}@tnf.ai`,
                      role: userType === 'AI' ? 'AI_AGENT' : 'USER'
                    }
                  }
                }
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

  async enableSmartAccountForWallet(walletId: string): Promise<SmartAccountDeploymentResult> {
    return await this.smartAccountService.enableSmartAccountForWallet(walletId);
  }

  async deploySmartAccountForWallet(walletId: string): Promise<SmartAccountDeploymentResult> {
    return await this.smartAccountService.deploySmartAccount(walletId);
  }

  async getWalletWithSmartAccountInfo(walletId: string): Promise<any> {
    const wallet = await this.prisma.wallet.findUnique({
      where: { id: walletId },
      include: { user: true, transactions: true }
    });

    if (!wallet) {
      throw new Error(`Wallet not found: ${walletId}`);
    }

    return {
      ...wallet,
      smartAccountInfo: wallet.type === 'SMART_ACCOUNT'
        ? await this.smartAccountService.getSmartAccountInfo(walletId)
        : null
    };
  }

  async getWalletsByUserId(userId: string): Promise<any[]> {
    return this.prisma.wallet.findMany({
      where: { agent: { user: { id: userId } } }
    });
  }

  async getWalletByAddress(address: string): Promise<any | null> {
    return this.prisma.wallet.findUnique({
      where: { address }
    });
  }
}