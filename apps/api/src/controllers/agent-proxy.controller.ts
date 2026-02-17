import { Body, Controller, Headers, Param, Post } from '@nestjs/common';
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
    return this.grantsService.proxy(provider, authorization, body);
  }
}
