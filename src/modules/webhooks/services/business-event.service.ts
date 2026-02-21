import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  BusinessEvent as IBusinessEvent,
  EventHistoryRequest,
  EventHistoryResponse,
  ProcessingStatus,
  BusinessEventType,
  EventPriority,
} from '@the-new-fuse/types';
import { BusinessEvent } from '../entities/business-event.entity';
import { SSEService } from './sse.service';

@Injectable()
export class BusinessEventService {
  private readonly logger = new Logger(BusinessEventService.name);

  constructor(
    @InjectRepository(BusinessEvent)
    private readonly businessEventRepo: Repository<BusinessEvent>,
    private readonly sseService: SSEService,
  ) {}

  async createEvent(eventData: Omit<IBusinessEvent, 'id' | 'timestamp'>): Promise<BusinessEvent> {
    try {
      const event = this.businessEventRepo.create({
        id: uuidv4(),
        type: eventData.type,
        source: eventData.source,
        organizationId: eventData.metadata.organization_id,
        userId: eventData.metadata.user_id,
        correlationId: eventData.metadata.correlation_id,
        data: eventData.data,
        metadata: eventData.metadata,
        processingStatus: ProcessingStatus.PENDING,
        retryCount: 0,
      });

      const savedEvent = await this.businessEventRepo.save(event);
      
      this.logger.log(`Business event created: ${savedEvent.id} (${savedEvent.type})`);
      
      return savedEvent;
    } catch (error) {
      this.logger.error('Failed to create business event', error);
      throw error;
    }
  }

  async processEvent(eventId: string): Promise<void> {
    try {
      const event = await this.businessEventRepo.findOne({ where: { id: eventId } });
      
      if (!event) {
        throw new Error(`Event not found: ${eventId}`);
      }

      if (event.processingStatus !== ProcessingStatus.PENDING) {
        this.logger.warn(`Event ${eventId} is not in pending status, skipping processing`);
        return;
      }

      // Update status to processing
      await this.businessEventRepo.update(eventId, {
        processingStatus: ProcessingStatus.PROCESSING,
      });

      // Process based on event type
      await this.processEventByType(event);

      // Broadcast event via SSE
      await this.sseService.broadcastEvent(event);

      // Update status to completed
      await this.businessEventRepo.update(eventId, {
        processingStatus: ProcessingStatus.COMPLETED,
        processedAt: new Date(),
      });

      this.logger.log(`Event processed successfully: ${eventId}`);
    } catch (error) {
      this.logger.error(`Failed to process event ${eventId}`, error);
      
      // Update status to failed and increment retry count
      const event = await this.businessEventRepo.findOne({ where: { id: eventId } });
      if (event) {
        await this.businessEventRepo.update(eventId, {
          processingStatus: ProcessingStatus.FAILED,
          retryCount: event.retryCount + 1,
        });
      }
      
      throw error;
    }
  }

  private async processEventByType(event: BusinessEvent): Promise<void> {
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

  private async processLeadCreated(event: BusinessEvent): Promise<void> {
    this.logger.log(`Processing lead created event: ${event.id}`);
    // Implement lead processing logic
    // - Update CRM records
    // - Trigger email sequences
    // - Assign to sales rep
    // - Generate notifications
  }

  private async processPaymentReceived(event: BusinessEvent): Promise<void> {
    this.logger.log(`Processing payment received event: ${event.id}`);
    // Implement payment processing logic
    // - Update billing records
    // - Send payment confirmations
    // - Update subscription status
    // - Generate revenue analytics
  }

  private async processInvoiceGenerated(event: BusinessEvent): Promise<void> {
    this.logger.log(`Processing invoice generated event: ${event.id}`);
    // Implement invoice processing logic
    // - Send invoice notifications
    // - Update accounting records
    // - Schedule payment reminders
  }

  private async processWorkflowTriggered(event: BusinessEvent): Promise<void> {
    this.logger.log(`Processing workflow triggered event: ${event.id}`);
    // Implement workflow processing logic
    // - Execute workflow steps
    // - Update workflow state
    // - Handle conditions and branches
  }

  private async processCustomerUpdated(event: BusinessEvent): Promise<void> {
    this.logger.log(`Processing customer updated event: ${event.id}`);
    // Implement customer update processing logic
    // - Sync across systems
    // - Update customer segments
    // - Trigger personalization updates
  }

  private async processProductSold(event: BusinessEvent): Promise<void> {
    this.logger.log(`Processing product sold event: ${event.id}`);
    // Implement product sale processing logic
    // - Update inventory
    // - Generate fulfillment orders
    // - Update sales analytics
    // - Trigger upsell workflows
  }

  private async processSubscriptionChanged(event: BusinessEvent): Promise<void> {
    this.logger.log(`Processing subscription changed event: ${event.id}`);
    // Implement subscription change processing logic
    // - Update billing cycles
    // - Adjust service levels
    // - Send change confirmations
    // - Update revenue forecasts
  }

  async getEventHistory(
    organizationId: string,
    request: EventHistoryRequest,
  ): Promise<EventHistoryResponse> {
    try {
      const { start_date, end_date, event_types, limit = 50 } = request;
      
      const queryBuilder = this.businessEventRepo
        .createQueryBuilder('event')
        .where('event.organizationId = :organizationId', { organizationId });

      // Add date filtering
      if (start_date && end_date) {
        queryBuilder.andWhere('event.createdAt BETWEEN :startDate AND :endDate', {
          startDate: new Date(start_date),
          endDate: new Date(end_date),
        });
      }

      // Add event type filtering
      if (event_types) {
        const types = event_types.split(',');
        queryBuilder.andWhere('event.type IN (:...types)', { types });
      }

      // Apply limit and ordering
      queryBuilder
        .orderBy('event.createdAt', 'DESC')
        .limit(limit);

      const [events, total] = await queryBuilder.getManyAndCount();

      return {
        events: events.map(this.mapEntityToInterface),
        total,
        has_more: total > limit,
      };
    } catch (error) {
      this.logger.error('Failed to get event history', error);
      throw error;
    }
  }

  async retryFailedEvent(eventId: string): Promise<void> {
    try {
      const event = await this.businessEventRepo.findOne({ where: { id: eventId } });
      
      if (!event) {
        throw new Error(`Event not found: ${eventId}`);
      }

      if (event.processingStatus !== ProcessingStatus.FAILED) {
        throw new Error(`Event ${eventId} is not in failed status`);
      }

      if (event.retryCount >= 3) {
        throw new Error(`Event ${eventId} has exceeded maximum retry attempts`);
      }

      // Reset status to pending for retry
      await this.businessEventRepo.update(eventId, {
        processingStatus: ProcessingStatus.PENDING,
      });

      // Process the event
      await this.processEvent(eventId);

      this.logger.log(`Event retry successful: ${eventId}`);
    } catch (error) {
      this.logger.error(`Failed to retry event ${eventId}`, error);
      throw error;
    }
  }

  async getEventsByStatus(
    organizationId: string,
    status: ProcessingStatus,
  ): Promise<BusinessEvent[]> {
    return this.businessEventRepo.find({
      where: { organizationId, processingStatus: status },
      order: { createdAt: 'DESC' },
    });
  }

  async getEventStats(organizationId: string, days: number = 7): Promise<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsByStatus: Record<string, number>;
    averageProcessingTime: number;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const events = await this.businessEventRepo.find({
      where: {
        organizationId,
        createdAt: Between(startDate, new Date()),
      },
    });

    const eventsByType: Record<string, number> = {};
    const eventsByStatus: Record<string, number> = {};
    let totalProcessingTime = 0;
    let processedEventsCount = 0;

    events.forEach(event => {
      // Count by type
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      
      // Count by status
      eventsByStatus[event.processingStatus] = (eventsByStatus[event.processingStatus] || 0) + 1;
      
      // Calculate processing time for completed events
      if (event.processedAt && event.processingStatus === ProcessingStatus.COMPLETED) {
        const processingTime = event.processedAt.getTime() - event.createdAt.getTime();
        totalProcessingTime += processingTime;
        processedEventsCount++;
      }
    });

    const averageProcessingTime = processedEventsCount > 0 
      ? totalProcessingTime / processedEventsCount 
      : 0;

    return {
      totalEvents: events.length,
      eventsByType,
      eventsByStatus,
      averageProcessingTime: Math.round(averageProcessingTime),
    };
  }

  private mapEntityToInterface(entity: BusinessEvent): IBusinessEvent {
    return {
      id: entity.id,
      type: entity.type as BusinessEventType,
      source: entity.source as any,
      timestamp: entity.createdAt,
      data: entity.data,
      metadata: {
        ...entity.metadata,
        correlation_id: entity.correlationId || '',
        user_id: entity.userId,
        organization_id: entity.organizationId,
        priority: EventPriority.MEDIUM,
        retry_count: entity.retryCount,
        max_retries: 3,
      },
      processing_status: entity.processingStatus as ProcessingStatus,
    };
  }
}