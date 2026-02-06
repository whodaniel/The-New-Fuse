import { Body, Controller, Get, Logger, Param, Post } from '@nestjs/common';
import { TransactionsService } from './transactions.service';

@Controller('transactions')
export class TransactionsController {
  private readonly logger = new Logger(TransactionsController.name);

  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('execute/:walletId')
  async executeTransaction(
    @Param('walletId') walletId: string,
    @Body()
    transactionData: {
      to: string;
      value: string;
      data?: string;
      useSmartAccount?: boolean;
    }
  ) {
    try {
      return await this.transactionsService.executeTransaction(walletId, transactionData);
    } catch (error) {
      this.logger.error('Failed to execute transaction:', error);
      throw error;
    }
  }

  @Post('execute-batch/:walletId')
  async executeBatchTransaction(
    @Param('walletId') walletId: string,
    @Body()
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
      return await this.transactionsService.executeBatchTransaction(walletId, batchData);
    } catch (error) {
      this.logger.error('Failed to execute batch transaction:', error);
      throw error;
    }
  }

  @Get('wallet/:walletId')
  async getTransactionsByWalletId(@Param('walletId') walletId: string) {
    try {
      return await this.transactionsService.getTransactionsByWalletId(walletId);
    } catch (error) {
      this.logger.error('Failed to get transactions:', error);
      throw error;
    }
  }

  @Post('update-status/:txHash')
  async updateTransactionStatus(
    @Param('txHash') txHash: string,
    @Body() statusData: { status: 'SUCCESS' | 'FAILED' }
  ) {
    try {
      return await this.transactionsService.updateTransactionStatus(txHash, statusData.status);
    } catch (error) {
      this.logger.error('Failed to update transaction status:', error);
      throw error;
    }
  }

  // Legacy AI-specific endpoints for backward compatibility
  // @Post('ai-transaction')
  // async createAITransaction(@Body() transactionData: {
  //   agentVerifierId: string;
  //   to: string;
  //   value: string;
  //   data?: string;
  //   chainId?: number;
  // }) {
  //   try {
  //     // return await this.transactionsService.buildAndSignTransactionForAI( // Commented out due to build errors
  //     //   transactionData.agentVerifierId,
  //     //   transactionData.to,
  //     //   transactionData.value,
  //     //   transactionData.chainId
  //     // );
  //     throw new Error('AI transaction creation is not currently available.');
  //   } catch (error) {
  //     this.logger.error('Failed to create AI transaction:', error);
  //     throw error;
  //   }
  // }

  @Post('ai-user-operation')
  async createAIUserOperation(
    @Body()
    userOpData: {
      agentVerifierId: string;
      to: string;
      value: string;
      data?: string;
      chainId?: number;
    }
  ) {
    try {
      return await this.transactionsService.buildAndSignUserOpForAI(
        userOpData.agentVerifierId,
        userOpData
      );
    } catch (error) {
      this.logger.error('Failed to create AI UserOperation:', error);
      throw error;
    }
  }
}
