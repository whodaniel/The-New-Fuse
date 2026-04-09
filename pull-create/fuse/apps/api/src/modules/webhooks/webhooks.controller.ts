import {
  Body,
  Controller,
  Get,
  Headers,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  BusinessEventType,
  EventHistoryRequest,
  EventHistoryResponse,
  IntegrationSource,
  WebhookEventResponse,
  WebhookRegistrationRequest,
  WebhookRegistrationResponse,
  WebhookStatusResponse,
} from '@the-new-fuse/types';
import { Response } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { BusinessEventService } from './services/business-event.service';
import { SSEService } from './services/sse.service';
import { WebhooksService } from './webhooks.service';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly webhooksService: WebhooksService,
    private readonly businessEventService: BusinessEventService,
    private readonly sseService: SSEService
  ) {}

  @Post('register')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register a new webhook configuration' })
  @ApiResponse({ status: 201, description: 'Webhook registered successfully' })
  async registerWebhook(
    @Body() request: WebhookRegistrationRequest
  ): Promise<WebhookRegistrationResponse> {
    try {
      return await this.webhooksService.registerWebhook(request);
    } catch (error) {
      this.logger.error('Failed to register webhook', error);
      throw new HttpException('Failed to register webhook', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('incoming/:source')
  @ApiOperation({ summary: 'Handle incoming webhook from integration source' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleWebhook(
    @Param('source') source: IntegrationSource,
    @Body() payload: any,
    @Headers() headers: Record<string, string>
  ): Promise<WebhookEventResponse> {
    try {
      const signature = this.extractSignature(headers, source);
      return await this.webhooksService.handleWebhook(source, payload, signature);
    } catch (error) {
      this.logger.error(`Failed to handle webhook from ${source}`, error);
      throw new HttpException('Failed to process webhook', HttpStatus.BAD_REQUEST);
    }
  }

  @Get('status/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get webhook configuration status' })
  @ApiResponse({ status: 200, description: 'Webhook status retrieved' })
  async getWebhookStatus(@Param('id') id: string): Promise<WebhookStatusResponse> {
    try {
      return await this.webhooksService.getWebhookStatus(id);
    } catch (error) {
      this.logger.error(`Failed to get webhook status for ${id}`, error);
      throw new HttpException('Failed to retrieve webhook status', HttpStatus.NOT_FOUND);
    }
  }

  @Get('events/history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get event history for organization' })
  @ApiResponse({ status: 200, description: 'Event history retrieved' })
  async getEventHistory(
    @Query() request: EventHistoryRequest,
    @Req() req: any
  ): Promise<EventHistoryResponse> {
    try {
      const organizationId = req.user.organizationId;
      return (await this.businessEventService.getEventHistory(
        organizationId,
        request
      )) as unknown as EventHistoryResponse;
    } catch (error) {
      this.logger.error('Failed to get event history', error);
      throw new HttpException('Failed to retrieve event history', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('events/stream')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Stream real-time events via SSE' })
  @ApiResponse({ status: 200, description: 'SSE stream established' })
  async streamEvents(
    @Req() req: any,
    @Res() res: Response,
    @Query('event_types') eventTypes?: string,
    @Query('filters') filters?: string
  ): Promise<void> {
    try {
      const userId = req.user.id;
      const organizationId = req.user.organizationId;
      const clientId = `${userId}-${Date.now()}`;

      // Parse query parameters
      const parsedEventTypes = eventTypes ? eventTypes.split(',') : [];
      const parsedFilters = filters ? JSON.parse(filters) : {};

      // Set up SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      });

      // Add client to SSE service
      await this.sseService.addClient({
        id: clientId,
        userId,
        organizationId,
        eventTypes: parsedEventTypes.map((type) => type as BusinessEventType),
        filters: parsedFilters,
        connectedAt: new Date(),
        response: res as any,
      });

      // Handle client disconnect
      req.on('close', async () => {
        await this.sseService.removeClient(clientId);
      });

      // Send initial connection confirmation
      res.write(`data: ${JSON.stringify({ type: 'connection', status: 'connected' })}\n\n`);

      // Keep connection alive with periodic heartbeats
      const heartbeatInterval = setInterval(() => {
        res.write(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: new Date() })}\n\n`);
      }, 30000);

      req.on('close', () => {
        clearInterval(heartbeatInterval);
      });
    } catch (error) {
      this.logger.error('Failed to establish SSE connection', error);
      res.status(500).json({ error: 'Failed to establish SSE connection' });
    }
  }

  @Post('events/:id/retry')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retry failed event processing' })
  @ApiResponse({ status: 200, description: 'Event retry initiated' })
  async retryEvent(@Param('id') eventId: string): Promise<{ success: boolean }> {
    try {
      await this.businessEventService.retryFailedEvent(eventId);
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to retry event ${eventId}`, error);
      throw new HttpException('Failed to retry event', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private extractSignature(headers: Record<string, string>, source: IntegrationSource): string {
    const signatureHeaders = {
      [IntegrationSource.STRIPE]: 'stripe-signature',
      [IntegrationSource.PAYPAL]: 'paypal-transmission-sig',
      [IntegrationSource.SALESFORCE]: 'x-salesforce-webhook-signature',
      [IntegrationSource.HUBSPOT]: 'x-hubspot-signature',
      [IntegrationSource.PIPEDRIVE]: 'x-pipedrive-signature',
      [IntegrationSource.SQUARE]: 'x-square-signature',
      [IntegrationSource.NETSUITE]: 'x-netsuite-signature',
      [IntegrationSource.SAP]: 'x-sap-signature',
      [IntegrationSource.QUICKBOOKS]: 'intuit-signature',
      [IntegrationSource.ZAPIER]: 'x-zapier-signature',
      [IntegrationSource.WORKATO]: 'x-workato-signature',
      [IntegrationSource.POWER_AUTOMATE]: 'x-ms-signature',
    };

    const headerName = signatureHeaders[source];
    if (!headerName) {
      throw new Error(`Unknown integration source: ${source}`);
    }

    const signature = headers[headerName] || headers[headerName.toLowerCase()];
    if (!signature) {
      throw new Error(`Missing signature header: ${headerName}`);
    }

    return signature;
  }
}
