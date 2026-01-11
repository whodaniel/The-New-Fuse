/**
 * Wallets Service - Migrated to Drizzle ORM
 * Manages wallet creation and smart account enablement
 */
import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@the-new-fuse/database';
import {
  SmartAccountDeploymentResult,
  SmartAccountService,
} from '../smart-accounts/smart-account.service';
import { Web3authService } from '../web3auth/web3auth.service';

@Injectable()
export class WalletsService {
  private readonly logger = new Logger(WalletsService.name);

  constructor(
    private readonly web3authService: Web3authService,
    private readonly db: DatabaseService,
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
      this.logger.log(
        `Creating wallet for ${userType} user ${userId} with verifierId ${verifierId}`
      );

      const eoaAddress = await this.web3authService.deriveAddress(verifierId);

      const existingWallet = await this.db.wallets.findByAddress(eoaAddress);

      if (existingWallet) {
        this.logger.log(`Wallet already exists for address ${eoaAddress}`);

        if (enableSmartAccount && existingWallet.type !== 'SMART_ACCOUNT') {
          await this.smartAccountService.enableSmartAccountForWallet(existingWallet.id);
          return await this.db.wallets.findById(existingWallet.id);
        }

        return existingWallet;
      }

      // First ensure the user exists
      let user = await this.db.users.findById(userId);
      if (!user) {
        user = await this.db.users.create({
          id: userId,
          email: `${verifierId}@tnf.ai`,
          hashedPassword: 'placeholder_hashed_password',
          role: 'USER',
        });
      }

      // Create or find agent for the user
      let agent = await this.db.agents.findByUserId(userId);
      let agentId: string;

      if (agent.length === 0) {
        const newAgent = await this.db.agents.create({
          name: `Agent for ${verifierId}`,
          type: userType === 'AI' ? 'ASSISTANT' : 'BASIC',
          userId: userId,
        });
        agentId = newAgent.id;
      } else {
        agentId = agent[0].id;
      }

      const initialWalletType = enableSmartAccount ? 'SMART_ACCOUNT' : 'EOA';

      const wallet = await this.db.wallets.create({
        address: eoaAddress,
        type: initialWalletType as any,
        agentId: agentId,
      });

      this.logger.log(
        `EOA wallet created successfully for ${userType} user ${userId} at address ${eoaAddress}`
      );

      if (enableSmartAccount) {
        await this.smartAccountService.enableSmartAccountForWallet(wallet.id);
        this.logger.log(`Smart Account enabled for wallet ${wallet.id}`);

        return await this.db.wallets.findByIdWithAgent(wallet.id);
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
    const wallet = await this.db.wallets.findByIdWithAgent(walletId);

    if (!wallet) {
      throw new Error(`Wallet not found: ${walletId}`);
    }

    return {
      ...wallet,
      smartAccountInfo:
        wallet.type === 'SMART_ACCOUNT'
          ? await this.smartAccountService.getSmartAccountInfo(wallet.id)
          : null,
    };
  }

  async getWalletsByUserId(userId: string): Promise<any[]> {
    return this.db.wallets.findByUserId(userId);
  }

  async getWalletByAddress(address: string): Promise<any | null> {
    return this.db.wallets.findByAddress(address);
  }
}
