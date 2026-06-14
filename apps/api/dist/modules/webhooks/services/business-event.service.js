"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var BusinessEventService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessEventService = void 0;
// @ts-nocheck
/**
 * Business Event Service - Migrated to Drizzle ORM
 * Handles business event creation and processing
 */
const common_1 = require("@nestjs/common");
const database_1 = require("@the-new-fuse/database");
const types_1 = require("@the-new-fuse/types");
let BusinessEventService = BusinessEventService_1 = class BusinessEventService {
    constructor(db) {
        this.db = db;
        this.logger = new common_1.Logger(BusinessEventService_1.name);
    }
    async createEvent(eventData) {
        const event = await this.db.webhooks.createBusinessEvent({
            type: eventData.type,
            source: eventData.source,
            organizationId: eventData.organizationId,
            userId: eventData.userId,
            correlationId: eventData.correlationId,
            data: eventData.data,
            metadata: eventData.metadata || {},
            processingStatus: types_1.ProcessingStatus.PENDING,
            retryCount: 0,
        });
        this.logger.log(`Business event created: ${event.id} (${event.type})`);
        return event;
    }
    async processEvent(eventId) {
        const event = await this.db.webhooks.findBusinessEventById(eventId);
        if (!event) {
            throw new Error(`Event not found: ${eventId}`);
        }
        const startTime = Date.now();
        try {
            // Update status to processing
            await this.db.webhooks.updateBusinessEventStatus(eventId, types_1.ProcessingStatus.PROCESSING);
            // Process based on event type
            await this.processEventByType(event);
            // Mark as completed
            await this.db.webhooks.updateBusinessEventStatus(eventId, types_1.ProcessingStatus.COMPLETED, new Date());
            const processingTime = Date.now() - startTime;
            this.logger.log(`Event ${eventId} processed successfully in ${processingTime}ms`);
        }
        catch (error) {
            this.logger.error(`Failed to process event ${eventId}`, error);
            // Increment retry count
            await this.db.webhooks.incrementRetryCount(eventId);
            // Update status to failed
            await this.db.webhooks.updateBusinessEventStatus(eventId, types_1.ProcessingStatus.FAILED);
        }
    }
    async processEventByType(event) {
        switch (event.type) {
            case types_1.BusinessEventType.LEAD_CREATED:
                await this.processLeadCreated(event);
                break;
            case types_1.BusinessEventType.PAYMENT_RECEIVED:
                await this.processPaymentReceived(event);
                break;
            case types_1.BusinessEventType.INVOICE_GENERATED:
                await this.processInvoiceGenerated(event);
                break;
            case types_1.BusinessEventType.WORKFLOW_TRIGGERED:
                await this.processWorkflowTriggered(event);
                break;
            case types_1.BusinessEventType.CUSTOMER_UPDATED:
                await this.processCustomerUpdated(event);
                break;
            case types_1.BusinessEventType.PRODUCT_SOLD:
                await this.processProductSold(event);
                break;
            case types_1.BusinessEventType.SUBSCRIPTION_CHANGED:
                await this.processSubscriptionChanged(event);
                break;
            default:
                this.logger.warn(`Unknown event type: ${event.type}`);
        }
    }
    async processLeadCreated(event) {
        this.logger.log(`Processing lead_created event: ${event.id}`);
    }
    async processPaymentReceived(event) {
        this.logger.log(`Processing payment_received event: ${event.id}`);
    }
    async processInvoiceGenerated(event) {
        this.logger.log(`Processing invoice_generated event: ${event.id}`);
    }
    async processWorkflowTriggered(event) {
        this.logger.log(`Processing workflow_triggered event: ${event.id}`);
    }
    async processCustomerUpdated(event) {
        this.logger.log(`Processing customer_updated event: ${event.id}`);
    }
    async processProductSold(event) {
        this.logger.log(`Processing product_sold event: ${event.id}`);
    }
    async processSubscriptionChanged(event) {
        this.logger.log(`Processing subscription_changed event: ${event.id}`);
    }
    async getEventHistory(organizationId, request) {
        const events = await this.db.webhooks.findBusinessEventsByOrganization(organizationId, request.limit || 100);
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
    async retryFailedEvent(eventId) {
        const event = await this.db.webhooks.findBusinessEventById(eventId);
        if (!event) {
            throw new Error(`Event not found: ${eventId}`);
        }
        if (event.processingStatus !== types_1.ProcessingStatus.FAILED) {
            throw new Error(`Event ${eventId} is not in failed status`);
        }
        // Reset status to pending
        await this.db.webhooks.updateBusinessEventStatus(eventId, types_1.ProcessingStatus.PENDING);
        // Process the event again
        await this.processEvent(eventId);
    }
    async getEventsByStatus(organizationId, status) {
        const allEvents = await this.db.webhooks.findBusinessEventsByOrganization(organizationId);
        return allEvents.filter((e) => e.processingStatus === status);
    }
    async getEventStats(organizationId, days = 7) {
        const events = await this.db.webhooks.findBusinessEventsByOrganization(organizationId, 1000);
        // Filter by date range
        const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const recentEvents = events.filter((e) => new Date(e.createdAt) >= cutoffDate);
        const eventsByType = {};
        const eventsByStatus = {};
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
            averageProcessingTime: processedCount > 0 ? Math.round(totalProcessingTime / processedCount) : 0,
        };
    }
};
exports.BusinessEventService = BusinessEventService;
exports.BusinessEventService = BusinessEventService = BusinessEventService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_1.DatabaseService])
], BusinessEventService);
//# sourceMappingURL=business-event.service.js.map