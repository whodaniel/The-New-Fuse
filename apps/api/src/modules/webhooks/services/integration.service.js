"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var IntegrationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationService = void 0;
const common_1 = require("@nestjs/common");
const types_1 = require("@the-new-fuse/types");
let IntegrationService = IntegrationService_1 = class IntegrationService {
    logger = new common_1.Logger(IntegrationService_1.name);
    async transformToBusinessEvent(source, payload, organizationId) {
        this.logger.debug(`Transforming payload from ${source}`);
        switch (source) {
            case types_1.IntegrationSource.STRIPE:
                return this.transformStripeEvent(payload, organizationId);
            case types_1.IntegrationSource.PAYPAL:
                return this.transformPayPalEvent(payload, organizationId);
            case types_1.IntegrationSource.SALESFORCE:
                return this.transformSalesforceEvent(payload, organizationId);
            case types_1.IntegrationSource.HUBSPOT:
                return this.transformHubSpotEvent(payload, organizationId);
            case types_1.IntegrationSource.PIPEDRIVE:
                return this.transformPipedriveEvent(payload, organizationId);
            case types_1.IntegrationSource.SQUARE:
                return this.transformSquareEvent(payload, organizationId);
            case types_1.IntegrationSource.NETSUITE:
                return this.transformNetSuiteEvent(payload, organizationId);
            case types_1.IntegrationSource.SAP:
                return this.transformSAPEvent(payload, organizationId);
            case types_1.IntegrationSource.QUICKBOOKS:
                return this.transformQuickBooksEvent(payload, organizationId);
            case types_1.IntegrationSource.ZAPIER:
                return this.transformZapierEvent(payload, organizationId);
            case types_1.IntegrationSource.WORKATO:
                return this.transformWorkatoEvent(payload, organizationId);
            case types_1.IntegrationSource.POWER_AUTOMATE:
                return this.transformPowerAutomateEvent(payload, organizationId);
            default:
                throw new Error(`Unsupported integration source: ${source}`);
        }
    }
    transformStripeEvent(payload, organizationId) {
        const eventType = this.mapStripeEventType(payload.type);
        return {
            type: eventType,
            source: types_1.IntegrationSource.STRIPE,
            data: {
                stripe_event_id: payload.id,
                event_type: payload.type,
                object: payload.data.object,
                raw_data: payload.data,
            },
            metadata: {
                organization_id: organizationId,
                user_id: payload.data.object.customer || '',
                correlation_id: payload.id,
                priority: this.determinePriority(eventType),
                retry_count: 0,
                max_retries: 3,
                source_metadata: {
                    api_version: payload.api_version,
                    request_id: payload.request?.id,
                    idempotency_key: payload.request?.idempotency_key,
                },
            },
            processing_status: 'pending',
        };
    }
    transformPayPalEvent(payload, organizationId) {
        const eventType = this.mapPayPalEventType(payload.event_type);
        return {
            type: eventType,
            source: types_1.IntegrationSource.PAYPAL,
            data: {
                paypal_event_id: payload.id,
                event_type: payload.event_type,
                resource: payload.resource,
                raw_data: payload,
            },
            metadata: {
                organization_id: organizationId,
                user_id: payload.resource?.payer?.payer_info?.payer_id || '',
                correlation_id: payload.id,
                priority: this.determinePriority(eventType),
                retry_count: 0,
                max_retries: 3,
                source_metadata: {
                    api_version: payload.api_version,
                    event_version: payload.event_version,
                },
            },
            processing_status: 'pending',
        };
    }
    transformSalesforceEvent(payload, organizationId) {
        const eventType = this.mapSalesforceEventType(payload.sobject);
        return {
            type: eventType,
            source: types_1.IntegrationSource.SALESFORCE,
            data: {
                salesforce_id: payload.sobject.Id,
                object_type: payload.sobject.attributes?.type,
                sobject: payload.sobject,
                raw_data: payload,
            },
            metadata: {
                organization_id: organizationId,
                user_id: payload.sobject.OwnerId || '',
                correlation_id: payload.sobject.Id,
                priority: this.determinePriority(eventType),
                retry_count: 0,
                max_retries: 3,
                source_metadata: {
                    organization_id: payload.organizationId,
                    action_id: payload.actionId,
                    action_type: payload.actionType,
                },
            },
            processing_status: 'pending',
        };
    }
    transformHubSpotEvent(payload, organizationId) {
        const eventType = this.mapHubSpotEventType(payload.subscriptionType, payload.changeType);
        return {
            type: eventType,
            source: types_1.IntegrationSource.HUBSPOT,
            data: {
                hubspot_event_id: payload.eventId,
                subscription_type: payload.subscriptionType,
                change_type: payload.changeType,
                object_id: payload.objectId,
                raw_data: payload,
            },
            metadata: {
                organization_id: organizationId,
                user_id: payload.ownerId || '',
                correlation_id: payload.eventId?.toString(),
                priority: this.determinePriority(eventType),
                retry_count: 0,
                max_retries: 3,
                source_metadata: {
                    portal_id: payload.portalId,
                    occurred_at: payload.occurredAt,
                    subscription_id: payload.subscriptionId,
                },
            },
            processing_status: 'pending',
        };
    }
    transformPipedriveEvent(payload, organizationId) {
        const eventType = this.mapPipedriveEventType(payload.event, payload.meta?.object);
        return {
            type: eventType,
            source: types_1.IntegrationSource.PIPEDRIVE,
            data: {
                pipedrive_event: payload.event,
                object_type: payload.meta?.object,
                current: payload.current,
                previous: payload.previous,
                raw_data: payload,
            },
            metadata: {
                organization_id: organizationId,
                user_id: payload.current?.user_id?.toString() || payload.current?.owner_id?.toString() || '',
                correlation_id: payload.current?.id?.toString(),
                priority: this.determinePriority(eventType),
                retry_count: 0,
                max_retries: 3,
                source_metadata: {
                    company_id: payload.meta?.company_id,
                    user_id: payload.meta?.user_id,
                    host: payload.meta?.host,
                },
            },
            processing_status: 'pending',
        };
    }
    transformSquareEvent(payload, organizationId) {
        const eventType = this.mapSquareEventType(payload.type);
        return {
            type: eventType,
            source: types_1.IntegrationSource.SQUARE,
            data: {
                square_event_id: payload.event_id,
                event_type: payload.type,
                data: payload.data,
                raw_data: payload,
            },
            metadata: {
                organization_id: organizationId,
                user_id: payload.merchant_id || '',
                correlation_id: payload.event_id,
                priority: this.determinePriority(eventType),
                retry_count: 0,
                max_retries: 3,
                source_metadata: {
                    location_id: payload.location_id,
                    merchant_id: payload.merchant_id,
                    created_at: payload.created_at,
                },
            },
            processing_status: 'pending',
        };
    }
    transformNetSuiteEvent(payload, organizationId) {
        const eventType = this.mapNetSuiteEventType(payload.eventType);
        return {
            type: eventType,
            source: types_1.IntegrationSource.NETSUITE,
            data: {
                netsuite_event: payload.eventType,
                record_type: payload.recordType,
                record_id: payload.recordId,
                raw_data: payload,
            },
            metadata: {
                organization_id: organizationId,
                user_id: payload.userId || '',
                correlation_id: payload.recordId,
                priority: this.determinePriority(eventType),
                retry_count: 0,
                max_retries: 3,
                source_metadata: {
                    account_id: payload.accountId,
                    subsidiary_id: payload.subsidiaryId,
                },
            },
            processing_status: 'pending',
        };
    }
    transformSAPEvent(payload, organizationId) {
        const eventType = this.mapSAPEventType(payload.eventType);
        return {
            type: eventType,
            source: types_1.IntegrationSource.SAP,
            data: {
                sap_event: payload.eventType,
                business_object: payload.businessObject,
                object_key: payload.objectKey,
                raw_data: payload,
            },
            metadata: {
                organization_id: organizationId,
                user_id: payload.userId || '',
                correlation_id: payload.objectKey,
                priority: this.determinePriority(eventType),
                retry_count: 0,
                max_retries: 3,
                source_metadata: {
                    client: payload.client,
                    system_id: payload.systemId,
                },
            },
            processing_status: 'pending',
        };
    }
    transformQuickBooksEvent(payload, organizationId) {
        const eventType = this.mapQuickBooksEventType(payload.eventNotifications?.[0]?.dataChangeEvent?.entities?.[0]?.name);
        const entity = payload.eventNotifications?.[0]?.dataChangeEvent?.entities?.[0];
        return {
            type: eventType,
            source: types_1.IntegrationSource.QUICKBOOKS,
            data: {
                qb_realm_id: payload.eventNotifications?.[0]?.realmId,
                entity_name: entity?.name,
                entity_id: entity?.id,
                operation: entity?.operation,
                raw_data: payload,
            },
            metadata: {
                organization_id: organizationId,
                user_id: '',
                correlation_id: entity?.id,
                priority: this.determinePriority(eventType),
                retry_count: 0,
                max_retries: 3,
                source_metadata: {
                    realm_id: payload.eventNotifications?.[0]?.realmId,
                    last_updated: entity?.lastUpdated,
                },
            },
            processing_status: 'pending',
        };
    }
    transformZapierEvent(payload, organizationId) {
        return {
            type: types_1.BusinessEventType.WORKFLOW_TRIGGERED,
            source: types_1.IntegrationSource.ZAPIER,
            data: {
                zapier_data: payload,
                trigger_source: payload.trigger_source || 'zapier',
                raw_data: payload,
            },
            metadata: {
                organization_id: organizationId,
                user_id: payload.user_id || '',
                correlation_id: payload.zap_meta_human_id || payload.id || '',
                priority: types_1.EventPriority.MEDIUM,
                retry_count: 0,
                max_retries: 3,
                source_metadata: {
                    zap_id: payload.zap_meta_human_id,
                    zap_name: payload.zap_meta_name,
                },
            },
            processing_status: 'pending',
        };
    }
    transformWorkatoEvent(payload, organizationId) {
        return {
            type: types_1.BusinessEventType.WORKFLOW_TRIGGERED,
            source: types_1.IntegrationSource.WORKATO,
            data: {
                workato_data: payload,
                recipe_id: payload.recipe_id,
                raw_data: payload,
            },
            metadata: {
                organization_id: organizationId,
                user_id: payload.user_id || '',
                correlation_id: payload.job_id || payload.recipe_id || '',
                priority: types_1.EventPriority.MEDIUM,
                retry_count: 0,
                max_retries: 3,
                source_metadata: {
                    recipe_id: payload.recipe_id,
                    job_id: payload.job_id,
                },
            },
            processing_status: 'pending',
        };
    }
    transformPowerAutomateEvent(payload, organizationId) {
        return {
            type: types_1.BusinessEventType.WORKFLOW_TRIGGERED,
            source: types_1.IntegrationSource.POWER_AUTOMATE,
            data: {
                power_automate_data: payload,
                flow_id: payload.flowId,
                raw_data: payload,
            },
            metadata: {
                organization_id: organizationId,
                user_id: payload.userId || '',
                correlation_id: payload.runId || payload.flowId || '',
                priority: types_1.EventPriority.MEDIUM,
                retry_count: 0,
                max_retries: 3,
                source_metadata: {
                    flow_id: payload.flowId,
                    run_id: payload.runId,
                    tenant_id: payload.tenantId,
                },
            },
            processing_status: 'pending',
        };
    }
    // Event type mapping methods
    mapStripeEventType(stripeEventType) {
        const eventMap = {
            'payment_intent.succeeded': types_1.BusinessEventType.PAYMENT_RECEIVED,
            'payment_intent.payment_failed': types_1.BusinessEventType.PAYMENT_RECEIVED,
            'invoice.payment_succeeded': types_1.BusinessEventType.PAYMENT_RECEIVED,
            'invoice.created': types_1.BusinessEventType.INVOICE_GENERATED,
            'customer.created': types_1.BusinessEventType.LEAD_CREATED,
            'customer.updated': types_1.BusinessEventType.CUSTOMER_UPDATED,
            'customer.subscription.created': types_1.BusinessEventType.SUBSCRIPTION_CHANGED,
            'customer.subscription.updated': types_1.BusinessEventType.SUBSCRIPTION_CHANGED,
            'customer.subscription.deleted': types_1.BusinessEventType.SUBSCRIPTION_CHANGED,
        };
        return eventMap[stripeEventType] || types_1.BusinessEventType.WORKFLOW_TRIGGERED;
    }
    mapPayPalEventType(paypalEventType) {
        const eventMap = {
            'PAYMENT.CAPTURE.COMPLETED': types_1.BusinessEventType.PAYMENT_RECEIVED,
            'PAYMENT.CAPTURE.DENIED': types_1.BusinessEventType.PAYMENT_RECEIVED,
            'BILLING.SUBSCRIPTION.CREATED': types_1.BusinessEventType.SUBSCRIPTION_CHANGED,
            'BILLING.SUBSCRIPTION.UPDATED': types_1.BusinessEventType.SUBSCRIPTION_CHANGED,
            'BILLING.SUBSCRIPTION.CANCELLED': types_1.BusinessEventType.SUBSCRIPTION_CHANGED,
        };
        return eventMap[paypalEventType] || types_1.BusinessEventType.WORKFLOW_TRIGGERED;
    }
    mapSalesforceEventType(sobjectType) {
        if (!sobjectType?.attributes?.type) {
            return types_1.BusinessEventType.WORKFLOW_TRIGGERED;
        }
        const eventMap = {
            'Lead': types_1.BusinessEventType.LEAD_CREATED,
            'Contact': types_1.BusinessEventType.CUSTOMER_UPDATED,
            'Account': types_1.BusinessEventType.CUSTOMER_UPDATED,
            'Opportunity': types_1.BusinessEventType.LEAD_CREATED,
            'Order': types_1.BusinessEventType.PRODUCT_SOLD,
        };
        return eventMap[sobjectType.attributes.type] || types_1.BusinessEventType.WORKFLOW_TRIGGERED;
    }
    mapHubSpotEventType(subscriptionType, changeType) {
        const eventMap = {
            'contact.creation': types_1.BusinessEventType.LEAD_CREATED,
            'contact.propertyChange': types_1.BusinessEventType.CUSTOMER_UPDATED,
            'deal.creation': types_1.BusinessEventType.LEAD_CREATED,
            'deal.propertyChange': types_1.BusinessEventType.LEAD_CREATED,
            'company.creation': types_1.BusinessEventType.CUSTOMER_UPDATED,
            'company.propertyChange': types_1.BusinessEventType.CUSTOMER_UPDATED,
        };
        const key = `${subscriptionType}.${changeType}`;
        return eventMap[key] || types_1.BusinessEventType.WORKFLOW_TRIGGERED;
    }
    mapPipedriveEventType(event, objectType) {
        const eventMap = {
            'added.deal': types_1.BusinessEventType.LEAD_CREATED,
            'updated.deal': types_1.BusinessEventType.LEAD_CREATED,
            'added.person': types_1.BusinessEventType.LEAD_CREATED,
            'updated.person': types_1.BusinessEventType.CUSTOMER_UPDATED,
            'added.organization': types_1.BusinessEventType.CUSTOMER_UPDATED,
            'updated.organization': types_1.BusinessEventType.CUSTOMER_UPDATED,
        };
        const key = `${event}.${objectType}`;
        return eventMap[key] || types_1.BusinessEventType.WORKFLOW_TRIGGERED;
    }
    mapSquareEventType(squareEventType) {
        const eventMap = {
            'payment.created': types_1.BusinessEventType.PAYMENT_RECEIVED,
            'payment.updated': types_1.BusinessEventType.PAYMENT_RECEIVED,
            'order.created': types_1.BusinessEventType.PRODUCT_SOLD,
            'order.updated': types_1.BusinessEventType.PRODUCT_SOLD,
            'invoice.created': types_1.BusinessEventType.INVOICE_GENERATED,
            'customer.created': types_1.BusinessEventType.LEAD_CREATED,
            'customer.updated': types_1.BusinessEventType.CUSTOMER_UPDATED,
        };
        return eventMap[squareEventType] || types_1.BusinessEventType.WORKFLOW_TRIGGERED;
    }
    mapNetSuiteEventType(eventType) {
        const eventMap = {
            'customer_created': types_1.BusinessEventType.LEAD_CREATED,
            'customer_updated': types_1.BusinessEventType.CUSTOMER_UPDATED,
            'sales_order_created': types_1.BusinessEventType.PRODUCT_SOLD,
            'invoice_created': types_1.BusinessEventType.INVOICE_GENERATED,
            'payment_received': types_1.BusinessEventType.PAYMENT_RECEIVED,
        };
        return eventMap[eventType] || types_1.BusinessEventType.WORKFLOW_TRIGGERED;
    }
    mapSAPEventType(eventType) {
        const eventMap = {
            'business_partner_created': types_1.BusinessEventType.LEAD_CREATED,
            'business_partner_changed': types_1.BusinessEventType.CUSTOMER_UPDATED,
            'sales_order_created': types_1.BusinessEventType.PRODUCT_SOLD,
            'invoice_created': types_1.BusinessEventType.INVOICE_GENERATED,
            'payment_received': types_1.BusinessEventType.PAYMENT_RECEIVED,
        };
        return eventMap[eventType] || types_1.BusinessEventType.WORKFLOW_TRIGGERED;
    }
    mapQuickBooksEventType(entityName) {
        const eventMap = {
            'Customer': types_1.BusinessEventType.CUSTOMER_UPDATED,
            'Invoice': types_1.BusinessEventType.INVOICE_GENERATED,
            'Payment': types_1.BusinessEventType.PAYMENT_RECEIVED,
            'SalesReceipt': types_1.BusinessEventType.PRODUCT_SOLD,
            'Estimate': types_1.BusinessEventType.LEAD_CREATED,
        };
        return eventMap[entityName] || types_1.BusinessEventType.WORKFLOW_TRIGGERED;
    }
    determinePriority(eventType) {
        const highPriorityEvents = [
            types_1.BusinessEventType.PAYMENT_RECEIVED,
            types_1.BusinessEventType.SUBSCRIPTION_CHANGED,
        ];
        const lowPriorityEvents = [
            types_1.BusinessEventType.CUSTOMER_UPDATED,
        ];
        if (highPriorityEvents.includes(eventType)) {
            return types_1.EventPriority.HIGH;
        }
        if (lowPriorityEvents.includes(eventType)) {
            return types_1.EventPriority.LOW;
        }
        return types_1.EventPriority.MEDIUM;
    }
};
exports.IntegrationService = IntegrationService;
exports.IntegrationService = IntegrationService = IntegrationService_1 = __decorate([
    (0, common_1.Injectable)()
], IntegrationService);
