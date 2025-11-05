var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var WebhooksService_1;
var _a, _b, _c;
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { IntegrationSource, ProcessingStatus, } from '@the-new-fuse/types';
import { WebhookConfiguration } from './entities/webhook-configuration.entity';
import { BusinessEvent } from './entities/business-event.entity';
import { WebhookSecurityService } from './services/webhook-security.service';
import { BusinessEventService } from './services/business-event.service';
import { IntegrationService } from './services/integration.service';
let WebhooksService = WebhooksService_1 = class WebhooksService {
    webhookConfigRepo;
    businessEventRepo;
    securityService;
    businessEventService;
    integrationService;
    logger = new Logger(WebhooksService_1.name);
    constructor(webhookConfigRepo, businessEventRepo, securityService, businessEventService, integrationService) {
        this.webhookConfigRepo = webhookConfigRepo;
        this.businessEventRepo = businessEventRepo;
        this.securityService = securityService;
        this.businessEventService = businessEventService;
        this.integrationService = integrationService;
    }
    async registerWebhook(request) {
        try {
            // Generate webhook URL
            const webhookId = uuidv4();
            const webhookUrl = `${process.env.API_BASE_URL}/webhooks/incoming/${request.source}`;
            // Create webhook configuration
            const config = this.webhookConfigRepo.create({
                id: webhookId,
                organizationId: request.organization_id || 'default', // TODO: Get from auth context
                source: request.source,
                endpointUrl: request.endpoint_url,
                secretKey: request.secret_key,
                configuration: request.configuration,
                isActive: true,
            });
            await this.webhookConfigRepo.save(config);
            this.logger.log(`Webhook registered for ${request.source}: ${webhookId}`);
            return {
                id: webhookId,
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
            const config = await this.webhookConfigRepo.findOne({
                where: { source, isActive: true },
            });
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
            const savedEvent = await this.businessEventService.createEvent(businessEvent);
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
            const config = await this.webhookConfigRepo.findOne({
                where: { id },
            });
            if (!config) {
                throw new Error(`Webhook configuration not found: ${id}`);
            }
            // Get recent events count
            const eventCount = await this.businessEventRepo.count({
                where: { organizationId: config.organizationId },
            });
            // Get last received event
            const lastEvent = await this.businessEventRepo.findOne({
                where: { organizationId: config.organizationId },
                order: { createdAt: 'DESC' },
            });
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
        return headers[source] || 'x-webhook-signature';
    }
    async deactivateWebhook(id) {
        await this.webhookConfigRepo.update(id, { isActive: false });
        this.logger.log(`Webhook deactivated: ${id}`);
    }
    async reactivateWebhook(id) {
        await this.webhookConfigRepo.update(id, { isActive: true });
        this.logger.log(`Webhook reactivated: ${id}`);
    }
    async getWebhooksByOrganization(organizationId) {
        return this.webhookConfigRepo.find({
            where: { organizationId },
            order: { createdAt: 'DESC' },
        });
    }
    async updateWebhookConfiguration(id, updates) {
        await this.webhookConfigRepo.update(id, {
            ...updates,
            updatedAt: new Date(),
        });
        this.logger.log(`Webhook configuration updated: ${id}`);
    }
    async deleteWebhook(id) {
        await this.webhookConfigRepo.delete(id);
        this.logger.log(`Webhook deleted: ${id}`);
    }
    async getWebhookMetrics(organizationId) {
        const totalWebhooks = await this.webhookConfigRepo.count({
            where: { organizationId },
        });
        const activeWebhooks = await this.webhookConfigRepo.count({
            where: { organizationId, isActive: true },
        });
        const totalEvents = await this.businessEventRepo.count({
            where: { organizationId },
        });
        const failedEvents = await this.businessEventRepo.count({
            where: { organizationId, processingStatus: ProcessingStatus.FAILED },
        });
        // Calculate average processing latency (simplified)
        const recentEvents = await this.businessEventRepo.find({
            where: { organizationId, processingStatus: ProcessingStatus.COMPLETED },
            order: { createdAt: 'DESC' },
            take: 100,
        });
        const processingLatency = recentEvents.reduce((acc, event) => {
            if (event.processedAt) {
                const latency = event.processedAt.getTime() - event.createdAt.getTime();
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
WebhooksService = WebhooksService_1 = __decorate([
    Injectable(),
    __param(0, InjectRepository(WebhookConfiguration)),
    __param(1, InjectRepository(BusinessEvent)),
    __metadata("design:paramtypes", [Repository,
        Repository, typeof (_a = typeof WebhookSecurityService !== "undefined" && WebhookSecurityService) === "function" ? _a : Object, typeof (_b = typeof BusinessEventService !== "undefined" && BusinessEventService) === "function" ? _b : Object, typeof (_c = typeof IntegrationService !== "undefined" && IntegrationService) === "function" ? _c : Object])
], WebhooksService);
export { WebhooksService };
//# sourceMappingURL=webhooks.service.js.map