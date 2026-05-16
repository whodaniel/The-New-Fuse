import { All, Body, Controller, Get, Headers, HttpStatus, Query, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ProxyService } from '../proxy/proxy.service';

@ApiTags('timeline')
@Controller(['timeline', 'unified-ledger/timeline'])
export class TimelineGatewayController {
  constructor(private readonly proxyService: ProxyService) {}

  private readonly timelinePathBases = ['/api/unified-ledger/timeline', '/api/timeline'] as const;
  private readonly timelineServices = ['api', 'agents'] as const;

  private shouldTryFallback(status: number): boolean {
    return status === 404 || status === 405 || status === 502 || status === 503 || status === 504;
  }

  private async proxyTimelineWithFallback(
    suffix: string,
    method: string,
    headers: Record<string, string>,
    body?: any,
    query?: Record<string, string>
  ) {
    let lastResponse: { status: number; data: unknown } | null = null;
    const normalizedSuffix = suffix ? (suffix.startsWith('/') ? suffix : `/${suffix}`) : '';
    for (const serviceName of this.timelineServices) {
      for (const base of this.timelinePathBases) {
        const response = await this.proxyService.proxyRequest(
          serviceName,
          `${base}${normalizedSuffix}`,
          method,
          headers,
          body,
          query
        );
        lastResponse = response;
        if (response.status < 400 || !this.shouldTryFallback(response.status)) {
          return response;
        }
      }
    }

    return lastResponse;
  }

  private extractTimelineSuffix(originalUrl: string): string {
    const withoutQuery = originalUrl.split('?')[0] || '';
    const match = withoutQuery.match(
      /^\/api(?:\/v\d+)?\/(?:timeline|unified-ledger\/timeline)(.*)$/
    );
    let suffix = match ? match[1] : '';

    if (!suffix) {
      return '';
    }

    return suffix.startsWith('/') ? suffix : `/${suffix}`;
  }

  @Get('macro')
  @ApiOperation({ summary: 'Compatibility endpoint for timeline macro view' })
  async getTimelineMacroView(
    @Query() query: Record<string, string>,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    try {
      const response = await this.proxyTimelineWithFallback(
        '/events',
        'GET',
        headers,
        undefined,
        query
      );
      if (!response) {
        throw new Error('No response from timeline upstream');
      }
      return res.status(response.status).json(response.data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return res.status(HttpStatus.BAD_GATEWAY).json({
        message: 'Timeline service unavailable',
        error: errorMessage,
      });
    }
  }

  @All('*path')
  @ApiOperation({ summary: 'Proxy timeline requests to the API service' })
  async proxyTimelineRequest(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: any,
    @Query() query: Record<string, string>,
    @Headers() headers: Record<string, string>
  ) {
    const originalUrl = req.originalUrl || req.url || '';
    const suffix = this.extractTimelineSuffix(originalUrl);

    try {
      const response = await this.proxyTimelineWithFallback(
        suffix,
        req.method,
        headers,
        body,
        query
      );
      if (!response) {
        throw new Error('No response from timeline upstream');
      }
      return res.status(response.status).json(response.data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return res.status(HttpStatus.BAD_GATEWAY).json({
        message: 'Timeline service unavailable',
        error: errorMessage,
      });
    }
  }
}
