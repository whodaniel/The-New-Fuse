import {
  Controller,
  Get,
  Headers,
  HttpStatus,
  NotFoundException,
  Param,
  Query,
  Res,
  Version,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { ProxyService } from '../proxy/proxy.service';

const ALLOWED_ENDPOINTS = new Set(['goals', 'cron', 'terminal-mirror', 'summary']);

@Controller('local-runtime')
@ApiTags('local-runtime')
export class LocalRuntimeGatewayController {
  constructor(private readonly proxyService: ProxyService) {}

  @Get(':endpoint')
  @Version(VERSION_NEUTRAL)
  @ApiOperation({ summary: 'Proxy Mission Control local-runtime reads to the local API' })
  @ApiResponse({ status: 200, description: 'Local runtime payload from apps/api' })
  async proxyLocalRuntime(
    @Param('endpoint') endpoint: string,
    @Query() query: Record<string, string>,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    if (!ALLOWED_ENDPOINTS.has(endpoint)) {
      throw new NotFoundException(`Unknown local-runtime endpoint: ${endpoint}`);
    }

    // The 'api' upstream alias can point back at this gateway when env is
    // unset; the forwarded-by marker breaks that recursion after one hop.
    if ((headers['x-forwarded-by'] || '').includes('api-gateway')) {
      return res.status(HttpStatus.OK).json({
        available: false,
        reason: 'Local runtime API is not reachable from the gateway (routing loop guard)',
      });
    }

    const upstreams = ['local-runtime', 'api'] as const;
    let lastFailure = 'No upstreams responded';

    for (const upstream of upstreams) {
      try {
        const response = await this.proxyService.proxyRequest(
          upstream,
          `/api/local-runtime/${endpoint}`,
          'GET',
          headers,
          undefined,
          query
        );

        if (response.status >= 200 && response.status < 500) {
          return res.status(response.status).json(response.data);
        }

        lastFailure = `${upstream} returned ${response.status}`;
      } catch (error) {
        lastFailure = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    return res.status(HttpStatus.OK).json({
      available: false,
      reason: `Local runtime API unavailable: ${lastFailure}`,
    });
  }
}
