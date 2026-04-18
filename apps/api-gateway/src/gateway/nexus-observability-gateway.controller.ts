import { Controller, Get, Headers, HttpStatus, Res, Version } from '@nestjs/common';
// @ts-ignore
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { ProxyService } from '../proxy/proxy.service';

@Controller('')
@ApiTags('nexus-observability')
export class NexusObservabilityGatewayController {
  constructor(private readonly proxyService: ProxyService) {}

  private async proxyReadOnlyEndpoint(
    upstreams: ReadonlyArray<{ service: string; path: string }>,
    headers: Record<string, string>,
    res: Response,
    unavailableMessage: string
  ) {
    let lastFailure = 'No upstreams responded';
    let lastStatus: number | null = null;
    let lastPayload: unknown = null;

    for (const upstream of upstreams) {
      try {
        const response = await this.proxyService.proxyRequest(
          upstream.service,
          upstream.path,
          'GET',
          headers
        );

        if (response.status >= 200 && response.status < 300) {
          return res.status(response.status).json(response.data);
        }

        lastFailure = `${upstream.service} returned ${response.status}`;
        lastStatus = response.status;
        lastPayload = response.data;
      } catch (error) {
        lastFailure = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    if (lastStatus && lastStatus >= 400 && lastStatus < 500) {
      return res.status(lastStatus).json(lastPayload);
    }

    return res.status(HttpStatus.BAD_GATEWAY).json({
      message: unavailableMessage,
      error: lastFailure,
    });
  }

  @Get('orchestrator/health')
  @Version('1')
  @ApiOperation({ summary: 'Get orchestrator health compatibility view' })
  @ApiResponse({ status: 200, description: 'Orchestrator health retrieved successfully' })
  async getOrchestratorHealth(@Headers() headers: Record<string, string>, @Res() res: Response) {
    return this.proxyReadOnlyEndpoint(
      [
        { service: 'api', path: '/api/orchestrator/health' },
        { service: 'agents', path: '/api/orchestrator/health' },
        { service: 'backend', path: '/api/orchestrator/health' },
        { service: 'backend', path: '/orchestrator/health' },
      ],
      headers,
      res,
      'Orchestrator health service unavailable'
    );
  }

  @Get('orchestrator/agents')
  @Version('1')
  @ApiOperation({ summary: 'Get orchestrator agents compatibility view' })
  @ApiResponse({ status: 200, description: 'Orchestrator agents retrieved successfully' })
  async getOrchestratorAgents(@Headers() headers: Record<string, string>, @Res() res: Response) {
    return this.proxyReadOnlyEndpoint(
      [
        { service: 'api', path: '/api/orchestrator/agents' },
        { service: 'agents', path: '/api/orchestrator/agents' },
        { service: 'backend', path: '/api/orchestrator/agents' },
        { service: 'backend', path: '/orchestrator/agents' },
      ],
      headers,
      res,
      'Orchestrator agents service unavailable'
    );
  }

  @Get('visualizations/data/graph-artifacts.index.json')
  @Version('1')
  @ApiOperation({ summary: 'Get graph artifacts index compatibility view' })
  @ApiResponse({ status: 200, description: 'Graph artifacts index retrieved successfully' })
  async getGraphArtifactsIndex(@Headers() headers: Record<string, string>, @Res() res: Response) {
    return this.proxyReadOnlyEndpoint(
      [
        { service: 'api', path: '/api/visualizations/data/graph-artifacts.index.json' },
        { service: 'agents', path: '/api/visualizations/data/graph-artifacts.index.json' },
        { service: 'backend', path: '/api/visualizations/data/graph-artifacts.index.json' },
        { service: 'backend', path: '/visualizations/data/graph-artifacts.index.json' },
      ],
      headers,
      res,
      'Graph artifacts index unavailable'
    );
  }
}
