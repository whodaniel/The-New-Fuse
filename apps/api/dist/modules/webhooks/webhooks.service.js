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
var WebhooksService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksService = void 0;
// @ts-nocheck
/**
 * Webhooks Service - Migrated to Drizzle ORM
 * Manages webhook registrations and incoming webhook processing
 */
const common_1 = require("@nestjs/common");
const database_1 = require("@the-new-fuse/database");
const types_1 = require("@the-new-fuse/types");
const node_crypto_1 = require("node:crypto");
const business_event_service_1 = require("./services/business-event.service");
const integration_service_1 = require("./services/integration.service");
const webhook_security_service_1 = require("./services/webhook-security.service");
let WebhooksService = WebhooksService_1 = class WebhooksService {
    constructor(db, securityService, businessEventService, integrationService) {
        this.db = db;
        this.securityService = securityService;
        this.businessEventService = businessEventService;
        this.integrationService = integrationService;
        this.logger = new common_1.Logger(WebhooksService_1.name);
    }
    async registerWebhook(request) {
        try {
            // Generate webhook URL
            const webhookId = (0, node_crypto_1.randomUUID)();
            const webhookUrl = `${process.env.API_BASE_URL}/webhooks/incoming/${request.source}`;
            // Create webhook configuration
            const config = await this.db.webhooks.createWebhookConfiguration({
                id: webhookId,
                organizationId: request.organization_id || 'default',
                source: request.source,
                endpointUrl: request.endpoint_url,
                secretKey: request.secret_key,
                configuration: request.configuration || {},
                isActive: true,
            });
            this.logger.log(`Webhook registered for ${request.source}: ${config.id}`);
            return {
                id: config.id,
                status: 'registered',
                webhook_url: webhookUrl,
            };
        }
        catch (error) {
            this.logger.error('Failed to register webhook', error);
            return {
                id: '',
                status: 'error',
                webhook_url: '',
            };
        }
    }
    async handleWebhook(source, payload, signature) {
        try {
            // Get webhook configuration for source
            const config = await this.db.webhooks.findActiveWebhookBySource(source);
            if (!config) {
                throw new Error(`No active webhook configuration found for ${source}`);
            }
            // Validate webhook signature
            const isValid = await this.securityService.validateSignature(JSON.stringify(payload), signature, {
                signatureHeader: this.getSignatureHeader(source),
                secret: config.secretKey,
                algorithm: 'sha256',
                tolerance: 300, // 5 minutes
            });
            if (!isValid) {
                throw new Error('Invalid webhook signature');
            }
            // Transform payload to business event
            const businessEvent = await this.integrationService.transformToBusinessEvent(source, payload, config.organizationId);
            // Save business event
            const savedEvent = await this.businessEventService.createEvent({
                ...businessEvent,
                organizationId: config.organizationId,
            });
            // Process event asynchronously
            setImmediate(() => {
                this.businessEventService.processEvent(savedEvent.id).catch((error) => {
                    this.logger.error(`Failed to process event ${savedEvent.id}`, error);
                });
            });
            this.logger.log(`Webhook processed for ${source}: ${savedEvent.id}`);
            return {
                received: true,
                event_id: savedEvent.id,
            };
        }
        catch (error) {
            this.logger.error(`Failed to handle webhook from ${source}`, error);
            return {
                received: false,
            };
        }
    }
    async getWebhookStatus(id) {
        try {
            const config = await this.db.webhooks.findWebhookConfigurationById(id);
            if (!config) {
                throw new Error(`Webhook configuration not found: ${id}`);
            }
            // Get recent events count
            const eventCount = await this.db.webhooks.countBusinessEvents(config.organizationId);
            // Get last received event
            const lastEvent = await this.db.webhooks.findLastEventByOrganization(config.organizationId);
            return {
                id: config.id,
                status: config.isActive ? 'active' : 'inactive',
                last_received: lastEvent?.createdAt?.toISOString() || '',
                event_count: eventCount,
            };
        }
        catch (error) {
            this.logger.error(`Failed to get webhook status for ${id}`, error);
            throw error;
        }
    }
    getSignatureHeader(source) {
        const headers = {
            [types_1.IntegrationSource.STRIPE]: 'stripe-signature',
            [types_1.IntegrationSource.PAYPAL]: 'paypal-transmission-sig',
            [types_1.IntegrationSource.SALESFORCE]: 'x-salesforce-webhook-signature',
            [types_1.IntegrationSource.HUBSPOT]: 'x-hubspot-signature',
            [types_1.IntegrationSource.PIPEDRIVE]: 'x-pipedrive-signature',
            [types_1.IntegrationSource.SQUARE]: 'x-square-signature',
            [types_1.IntegrationSource.NETSUITE]: 'x-netsuite-signature',
            [types_1.IntegrationSource.SAP]: 'x-sap-signature',
            [types_1.IntegrationSource.QUICKBOOKS]: 'intuit-signature',
            [types_1.IntegrationSource.ZAPIER]: 'x-zapier-signature',
            [types_1.IntegrationSource.WORKATO]: 'x-workato-signature',
            [types_1.IntegrationSource.POWER_AUTOMATE]: 'x-ms-signature',
        };
        return headers[source] || 'x-webhook-signature';
    }
    async deactivateWebhook(id) {
        await this.db.webhooks.updateWebhookConfiguration(id, { isActive: false });
        this.logger.log(`Webhook deactivated: ${id}`);
    }
    async reactivateWebhook(id) {
        await this.db.webhooks.updateWebhookConfiguration(id, { isActive: true });
        this.logger.log(`Webhook reactivated: ${id}`);
    }
    async getWebhooksByOrganization(organizationId) {
        return this.db.webhooks.findWebhookConfigurationsByOrganization(organizationId);
    }
    async updateWebhookConfiguration(id, updates) {
        await this.db.webhooks.updateWebhookConfiguration(id, updates);
        this.logger.log(`Webhook configuration updated: ${id}`);
    }
    async deleteWebhook(id) {
        await this.db.webhooks.deleteWebhookConfiguration(id);
        this.logger.log(`Webhook deleted: ${id}`);
    }
    async getWebhookMetrics(organizationId) {
        const totalWebhooks = await this.db.webhooks.countWebhookConfigurations(organizationId);
        const activeWebhooks = await this.db.webhooks.countWebhookConfigurations(organizationId, true);
        const totalEvents = await this.db.webhooks.countBusinessEvents(organizationId);
        const failedEvents = await this.db.webhooks.countBusinessEvents(organizationId, types_1.ProcessingStatus.FAILED);
        // Calculate average processing latency - simplified
        const recentEvents = await this.db.webhooks.findBusinessEventsByStatus(types_1.ProcessingStatus.COMPLETED, 100);
        const processingLatency = recentEvents.reduce((acc, event) => {
            if (event.processedAt) {
                const latency = new Date(event.processedAt).getTime() - new Date(event.createdAt).getTime();
                return acc + latency;
            }
            return acc;
        }, 0) / Math.max(recentEvents.length, 1);
        return {
            totalWebhooks,
            activeWebhooks,
            totalEvents,
            failedEvents,
            processingLatency: Math.round(processingLatency),
        };
    }
};
exports.WebhooksService = WebhooksService;
exports.WebhooksService = WebhooksService = WebhooksService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_1.DatabaseService,
        webhook_security_service_1.WebhookSecurityService,
        business_event_service_1.BusinessEventService,
        integration_service_1.IntegrationService])
], WebhooksService);
//# sourceMappingURL=webhooks.service.js.map