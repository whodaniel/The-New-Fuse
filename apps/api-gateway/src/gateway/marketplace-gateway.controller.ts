import {
  Body,
  Controller,
  Get,
  Headers,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
  Version,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { ProxyService } from '../proxy/proxy.service';

@Controller('marketplace')
@ApiTags('marketplace')
export class MarketplaceGatewayController {
  constructor(private readonly proxyService: ProxyService) {}

  private async proxyWithFallback(
    path: string,
    method: 'GET' | 'POST' = 'GET',
    headers: Record<string, string>,
    res: Response,
    query?: Record<string, string>,
    body?: any
  ) {
    try {
      const primaryResponse = await this.proxyService.proxyRequest(
        'agents',
        path,
        method,
        headers,
        body,
        query
      );
      if (primaryResponse.status !== HttpStatus.NOT_FOUND) {
        return res.status(primaryResponse.status).json(primaryResponse.data);
      }
    } catch {
      // Fallback below handles transport errors.
    }

    try {
      const response = await this.proxyService.proxyRequest(
        'backend',
        path,
        method,
        headers,
        body,
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

  @Get('catalog')
  @Version(['1', VERSION_NEUTRAL])
  @ApiOperation({ summary: 'List marketplace catalog' })
  @ApiResponse({ status: 200, description: 'Marketplace catalog retrieved successfully' })
  async getCatalog(
    @Query() query: Record<string, string>,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    return this.proxyWithFallback('/api/marketplace/catalog', 'GET', headers, res, query);
  }

  @Get('experiences')
  @Version('1')
  @ApiOperation({ summary: 'List marketplace experiences' })
  @ApiResponse({ status: 200, description: 'Marketplace experiences retrieved successfully' })
  async getExperiences(
    @Query() query: Record<string, string>,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    return this.proxyWithFallback('/api/marketplace/experiences', 'GET', headers, res, query);
  }

  @Get('catalog/:id')
  @Version('1')
  @ApiOperation({ summary: 'Get marketplace catalog item by ID' })
  @ApiResponse({ status: 200, description: 'Marketplace catalog item retrieved successfully' })
  async getCatalogItem(
    @Param('id') id: string,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    return this.proxyWithFallback(`/api/marketplace/catalog/${id}`, 'GET', headers, res);
  }

  @Post('experiences/submit')
  @Version('1')
  @ApiOperation({ summary: 'Submit marketplace experience' })
  @ApiResponse({ status: 201, description: 'Marketplace experience submitted successfully' })
  async submitExperience(
    @Body() body: any,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    return this.proxyWithFallback(
      '/api/marketplace/experiences/submit',
      'POST',
      headers,
      res,
      undefined,
      body
    );
  }

  @Post('catalog/submit')
  @Version('1')
  @ApiOperation({ summary: 'Submit marketplace catalog item' })
  @ApiResponse({ status: 201, description: 'Marketplace catalog item submitted successfully' })
  async submitCatalogItem(
    @Body() body: any,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    return this.proxyWithFallback(
      '/api/marketplace/catalog/submit',
      'POST',
      headers,
      res,
      undefined,
      body
    );
  }

  @Post('catalog/:id/publication-status')
  @Version('1')
  @ApiOperation({ summary: 'Update catalog publication status' })
  @ApiResponse({ status: 200, description: 'Catalog publication status updated successfully' })
  async updateCatalogPublicationStatus(
    @Param('id') id: string,
    @Body() body: any,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    return this.proxyWithFallback(
      `/api/marketplace/catalog/${id}/publication-status`,
      'POST',
      headers,
      res,
      undefined,
      body
    );
  }

  @Get('research/mcp/counts')
  @Version('1')
  @ApiOperation({ summary: 'Get MCP research counts' })
  @ApiResponse({ status: 200, description: 'MCP research counts retrieved successfully' })
  async getResearchMcpCounts(@Headers() headers: Record<string, string>, @Res() res: Response) {
    return this.proxyWithFallback('/api/marketplace/research/mcp/counts', 'GET', headers, res);
  }

  @Get('research/mcp/sources')
  @Version('1')
  @ApiOperation({ summary: 'List MCP research sources' })
  @ApiResponse({ status: 200, description: 'MCP research sources retrieved successfully' })
  async getResearchMcpSources(
    @Query() query: Record<string, string>,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    return this.proxyWithFallback(
      '/api/marketplace/research/mcp/sources',
      'GET',
      headers,
      res,
      query
    );
  }

  @Get('research/mcp/servers')
  @Version('1')
  @ApiOperation({ summary: 'Search MCP research servers' })
  @ApiResponse({ status: 200, description: 'MCP research servers retrieved successfully' })
  async searchResearchMcpServers(
    @Query() query: Record<string, string>,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    return this.proxyWithFallback(
      '/api/marketplace/research/mcp/servers',
      'GET',
      headers,
      res,
      query
    );
  }

  @Get('research/skills/marketplace/counts')
  @Version('1')
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
      'GET',
      headers,
      res
    );
  }

  @Get('research/skills/marketplace/entries')
  @Version('1')
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
      'GET',
      headers,
      res,
      query
    );
  }
}
