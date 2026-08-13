import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Res,
  Version,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { ProxyService } from '../proxy/proxy.service';

@Controller('resources')
@ApiTags('resources')
export class ResourcesGatewayController {
  constructor(private readonly proxyService: ProxyService) {}

  private async proxyWithFallback(
    path: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    headers: Record<string, string>,
    res: Response,
    body?: any,
    query?: Record<string, string>
  ) {
    try {
      const primaryResponse = await this.proxyService.proxyRequest(
        'api',
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
        'agents',
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
        message: 'Resources service unavailable',
        error: fallbackErrorMessage,
      });
    }
  }

  @Get()
  @Version('1')
  @ApiOperation({ summary: 'List resources' })
  @ApiResponse({ status: 200, description: 'Resources retrieved successfully' })
  async getResources(
    @Query() query: Record<string, string>,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    return this.proxyWithFallback('/api/resources', 'GET', headers, res, undefined, query);
  }

  @Get('skills')
  @Version('1')
  @ApiOperation({ summary: 'List resource skills' })
  @ApiResponse({ status: 200, description: 'Skills retrieved successfully' })
  async getSkills(
    @Query() query: Record<string, string>,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    return this.proxyWithFallback('/api/resources/skills', 'GET', headers, res, undefined, query);
  }

  @Get('workflows')
  @Version('1')
  @ApiOperation({ summary: 'List resource workflows' })
  @ApiResponse({ status: 200, description: 'Workflows retrieved successfully' })
  async getWorkflows(
    @Query() query: Record<string, string>,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    return this.proxyWithFallback(
      '/api/resources/workflows',
      'GET',
      headers,
      res,
      undefined,
      query
    );
  }

  @Get('templates')
  @Version(['1', VERSION_NEUTRAL])
  @ApiOperation({ summary: 'List resource templates' })
  @ApiResponse({ status: 200, description: 'Templates retrieved successfully' })
  async getTemplates(
    @Query() query: Record<string, string>,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    return this.proxyWithFallback(
      '/api/resources/templates',
      'GET',
      headers,
      res,
      undefined,
      query
    );
  }

  @Get('stats')
  @Version('1')
  @ApiOperation({ summary: 'Get resource stats' })
  @ApiResponse({ status: 200, description: 'Resource stats retrieved successfully' })
  async getResourceStats(@Headers() headers: Record<string, string>, @Res() res: Response) {
    return this.proxyWithFallback('/api/resources/stats', 'GET', headers, res);
  }

  @Post()
  @Version('1')
  @ApiOperation({ summary: 'Create resource' })
  @ApiResponse({ status: 201, description: 'Resource created successfully' })
  async createResource(
    @Body() body: any,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    return this.proxyWithFallback('/api/resources', 'POST', headers, res, body);
  }

  @Post('search')
  @Version('1')
  @ApiOperation({ summary: 'Search resources' })
  @ApiResponse({ status: 200, description: 'Search results returned successfully' })
  async searchResources(
    @Body() body: any,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    return this.proxyWithFallback('/api/resources/search', 'POST', headers, res, body);
  }

  @Post('search/protocol')
  @Version('1')
  @ApiOperation({ summary: 'Protocol-based resource search' })
  @ApiResponse({ status: 200, description: 'Protocol search results returned successfully' })
  async searchResourcesProtocol(
    @Body() body: any,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    return this.proxyWithFallback('/api/resources/search/protocol', 'POST', headers, res, body);
  }

  @Get('personal-skills')
  @Version('1')
  @ApiOperation({ summary: 'List personal skills' })
  @ApiResponse({ status: 200, description: 'Personal skills retrieved successfully' })
  async listPersonalSkills(
    @Query() query: Record<string, string>,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    return this.proxyWithFallback(
      '/api/resources/personal-skills',
      'GET',
      headers,
      res,
      undefined,
      query
    );
  }

  @Get('personal-skills/:id')
  @Version('1')
  @ApiOperation({ summary: 'Get personal skill by ID' })
  @ApiResponse({ status: 200, description: 'Personal skill retrieved successfully' })
  async getPersonalSkill(
    @Param('id') id: string,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    return this.proxyWithFallback(`/api/resources/personal-skills/${id}`, 'GET', headers, res);
  }

  @Post('personal-skills')
  @Version('1')
  @ApiOperation({ summary: 'Create personal skill' })
  @ApiResponse({ status: 201, description: 'Personal skill created successfully' })
  async createPersonalSkill(
    @Body() body: any,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    return this.proxyWithFallback('/api/resources/personal-skills', 'POST', headers, res, body);
  }

  @Put('personal-skills/:id')
  @Version('1')
  @ApiOperation({ summary: 'Update personal skill' })
  @ApiResponse({ status: 200, description: 'Personal skill updated successfully' })
  async updatePersonalSkill(
    @Param('id') id: string,
    @Body() body: any,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    return this.proxyWithFallback(
      `/api/resources/personal-skills/${id}`,
      'PUT',
      headers,
      res,
      body
    );
  }

  @Delete('personal-skills/:id')
  @Version('1')
  @ApiOperation({ summary: 'Delete personal skill' })
  @ApiResponse({ status: 200, description: 'Personal skill deleted successfully' })
  async deletePersonalSkill(
    @Param('id') id: string,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    return this.proxyWithFallback(`/api/resources/personal-skills/${id}`, 'DELETE', headers, res);
  }

  @Post(':id/favorite')
  @Version('1')
  @ApiOperation({ summary: 'Favorite or unfavorite resource' })
  @ApiResponse({ status: 200, description: 'Favorite state updated successfully' })
  async favoriteResource(
    @Param('id') id: string,
    @Body() body: any,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    return this.proxyWithFallback(`/api/resources/${id}/favorite`, 'POST', headers, res, body);
  }

  @Post('share')
  @Version('1')
  @ApiOperation({ summary: 'Share resource' })
  @ApiResponse({ status: 200, description: 'Resource shared successfully' })
  async shareResource(
    @Body() body: any,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    return this.proxyWithFallback('/api/resources/share', 'POST', headers, res, body);
  }
}
