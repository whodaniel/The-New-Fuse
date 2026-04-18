import { Controller, Post, Get, Body, Param, Logger } from '@nestjs/common';
import { WalletsService } from './wallets.service.js';
import { SmartAccountDeploymentResult } from '../smart-accounts/smart-account.service.js';

@Controller('wallets')
export class WalletsController {
  private readonly logger = new Logger(WalletsController.name);

  constructor(private readonly walletsService: WalletsService) {}

  @Post('create')
  async createWallet(@Body() createWalletDto: {
    userId: string;
    verifierId: string;
    chainId?: number;
    userType?: 'HUMAN' | 'AI';
    enableSmartAccount?: boolean;
  }): Promise<any> {
    try {
      const { userId, verifierId, chainId, userType = 'HUMAN', enableSmartAccount = true } = createWalletDto;
      return await this.walletsService.createWallet(userId, verifierId, chainId, userType, enableSmartAccount);
    } catch (error) {
      this.logger.error('Failed to create wallet:', error);
      throw error;
    }
  }

  @Get('user/:userId')
  async getWalletsByUserId(@Param('userId') userId: string): Promise<any[]> {
    return await this.walletsService.getWalletsByUserId(userId);
  }

  @Get('address/:address')
  async getWalletByAddress(@Param('address') address: string): Promise<any> {
    return await this.walletsService.getWalletByAddress(address);
  }

  @Get('info/:walletId')
  async getWalletWithSmartAccountInfo(@Param('walletId') walletId: string): Promise<any> {
    try {
      return await this.walletsService.getWalletWithSmartAccountInfo(walletId);
    } catch (error) {
      this.logger.error('Failed to get wallet info:', error);
      throw error;
    }
  }

  @Post('enable-smart-account/:walletId')
  async enableSmartAccount(@Param('walletId') walletId: string): Promise<SmartAccountDeploymentResult> {
    try {
      return await this.walletsService.enableSmartAccountForWallet(walletId);
    } catch (error) {
      this.logger.error('Failed to enable Smart Account:', error);
      throw error;
    }
  }

  @Post('deploy-smart-account/:walletId')
  async deploySmartAccount(@Param('walletId') walletId: string): Promise<SmartAccountDeploymentResult> {
    try {
      return await this.walletsService.deploySmartAccountForWallet(walletId);
    } catch (error) {
      this.logger.error('Failed to deploy Smart Account:', error);
      throw error;
    }
  }
}