import { Injectable, Logger } from '@nestjs/common';
import { Web3authService } from '../web3auth/web3auth.service';
import { PrismaService } from '../services/prisma.service';
import { SmartAccountService, SmartAccountDeploymentResult } from '../smart-accounts/smart-account.service';
import { Prisma } from '@prisma/client'; // Import Prisma

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
      
      const eoaAddress = await this.web3authService.deriveAddress(verifierId);
      
      const existingWallet = await this.prisma.wallet.findUnique({
        where: { address: eoaAddress }
      });

      if (existingWallet) {
        this.logger.log(`Wallet already exists for address ${eoaAddress}`);
        
        if (enableSmartAccount && existingWallet.type !== 'SMART_ACCOUNT') {
          await this.smartAccountService.enableSmartAccountForWallet(existingWallet.id);
          return await this.prisma.wallet.findUnique({
            where: { id: existingWallet.id }
          });
        }
        
        return existingWallet;
      }

      const initialWalletType = enableSmartAccount ? 'SMART_ACCOUNT' : 'EOA';

      const wallet = await this.prisma.wallet.create({
        data: {
          address: eoaAddress,
          type: initialWalletType,
          agent: {
            connectOrCreate: {
              where: { id: userId }, // Use id for unique where clause
              create: {
                id: userId, // Set agent's id to userId
                name: `Agent for ${verifierId}`,
                type: userType === 'AI' ? 'ASSISTANT' : 'BASIC',
                user: {
                  connectOrCreate: {
                    where: { id: userId },
                    create: {
                      id: userId,
                      email: `${verifierId}@tnf.ai`,
                      hashedPassword: 'placeholder_hashed_password',
                      role: 'USER',
                    }
                  }
                }
              }
            }
          }
        }
      });

      this.logger.log(`EOA wallet created successfully for ${userType} user ${userId} at address ${eoaAddress}`);

      if (enableSmartAccount) {
        await this.smartAccountService.enableSmartAccountForWallet(wallet.id);
        this.logger.log(`Smart Account enabled for wallet ${wallet.id}`);
        
        return await this.prisma.wallet.findUnique({
          where: { id: wallet.id },
          include: { agent: { include: { user: true } } }
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
      include: { agent: { include: { user: true } } },
      // Added transactions to include here
      // This was causing an error in the previous run, but it was due to the way it was included.
      // Now it's part of the include object directly.
      // transactions: true // Removed from here, moved into include object
    });

    if (!wallet) {
      throw new Error(`Wallet not found: ${walletId}`);
    }

    return {
      ...wallet,
      smartAccountInfo: wallet.type === 'SMART_ACCOUNT'
        ? await this.smartAccountService.getSmartAccountInfo(wallet.id)
        : null
    };
  }

  async getWalletsByUserId(userId: string): Promise<any[]> {
    return this.prisma.wallet.findMany({
      where: { agent: { userId: userId } } // Filter by agent's userId
    });
  }

  async getWalletByAddress(address: string): Promise<any | null> {
    return this.prisma.wallet.findUnique({
      where: { address }
    });
  }
}