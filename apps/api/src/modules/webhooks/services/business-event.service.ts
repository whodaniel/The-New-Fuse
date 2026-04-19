// @ts-nocheck
/**
 * Business Event Service - Migrated to Drizzle ORM
 * Handles business event creation and processing
 */
import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@the-new-fuse/database';
import { BusinessEventType, ProcessingStatus } from '@the-new-fuse/types';

// Internal types for this service
interface CreateBusinessEventData {
  type: string;
  source: string;
  organizationId: string;
  userId?: string;
  correlationId?: string;
  data: any;
  metadata?: any;
}

interface BusinessEventHistoryRequest {
  limit?: number;
  eventTypes?: string[];
  status?: string;
}

interface BusinessEventHistoryResponse {
  events: any[];
  total: number;
}

// Internal type matching the Drizzle schema
type BusinessEventEntity = {
  id: string;
  type: string;
  source: string;
  organizationId: string;
  userId?: string | null;
  correlationId?: string | null;
  data: unknown;
  metadata: unknown;
  processingStatus: string;
  retryCount: number;
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date | null;
};

@Injectable()
export class BusinessEventService {
  private readonly logger = new Logger(BusinessEventService.name);

  constructor(private readonly db: DatabaseService) {}

  async createEvent(eventData: CreateBusinessEventData): Promise<BusinessEventEntity> {
    const event = await this.db.webhooks.createBusinessEvent({
      type: eventData.type,
      source: eventData.source,
      organizationId: eventData.organizationId,
      userId: eventData.userId,
      correlationId: eventData.correlationId,
      data: eventData.data,
      metadata: eventData.metadata || {},
      processingStatus: ProcessingStatus.PENDING,
      retryCount: 0,
    });

    this.logger.log(`Business event created: ${event.id} (${event.type})`);

    return event;
  }

  async processEvent(eventId: string): Promise<void> {
    const event = await this.db.webhooks.findBusinessEventById(eventId);

    if (!event) {
      throw new Error(`Event not found: ${eventId}`);
    }

    const startTime = Date.now();

    try {
      // Update status to processing
      await this.db.webhooks.updateBusinessEventStatus(eventId, ProcessingStatus.PROCESSING);

      // Process based on event type
      await this.processEventByType(event);

      // Mark as completed
      await this.db.webhooks.updateBusinessEventStatus(
        eventId,
        ProcessingStatus.COMPLETED,
        new Date()
      );

      const processingTime = Date.now() - startTime;
      this.logger.log(`Event ${eventId} processed successfully in ${processingTime}ms`);
    } catch (error) {
      this.logger.error(`Failed to process event ${eventId}`, error);

      // Increment retry count
      await this.db.webhooks.incrementRetryCount(eventId);

      // Update status to failed
      await this.db.webhooks.updateBusinessEventStatus(eventId, ProcessingStatus.FAILED);
    }
  }

  private async processEventByType(event: BusinessEventEntity): Promise<void> {
    switch (event.type) {
      case BusinessEventType.LEAD_CREATED:
        await this.processLeadCreated(event);
        break;
      case BusinessEventType.PAYMENT_RECEIVED:
        await this.processPaymentReceived(event);
        break;
      case BusinessEventType.INVOICE_GENERATED:
        await this.processInvoiceGenerated(event);
        break;
      case BusinessEventType.WORKFLOW_TRIGGERED:
        await this.processWorkflowTriggered(event);
        break;
      case BusinessEventType.CUSTOMER_UPDATED:
        await this.processCustomerUpdated(event);
        break;
      case BusinessEventType.PRODUCT_SOLD:
        await this.processProductSold(event);
        break;
      case BusinessEventType.SUBSCRIPTION_CHANGED:
        await this.processSubscriptionChanged(event);
        break;
      default:
        this.logger.warn(`Unknown event type: ${event.type}`);
    }
  }

  private async processLeadCreated(event: BusinessEventEntity): Promise<void> {
    this.logger.log(`Processing lead_created event: ${event.id}`);
  }

  private async processPaymentReceived(event: BusinessEventEntity): Promise<void> {
    this.logger.log(`Processing payment_received event: ${event.id}`);
  }

  private async processInvoiceGenerated(event: BusinessEventEntity): Promise<void> {
    this.logger.log(`Processing invoice_generated event: ${event.id}`);
  }

  private async processWorkflowTriggered(event: BusinessEventEntity): Promise<void> {
    this.logger.log(`Processing workflow_triggered event: ${event.id}`);
  }

  private async processCustomerUpdated(event: BusinessEventEntity): Promise<void> {
    this.logger.log(`Processing customer_updated event: ${event.id}`);
  }

  private async processProductSold(event: BusinessEventEntity): Promise<void> {
    this.logger.log(`Processing product_sold event: ${event.id}`);
  }

  private async processSubscriptionChanged(event: BusinessEventEntity): Promise<void> {
    this.logger.log(`Processing subscription_changed event: ${event.id}`);
  }

  async getEventHistory(
    organizationId: string,
    request: BusinessEventHistoryRequest
  ): Promise<BusinessEventHistoryResponse> {
    const events = await this.db.webhooks.findBusinessEventsByOrganization(
      organizationId,
      request.limit || 100
    );

    // Filter by type if specified
    let filteredEvents = events;
    if (request.eventTypes && request.eventTypes.length > 0) {
      filteredEvents = events.filter((e) => request.eventTypes?.includes(e.type));
    }

    // Filter by status if specified
    if (request.status) {
      filteredEvents = filteredEvents.filter((e) => e.processingStatus === request.status);
    }

    return {
      events: filteredEvents,
      total: filteredEvents.length,
    };
  }

  async retryFailedEvent(eventId: string): Promise<void> {
    const event = await this.db.webhooks.findBusinessEventById(eventId);

    if (!event) {
      throw new Error(`Event not found: ${eventId}`);
    }

    if (event.processingStatus !== ProcessingStatus.FAILED) {
      throw new Error(`Event ${eventId} is not in failed status`);
    }

    // Reset status to pending
    await this.db.webhooks.updateBusinessEventStatus(eventId, ProcessingStatus.PENDING);

    // Process the event again
    await this.processEvent(eventId);
  }

  async getEventsByStatus(organizationId: string, status: string): Promise<BusinessEventEntity[]> {
    const allEvents = await this.db.webhooks.findBusinessEventsByOrganization(organizationId);
    return allEvents.filter((e) => e.processingStatus === status);
  }

  async getEventStats(
    organizationId: string,
    days: number = 7
  ): Promise<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsByStatus: Record<string, number>;
    averageProcessingTime: number;
  }> {
    const events = await this.db.webhooks.findBusinessEventsByOrganization(organizationId, 1000);

    // Filter by date range
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const recentEvents = events.filter((e) => new Date(e.createdAt) >= cutoffDate);

    const eventsByType: Record<string, number> = {};
    const eventsByStatus: Record<string, number> = {};
    let totalProcessingTime = 0;
    let processedCount = 0;

    for (const event of recentEvents) {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      eventsByStatus[event.processingStatus] = (eventsByStatus[event.processingStatus] || 0) + 1;

      if (event.processedAt && event.createdAt) {
        totalProcessingTime +=
          new Date(event.processedAt).getTime() - new Date(event.createdAt).getTime();
        processedCount++;
      }
    }

    return {
      totalEvents: recentEvents.length,
      eventsByType,
      eventsByStatus,
      averageProcessingTime:
        processedCount > 0 ? Math.round(totalProcessingTime / processedCount) : 0,
    };
  }
}
