import {
  Body,
  Controller,
  Get,
  Headers,
  HttpException,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
// @ts-ignore
// @ts-ignore
// @ts-ignore
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AgentApiGrantsService } from '../services/agent-api-grants.service.js';

@ApiTags('agent-proxy')
@Controller('agent-proxy')
export class AgentProxyController {
  constructor(private readonly grantsService: AgentApiGrantsService) {}

  @Post(':provider')
  @ApiOperation({
    summary:
      'Proxy LLM requests for agents using scoped grant tokens (provider keys remain server-side)',
  })
  @ApiResponse({ status: 200, description: 'Provider response (proxied)' })
  async proxy(
    @Param('provider') provider: string,
    @Headers('authorization') authorization: string | undefined,
    @Body() body: any
  ) {
    try {
      const target = typeof body?.target === 'string' ? body.target.trim() : '';
      if (target) {
        const payload =
          body && typeof body === 'object'
            ? Object.fromEntries(Object.entries(body).filter(([k]) => k !== 'target'))
            : body;
        return await this.grantsService.adaptiveProxy(target, authorization, payload);
      }

      return await this.grantsService.proxy(provider, authorization, body);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        (error as Error).message || 'Proxy request failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('adaptive/:target')
  @ApiOperation({
    summary:
      'Adaptive middleware proxy: resolve provider/model from centralized routing (global + target override) with automatic fallback',
  })
  @ApiResponse({ status: 200, description: 'Provider response (proxied via adaptive routing)' })
  async adaptiveProxy(
    @Param('target') target: string,
    @Headers('authorization') authorization: string | undefined,
    @Body() body: any
  ) {
    try {
      return await this.grantsService.adaptiveProxy(target, authorization, body);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        (error as Error).message || 'Adaptive proxy request failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('adaptive/config/:target')
  @ApiOperation({
    summary:
      'Read-only effective adaptive routing config for a target (no token required): returns primary/fallback provider+model',
  })
  @ApiResponse({ status: 200, description: 'Resolved adaptive routing config' })
  async adaptiveConfig(@Param('target') target: string) {
    try {
      return await this.grantsService.getAdaptiveConfig(target);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        (error as Error).message || 'Failed to fetch adaptive config',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
