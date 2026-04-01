import { Controller, Get, Headers, HttpStatus, Query, Res } from '@nestjs/common';
// @ts-ignore
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { ProxyService } from '../proxy/proxy.service';

@Controller('marketplace')
@ApiTags('marketplace')
export class MarketplaceGatewayController {
  constructor(private readonly proxyService: ProxyService) {}

  private async proxyWithFallback(
    path: string,
    headers: Record<string, string>,
    res: Response,
    query?: Record<string, string>
  ) {
    try {
      const response = await this.proxyService.proxyRequest(
        'agents',
        path,
        'GET',
        headers,
        undefined,
        query
      );
      return res.status(response.status).json(response.data);
    } catch {
      try {
        const response = await this.proxyService.proxyRequest(
          'backend',
          path,
          'GET',
          headers,
          undefined,
          query
        );
        return res.status(response.status).json(response.data);
      } catch (fallbackError) {
        const fallbackErrorMessage =
          fallbackError instanceof Error ? fallbackError.message : 'Unknown error';
        return res.status(HttpStatus.BAD_GATEWAY).json({
          message: 'Marketplace service unavailable',
          error: fallbackErrorMessage,
        });
      }
    }
  }

  @Get('research/mcp/counts')
  @ApiOperation({ summary: 'Get MCP research counts' })
  @ApiResponse({ status: 200, description: 'MCP research counts retrieved successfully' })
  async getResearchMcpCounts(@Headers() headers: Record<string, string>, @Res() res: Response) {
    return this.proxyWithFallback('/api/marketplace/research/mcp/counts', headers, res);
  }

  @Get('research/mcp/sources')
  @ApiOperation({ summary: 'List MCP research sources' })
  @ApiResponse({ status: 200, description: 'MCP research sources retrieved successfully' })
  async getResearchMcpSources(
    @Query() query: Record<string, string>,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    return this.proxyWithFallback('/api/marketplace/research/mcp/sources', headers, res, query);
  }

  @Get('research/mcp/servers')
  @ApiOperation({ summary: 'Search MCP research servers' })
  @ApiResponse({ status: 200, description: 'MCP research servers retrieved successfully' })
  async searchResearchMcpServers(
    @Query() query: Record<string, string>,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    return this.proxyWithFallback('/api/marketplace/research/mcp/servers', headers, res, query);
  }

  @Get('research/skills/marketplace/counts')
  @ApiOperation({ summary: 'Get mirrored skills marketplace counts' })
  @ApiResponse({
    status: 200,
    description: 'Mirrored skills marketplace counts retrieved successfully',
  })
  async getResearchSkillMarketplaceCounts(
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    return this.proxyWithFallback(
      '/api/marketplace/research/skills/marketplace/counts',
      headers,
      res
    );
  }

  @Get('research/skills/marketplace/entries')
  @ApiOperation({ summary: 'List mirrored skills marketplace entries' })
  @ApiResponse({
    status: 200,
    description: 'Mirrored skills marketplace entries retrieved successfully',
  })
  async listResearchSkillMarketplaceEntries(
    @Query() query: Record<string, string>,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    return this.proxyWithFallback(
      '/api/marketplace/research/skills/marketplace/entries',
      headers,
      res,
      query
    );
  }
}
