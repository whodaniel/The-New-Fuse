/**
 * NestJS Controller for Crypto Agent API
 *
 * Provides REST API endpoints for The New Fuse frontend to interact
 * with the Python-based crypto agent framework.
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpException,
  HttpStatus,
  Logger,
  UseGuards
} from '@nestjs/common';
import { CryptoAgentService, CryptoAgentTask } from './crypto-agent.service';

// Assuming you have an auth guard in your TNF setup
// import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/crypto-agent')
// @UseGuards(JwtAuthGuard) // Uncomment to require authentication
export class CryptoAgentController {
  private readonly logger = new Logger(CryptoAgentController.name);

  constructor(private readonly cryptoAgentService: CryptoAgentService) {}

  /**
   * Submit a new task to the crypto agent
   * POST /api/crypto-agent/tasks
   */
  @Post('tasks')
  async submitTask(@Body() task: CryptoAgentTask) {
    try {
      this.logger.log(`New task submitted: ${task.prompt.substring(0, 50)}...`);
      const result = await this.cryptoAgentService.submitTask(task);
      return result;
    } catch (error) {
      this.logger.error(`Error submitting task: ${error.message}`);
      throw new HttpException(
        `Failed to submit task: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get agent status
   * GET /api/crypto-agent/status
   */
  @Get('status')
  async getStatus() {
    try {
      return await this.cryptoAgentService.getStatus();
    } catch (error) {
      this.logger.error(`Error getting status: ${error.message}`);
      throw new HttpException(
        `Failed to get status: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get task result
   * GET /api/crypto-agent/tasks/:taskId
   */
  @Get('tasks/:taskId')
  async getTaskResult(@Param('taskId') taskId: string) {
    try {
      const result = await this.cryptoAgentService.getTaskResult(taskId);

      if (!result) {
        throw new HttpException('Task not found', HttpStatus.NOT_FOUND);
      }

      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(`Error getting task result: ${error.message}`);
      throw new HttpException(
        `Failed to get task result: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Generate and mint NFT (convenience endpoint)
   * POST /api/crypto-agent/nft/generate-and-mint
   */
  @Post('nft/generate-and-mint')
  async generateAndMintNFT(
    @Body() body: {
      description: string;
      chain?: string;
      listingPrice?: string;
    }
  ) {
    try {
      return await this.cryptoAgentService.generateAndMintNFT(
        body.description,
        body.chain,
        body.listingPrice
      );
    } catch (error) {
      this.logger.error(`Error generating NFT: ${error.message}`);
      throw new HttpException(
        `Failed to generate NFT: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Swap tokens (convenience endpoint)
   * POST /api/crypto-agent/defi/swap
   */
  @Post('defi/swap')
  async swapTokens(
    @Body() body: {
      amount: number;
      fromToken: string;
      toToken: string;
    }
  ) {
    try {
      return await this.cryptoAgentService.swapTokens(
        body.amount,
        body.fromToken,
        body.toToken
      );
    } catch (error) {
      this.logger.error(`Error swapping tokens: ${error.message}`);
      throw new HttpException(
        `Failed to swap tokens: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Stake tokens (convenience endpoint)
   * POST /api/crypto-agent/defi/stake
   */
  @Post('defi/stake')
  async stakeTokens(
    @Body() body: {
      amount: number;
      token: string;
    }
  ) {
    try {
      return await this.cryptoAgentService.stakeForYield(
        body.amount,
        body.token
      );
    } catch (error) {
      this.logger.error(`Error staking tokens: ${error.message}`);
      throw new HttpException(
        `Failed to stake tokens: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Bridge tokens (convenience endpoint)
   * POST /api/crypto-agent/bridge
   */
  @Post('bridge')
  async bridgeTokens(
    @Body() body: {
      amount: number;
      token: string;
      fromChain: string;
      toChain: string;
    }
  ) {
    try {
      return await this.cryptoAgentService.bridgeTokens(
        body.amount,
        body.token,
        body.fromChain,
        body.toChain
      );
    } catch (error) {
      this.logger.error(`Error bridging tokens: ${error.message}`);
      throw new HttpException(
        `Failed to bridge tokens: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
