import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AgentApiGrantsService } from '../services/agent-api-grants.service';

@ApiTags('agent-proxy')
@Controller('api/agent-proxy')
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
    const target = typeof body?.target === 'string' ? body.target.trim() : '';
    if (target) {
      const payload =
        body && typeof body === 'object'
          ? Object.fromEntries(Object.entries(body).filter(([k]) => k !== 'target'))
          : body;
      return this.grantsService.adaptiveProxy(target, authorization, payload);
    }

    return this.grantsService.proxy(provider, authorization, body);
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
    return this.grantsService.adaptiveProxy(target, authorization, body);
  }

  @Get('adaptive/config/:target')
  @ApiOperation({
    summary:
      'Read-only effective adaptive routing config for a target (no token required): returns primary/fallback provider+model',
  })
  @ApiResponse({ status: 200, description: 'Resolved adaptive routing config' })
  async adaptiveConfig(@Param('target') target: string) {
    return this.grantsService.getAdaptiveConfig(target);
  }
}
