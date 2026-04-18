import {
  Controller,
  Get,
  Headers,
  HttpStatus,
  Query,
  Res,
  Version,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { ProxyService } from '../proxy/proxy.service';

@Controller('terminals')
@ApiTags('terminals')
export class TerminalsGatewayController {
  constructor(private readonly proxyService: ProxyService) {}

  private async proxyGraph(
    query: Record<string, string>,
    headers: Record<string, string>,
    res: Response
  ) {
    const upstreams = [
      { service: 'api', path: '/api/terminals/graph' },
      { service: 'agents', path: '/api/terminals/graph' },
      { service: 'backend', path: '/api/terminals/graph' },
    ] as const;

    let lastFailure = 'No upstreams responded';

    for (const upstream of upstreams) {
      try {
        const response = await this.proxyService.proxyRequest(
          upstream.service,
          upstream.path,
          'GET',
          headers,
          undefined,
          query
        );

        if (response.status >= 200 && response.status < 500) {
          return res.status(response.status).json(response.data);
        }

        lastFailure = `${upstream.service} returned ${response.status}`;
      } catch (error) {
        lastFailure = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    return res.status(HttpStatus.BAD_GATEWAY).json({
      message: 'Terminal graph service unavailable',
      error: lastFailure,
    });
  }

  @Get('graph')
  @Version(VERSION_NEUTRAL)
  @ApiOperation({ summary: 'Get terminal topology graph (legacy path)' })
  @ApiResponse({ status: 200, description: 'Terminal graph retrieved successfully' })
  async getTerminalGraphLegacy(
    @Query() query: Record<string, string>,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    return this.proxyGraph(query, headers, res);
  }

  @Get('graph')
  @Version('1')
  @ApiOperation({ summary: 'Get terminal topology graph' })
  @ApiResponse({ status: 200, description: 'Terminal graph retrieved successfully' })
  async getTerminalGraphV1(
    @Query() query: Record<string, string>,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    return this.proxyGraph(query, headers, res);
  }
}
