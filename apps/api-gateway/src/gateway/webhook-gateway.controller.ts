/**
 * Webhook Gateway Controller
 * Unified endpoint for webhook and SSE operations
 */

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
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { ProxyService } from '../proxy/proxy.service';

@Controller('webhooks')
@ApiTags('webhooks')
export class WebhookGatewayController {
  constructor(private readonly proxyService: ProxyService) {}

  @Post('register')
  @Version('1')
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
  @Version('1')
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
  @Version('1')
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
  @Version('1')
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
  @Version('1')
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
}
