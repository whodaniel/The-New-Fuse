/**
 * Webhook Gateway Controller
 * Unified endpoint for webhook and SSE operations
 */

import {
  All,
  Body,
  Controller,
  Get,
  Headers,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ProxyService } from '../proxy/proxy.service';

@Controller('webhooks')
@ApiTags('webhooks')
export class WebhookGatewayController {
  constructor(private readonly proxyService: ProxyService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new webhook configuration' })
  @ApiResponse({ status: 201, description: 'Webhook registered successfully' })
  async registerWebhook(
    @Body() body: any,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    try {
      const response = await this.proxyService.proxyRequest(
        'webhooks',
        '/webhooks/register',
        'POST',
        headers,
        body
      );
      return res.status(response.status).json(response.data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return res.status(HttpStatus.BAD_GATEWAY).json({
        message: 'Webhook service unavailable',
        error: errorMessage,
      });
    }
  }

  @Post('incoming/:source')
  @ApiOperation({ summary: 'Handle incoming webhook from integration source' })
  @ApiParam({ name: 'source', description: 'Integration source platform' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleWebhook(
    @Param('source') source: string,
    @Body() body: any,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    try {
      const response = await this.proxyService.proxyRequest(
        'webhooks',
        `/webhooks/incoming/${source}`,
        'POST',
        headers,
        body
      );
      return res.status(response.status).json(response.data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return res.status(HttpStatus.BAD_GATEWAY).json({
        message: 'Webhook service unavailable',
        error: errorMessage,
      });
    }
  }

  @Get('status/:id')
  @ApiOperation({ summary: 'Get webhook configuration status' })
  @ApiParam({ name: 'id', description: 'Webhook configuration ID' })
  @ApiResponse({ status: 200, description: 'Webhook status retrieved successfully' })
  async getWebhookStatus(
    @Param('id') id: string,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    try {
      const response = await this.proxyService.proxyRequest(
        'webhooks',
        `/webhooks/status/${id}`,
        'GET',
        headers
      );
      return res.status(response.status).json(response.data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return res.status(HttpStatus.BAD_GATEWAY).json({
        message: 'Webhook service unavailable',
        error: errorMessage,
      });
    }
  }

  @Get('events/history')
  @ApiOperation({ summary: 'Get event history for organization' })
  @ApiQuery({ name: 'start_date', required: true, description: 'Start date (ISO 8601)' })
  @ApiQuery({ name: 'end_date', required: true, description: 'End date (ISO 8601)' })
  @ApiResponse({ status: 200, description: 'Event history retrieved successfully' })
  async getEventHistory(
    @Query() query: Record<string, string>,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    try {
      const response = await this.proxyService.proxyRequest(
        'webhooks',
        '/webhooks/events/history',
        'GET',
        headers,
        undefined,
        query
      );
      return res.status(response.status).json(response.data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return res.status(HttpStatus.BAD_GATEWAY).json({
        message: 'Webhook service unavailable',
        error: errorMessage,
      });
    }
  }

  @Get('events/stream')
  @ApiOperation({ summary: 'Stream real-time events via SSE' })
  @ApiQuery({ name: 'event_types', required: false, description: 'Event types filter' })
  @ApiResponse({ status: 200, description: 'SSE stream established' })
  async streamEvents(
    @Query() query: Record<string, string>,
    @Headers() headers: Record<string, string>,
    @Res() res: Response
  ) {
    try {
      const response = await this.proxyService.proxyRequest(
        'webhooks',
        '/webhooks/events/stream',
        'GET',
        headers,
        undefined,
        query
      );
      return res.status(response.status).json(response.data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return res.status(HttpStatus.BAD_GATEWAY).json({
        message: 'Webhook service unavailable',
        error: errorMessage,
      });
    }
  }

  @All('*path')
  @ApiOperation({ summary: 'Proxy arbitrary webhook routes to webhook service' })
  async proxyWebhookRequest(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: any,
    @Query() query: Record<string, string>,
    @Headers() headers: Record<string, string>
  ) {
    const originalUrl = req.originalUrl || req.url || '';
    const withoutQuery = originalUrl.split('?')[0] || '';
    const match = withoutQuery.match(/^\/api(?:\/v\d+)?\/webhooks(.*)$/);
    let suffix = match ? match[1] : '';

    if (!suffix) {
      suffix = '';
    } else if (!suffix.startsWith('/')) {
      suffix = `/${suffix}`;
    }

    try {
      const response = await this.proxyService.proxyRequest(
        'webhooks',
        `/webhooks${suffix}`,
        req.method,
        headers,
        body,
        query
      );
      return res.status(response.status).json(response.data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return res.status(HttpStatus.BAD_GATEWAY).json({
        message: 'Webhook service unavailable',
        error: errorMessage,
      });
    }
  }
}
