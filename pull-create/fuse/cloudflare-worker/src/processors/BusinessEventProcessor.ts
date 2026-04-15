/**
 * Business Event Processor
 * Main processor that handles incoming webhooks and routes them to appropriate business logic processors
 */

import type { Env } from '../types/env';
import type { BusinessEvent, ProcessingResult, IntegrationSource } from '../types/business-events';
import { Logger } from '../utils/Logger';
import { StripeBusinessProcessor } from './StripeBusinessProcessor';
import { SalesforceBusinessProcessor } from './SalesforceBusinessProcessor';
import { HubSpotBusinessProcessor } from './HubSpotBusinessProcessor';
import { PayPalBusinessProcessor } from './PayPalBusinessProcessor';
import { NetSuiteBusinessProcessor } from './NetSuiteBusinessProcessor';
import { SSEBroadcaster } from '../services/SSEBroadcaster';
import { MCPActionTrigger } from '../services/MCPActionTrigger';

export class BusinessEventProcessor {
  private processors: Map<IntegrationSource, any>;
  private sseBroadcaster: SSEBroadcaster;
  private mcpTrigger: MCPActionTrigger;

  constructor(private env: Env, private logger: Logger) {
    this.sseBroadcaster = new SSEBroadcaster(env, logger);
    this.mcpTrigger = new MCPActionTrigger(env, logger);
    
    // Initialize business logic processors
    this.processors = new Map([
      ['stripe', new StripeBusinessProcessor(env, logger)],
      ['salesforce', new SalesforceBusinessProcessor(env, logger)],
      ['hubspot', new HubSpotBusinessProcessor(env, logger)],
      ['paypal', new PayPalBusinessProcessor(env, logger)],
      ['netsuite', new NetSuiteBusinessProcessor(env, logger)]
    ]);
  }

  async processWebhook(request: Request, source: string): Promise<ProcessingResult> {
    const startTime = Date.now();
    
    try {
      const payload = await request.json();
      this.logger.info(`Processing webhook from ${source}`, { payload });

      // Get the appropriate processor
      const processor = this.processors.get(source as IntegrationSource);
      if (!processor) {
        throw new Error(`No processor found for source: ${source}`);
      }

      // Process the webhook payload into a business event
      const businessEvent = await processor.processWebhook(payload);
      
      // Store the event (using Durable Objects for persistence)
      await this.storeEvent(businessEvent);

      // Trigger MCP actions based on the event
      await this.mcpTrigger.triggerActions(businessEvent);

      // Broadcast via SSE to connected clients
      await this.sseBroadcaster.broadcastEvent(businessEvent);

      // Record processing metrics
      const processingTime = Date.now() - startTime;
      await this.recordMetrics(source, processingTime, true);

      this.logger.info(`Successfully processed webhook from ${source}`, {
        eventId: businessEvent.id,
        processingTime
      });

      return {
        eventId: businessEvent.id,
        status: businessEvent.processing_status
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      await this.recordMetrics(source, processingTime, false);
      
      this.logger.error(`Failed to process webhook from ${source}:`, error);
      throw error;
    }
  }

  private async storeEvent(event: BusinessEvent): Promise<void> {
    try {
      // Store in Durable Object for persistence and consistency
      const durableObjectId = this.env.DO_BUSINESS_EVENTS.idFromName(event.metadata.organization_id);
      const durableObject = this.env.DO_BUSINESS_EVENTS.get(durableObjectId);
      
      await durableObject.fetch('https://business-events/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });

      // Also store in KV for fast retrieval
      const kvKey = `event:${event.id}`;
      await this.env.KV.put(kvKey, JSON.stringify(event), {
        expirationTtl: 86400 // 24 hours
      });

    } catch (error) {
      this.logger.error('Failed to store event:', error);
      throw error;
    }
  }

  private async recordMetrics(source: string, processingTime: number, success: boolean): Promise<void> {
    try {
      const metrics = {
        source,
        processingTime,
        success,
        timestamp: new Date().toISOString()
      };

      // Store metrics in KV
      const metricsKey = `metrics:${source}:${Date.now()}`;
      await this.env.KV.put(metricsKey, JSON.stringify(metrics), {
        expirationTtl: 604800 // 7 days
      });

      // Send to external metrics endpoint if configured
      if (this.env.METRICS_ENDPOINT) {
        await fetch(this.env.METRICS_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(metrics)
        });
      }

    } catch (error) {
      this.logger.warn('Failed to record metrics:', error);
      // Don't throw here as metrics recording shouldn't fail the main process
    }
  }

  async retryFailedEvent(eventId: string): Promise<ProcessingResult> {
    try {
      // Retrieve event from storage
      const eventData = await this.env.KV.get(`event:${eventId}`);
      if (!eventData) {
        throw new Error(`Event not found: ${eventId}`);
      }

      const event: BusinessEvent = JSON.parse(eventData);
      
      // Check retry limits
      if (event.metadata.retry_count >= event.metadata.max_retries) {
        throw new Error(`Maximum retries exceeded for event: ${eventId}`);
      }

      // Increment retry count
      event.metadata.retry_count++;
      event.processing_status = 'retrying';

      // Get the appropriate processor
      const processor = this.processors.get(event.source);
      if (!processor) {
        throw new Error(`No processor found for source: ${event.source}`);
      }

      // Retry processing
      const result = await processor.retryProcessing(event);
      
      // Update stored event
      await this.storeEvent(result);

      return {
        eventId: result.id,
        status: result.processing_status
      };

    } catch (error) {
      this.logger.error(`Failed to retry event ${eventId}:`, error);
      throw error;
    }
  }

  async getEventStatus(eventId: string): Promise<BusinessEvent | null> {
    try {
      const eventData = await this.env.KV.get(`event:${eventId}`);
      return eventData ? JSON.parse(eventData) : null;
    } catch (error) {
      this.logger.error(`Failed to get event status for ${eventId}:`, error);
      return null;
    }
  }

  async getProcessingMetrics(source?: string, timeframe?: string): Promise<any> {
    try {
      // This would typically query a time-series database
      // For now, we'll return basic metrics from KV
      const metrics = {
        totalEvents: 0,
        successRate: 0,
        averageProcessingTime: 0,
        errorRate: 0
      };

      // In a real implementation, you'd aggregate metrics from storage
      return metrics;
    } catch (error) {
      this.logger.error('Failed to get processing metrics:', error);
      throw error;
    }
  }
}