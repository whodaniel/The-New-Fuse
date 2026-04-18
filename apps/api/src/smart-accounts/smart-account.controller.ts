import { Controller, Post, Get, Body, Param, Logger } from '@nestjs/common';
import { SmartAccountService } from './smart-account.service.js';

@Controller('smart-accounts')
export class SmartAccountController {
  private readonly logger = new Logger(SmartAccountController.name);

  constructor(private readonly smartAccountService: SmartAccountService) {}

  @Post('enable/:walletId')
  async enableSmartAccount(@Param('walletId') walletId: string) {
    try {
      const result = await this.smartAccountService.enableSmartAccountForWallet(walletId);
      return {
        success: true,
        ...result
      };
    } catch (error) {
      this.logger.error('Failed to enable Smart Account:', error);
      throw error;
    }
  }

  @Post('deploy/:walletId')
  async deploySmartAccount(@Param('walletId') walletId: string) {
    try {
      const result = await this.smartAccountService.deploySmartAccount(walletId);
      return {
        success: true,
        ...result
      };
    } catch (error) {
      this.logger.error('Failed to deploy Smart Account:', error);
      throw error;
    }
  }

  @Post('execute/:walletId')
  async executeTransaction(
    @Param('walletId') walletId: string,
    @Body() transactionData: {
      target: string;
      value: string;
      data?: string;
    }
  ) {
    try {
      const { target, value, data = '0x' } = transactionData;
      const txHash = await this.smartAccountService.executeSmartAccountTransaction(
        walletId,
        target,
        BigInt(value),
        data
      );
      
      return {
        success: true,
        transactionHash: txHash
      };
    } catch (error) {
      this.logger.error('Failed to execute Smart Account transaction:', error);
      throw error;
    }
  }

  @Post('execute-batch/:walletId')
  async executeBatchTransaction(
    @Param('walletId') walletId: string,
    @Body() batchData: {
      transactions: Array<{
        target: string;
        value: string;
        data?: string;
      }>;
    }
  ) {
    try {
      const transactions = batchData.transactions.map(tx => ({
        target: tx.target,
        value: BigInt(tx.value),
        data: tx.data || '0x'
      }));

      const txHash = await this.smartAccountService.executeBatchSmartAccountTransaction(
        walletId,
        transactions
      );
      
      return {
        success: true,
        transactionHash: txHash
      };
    } catch (error) {
      this.logger.error('Failed to execute batch Smart Account transaction:', error);
      throw error;
    }
  }

  @Get('info/:walletId')
  async getSmartAccountInfo(@Param('walletId') walletId: string) {
    try {
      const info = await this.smartAccountService.getSmartAccountInfo(walletId);
      return {
        success: true,
        ...info
      };
    } catch (error) {
      this.logger.error('Failed to get Smart Account info:', error);
      throw error;
    }
  }

  // @Post('enable-all')
  // async enableSmartAccountForAllUsers() {
  //   try {
  //     // await this.smartAccountService.enableSmartAccountForAllUsers(); // This method does not exist in the service
  //     return {
  //       success: false, // Indicate that this operation is not yet supported
  //       message: 'Bulk Smart Account enablement is not yet supported'
  //     };
  //   } catch (error) {
  //     this.logger.error('Failed to enable Smart Accounts for all users:', error);
  //     throw error;
  //   }
  // }
}